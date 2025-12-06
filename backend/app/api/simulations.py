# app/routers/simulations.py
from __future__ import annotations

from datetime import date, datetime
from typing import Any, Dict, List, Literal, Optional

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc

from ..db import get_db
from .. import models
from ..crud_simulations import save_simulation
from ..backtest.engine import run_backtest

router = APIRouter(prefix="/simulations", tags=["simulations"])


# ========= Modelos de entrada (lo que envía el frontend) =========


class SimulationRequest(BaseModel):
  mode: Literal["single", "batch"] = "single"
  asset: str
  algorithm: str
  start_date: date
  end_date: date
  initial_capital: float
  params: Dict[str, float] = Field(default_factory=dict)
  # 👇 NUEVO: datos de batch (solo en modo batch)
  batch_name: Optional[str] = None
  batch_group_id: Optional[str] = None


# ========= Modelos que usamos en la API =========


class EquityPoint(BaseModel):
  date: str
  equity: float


class Trade(BaseModel):
  date: str
  type: str          # "buy" o "sell"
  price: float
  quantity: float
  profit_loss: float


class BenchmarkMetrics(BaseModel):
  name: str
  final_equity: float
  total_return: float
  max_drawdown: float
  sharpe_ratio: float
  equity_curve: List[EquityPoint]


class SimulationStored(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: int
  status: str

  asset: str
  algorithm: str
  start_date: date
  end_date: date
  initial_capital: float

  final_equity: float
  total_return: float           # en tanto 1 (0.03 = +3%)
  max_drawdown: float
  sharpe_ratio: float

  created_at: datetime

  number_of_trades: int
  winning_trades: int
  losing_trades: int
  accuracy: float               # 0–100 (%)

  # 👇 NUEVO: info de batch
  batch_name: Optional[str] = None
  batch_group_id: Optional[str] = None

  # 👇 parámetros usados en el backtest (modo avanzado)
  params: Optional[Dict[str, float]] = None


class SimulationSummary(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: int
  created_at: datetime
  asset: str
  algorithm: str
  start_date: date
  end_date: date
  initial_capital: float
  profit_loss: float
  profit_loss_percentage: float

  # 👇 NUEVO: info de batch para History
  batch_name: Optional[str] = None
  batch_group_id: Optional[str] = None


class SimulationDetail(SimulationStored):
  """Detalle completo que devolvemos en GET /simulations/{id}"""
  equity_curve: List[EquityPoint]
  trades: List[Trade]
  benchmark: Optional[BenchmarkMetrics] = None


# ========= Helpers internos =========


def _load_equity_curve(
    db: Session, simulation_id: int
) -> List[EquityPoint]:
  rows = (
      db.query(models.SimulationEquityPoint)
      .filter(models.SimulationEquityPoint.simulation_id == simulation_id)
      .order_by(models.SimulationEquityPoint.date.asc())
      .all()
  )
  return [
      EquityPoint(
          date=row.date.isoformat(),
          equity=float(row.equity),
      )
      for row in rows
  ]


def _load_trades(db: Session, simulation_id: int) -> List[Trade]:
  rows = (
      db.query(models.SimulationTrade)
      .filter(models.SimulationTrade.simulation_id == simulation_id)
      .order_by(models.SimulationTrade.date.asc())
      .all()
  )
  return [
      Trade(
          date=row.date.isoformat(),
          type=row.type,
          price=float(row.price),
          quantity=float(row.quantity),
          profit_loss=float(row.profit_loss),
      )
      for row in rows
  ]


def _find_benchmark_for_sim(
    db: Session, sim: models.Simulation
) -> Optional[BenchmarkMetrics]:
  """
  Busca una simulación omnisciente compatible (mismo asset, fechas y capital).
  """
  bench = (
      db.query(models.Simulation)
      .filter(
          models.Simulation.algorithm == "omniscient_benchmark",
          models.Simulation.asset_id == sim.asset_id,
          models.Simulation.start_date == sim.start_date,
          models.Simulation.end_date == sim.end_date,
          models.Simulation.initial_capital == sim.initial_capital,
      )
      .order_by(models.Simulation.created_at.desc())
      .first()
  )

  if not bench:
    return None

  equity_curve = _load_equity_curve(db, bench.id)

  return BenchmarkMetrics(
      name="Omniscient benchmark",
      final_equity=float(bench.final_equity),
      total_return=float(bench.total_return),
      max_drawdown=float(bench.max_drawdown),
      sharpe_ratio=float(bench.sharpe_ratio),
      equity_curve=equity_curve,
  )


def _build_simulation_detail(
    db: Session,
    sim: models.Simulation,
) -> SimulationDetail:
  asset = (
      db.query(models.Asset)
      .filter(models.Asset.id == sim.asset_id)
      .first()
  )

  if not asset:
    raise HTTPException(status_code=500, detail="Asset not found")

  equity_curve = _load_equity_curve(db, sim.id)
  trades = _load_trades(db, sim.id)
  benchmark = _find_benchmark_for_sim(db, sim)

  return SimulationDetail(
      id=sim.id,
      status=sim.status,
      asset=asset.symbol,
      algorithm=sim.algorithm,
      start_date=sim.start_date,
      end_date=sim.end_date,
      initial_capital=sim.initial_capital,
      final_equity=sim.final_equity,
      total_return=sim.total_return,
      max_drawdown=sim.max_drawdown,
      sharpe_ratio=sim.sharpe_ratio,
      created_at=sim.created_at,
      number_of_trades=sim.number_of_trades,
      winning_trades=sim.winning_trades,
      losing_trades=sim.losing_trades,
      accuracy=sim.accuracy,
      equity_curve=equity_curve,
      trades=trades,
      benchmark=benchmark,
      batch_name=sim.batch_name,
      batch_group_id=sim.batch_group_id,
      # 👇 incluimos los params almacenados (si existen)
      params=sim.params or None,
  )


# ========= Endpoints conectados a la BBDD =========


@router.post("/run", response_model=SimulationDetail)
def run_simulation(
    payload: SimulationRequest,
    db: Session = Depends(get_db),
) -> SimulationDetail:
  """
  Lanza una simulación usando el motor real, guarda el resultado en BBDD
  y devuelve el detalle completo para la UI.

  Además, ejecuta SIEMPRE el benchmark omnisciente para ese mismo asset
  y rango de fechas (y lo guarda como otra simulación).
  """

  # ---- Simulación principal ----
  try:
    result_main: Dict[str, Any] = run_backtest(
        db=db,
        asset=payload.asset,
        algorithm=payload.algorithm,
        start_date=payload.start_date,
        end_date=payload.end_date,
        initial_capital=payload.initial_capital,
        params=payload.params or {},
    )

    # 👇 Guardamos también los parámetros usados para esta simulación
    if payload.params:
      result_main["params"] = dict(payload.params)

    # 👇 Info de batch (si viene)
    if payload.batch_name:
      result_main["batch_name"] = payload.batch_name
    if payload.batch_group_id:
      result_main["batch_group_id"] = payload.batch_group_id

  except ValueError as e:
    raise HTTPException(status_code=400, detail=str(e))

  sim_main = save_simulation(db, result_main)

  # ---- Benchmark omnisciente (no bloqueante si falla) ----
  try:
    result_bench: Dict[str, Any] = run_backtest(
        db=db,
        asset=payload.asset,
        algorithm="omniscient_benchmark",
        start_date=payload.start_date,
        end_date=payload.end_date,
        initial_capital=payload.initial_capital,
        params={},
    )
    save_simulation(db, result_bench)
  except Exception as e:  # noqa: BLE001
    print(f"[WARN] Omniscient benchmark failed: {e!r}")

  return _build_simulation_detail(db, sim_main)


@router.get("", response_model=List[SimulationSummary])
def list_simulations(
    order_by: str = "created_at",
    direction: str = "desc",
    asset: Optional[str] = None,
    db: Session = Depends(get_db),
) -> List[SimulationSummary]:
  """
  Lista de simulaciones para la página de History, leyendo desde la BBDD.
  Permite (opcionalmente) ordenar por fecha o P&L y filtrar por asset.
  Excluye el benchmark omnisciente del listado.
  """

  query = (
      db.query(models.Simulation, models.Asset)
      .join(models.Asset, models.Simulation.asset_id == models.Asset.id)
      .filter(models.Simulation.algorithm != "omniscient_benchmark")
  )

  if asset:
    query = query.filter(models.Asset.symbol == asset)

  order_by = order_by.lower()
  direction = direction.lower()

  if order_by == "profit_loss":
    expr = models.Simulation.final_equity - models.Simulation.initial_capital
  else:
    expr = models.Simulation.created_at

  if direction == "asc":
    query = query.order_by(asc(expr))
  else:
    query = query.order_by(desc(expr))

  rows = query.limit(200).all()

  summaries: List[SimulationSummary] = []
  for sim, asset_row in rows:
    profit_loss = sim.final_equity - sim.initial_capital
    profit_loss_pct = (
        (profit_loss / sim.initial_capital) * 100.0
        if sim.initial_capital
        else 0.0
    )

    summaries.append(
        SimulationSummary(
            id=sim.id,
            created_at=sim.created_at,
            asset=asset_row.symbol,
            algorithm=sim.algorithm,
            start_date=sim.start_date,
            end_date=sim.end_date,
            initial_capital=sim.initial_capital,
            profit_loss=profit_loss,
            profit_loss_percentage=profit_loss_pct,
            batch_name=sim.batch_name,
            batch_group_id=sim.batch_group_id,
        )
    )

  return summaries


@router.get("/{sim_id}", response_model=SimulationDetail)
def get_simulation(
    sim_id: int,
    db: Session = Depends(get_db),
) -> SimulationDetail:
  """
  Detalle de una simulación concreta (para Result si vienes desde History
  o después de lanzar una nueva simulación).
  Incluye, si existe, el benchmark omnisciente asociado.
  """
  sim = (
      db.query(models.Simulation)
      .filter(models.Simulation.id == sim_id)
      .first()
  )

  if not sim:
    raise HTTPException(status_code=404, detail="Simulation not found")

  return _build_simulation_detail(db, sim)


@router.delete("/{sim_id}", status_code=204)
def delete_simulation(sim_id: int, db: Session = Depends(get_db)) -> None:
  """
  Elimina una simulación de la BBDD.
  """
  sim = (
      db.query(models.Simulation)
      .filter(models.Simulation.id == sim_id)
      .first()
  )

  if not sim:
    raise HTTPException(status_code=404, detail="Simulation not found")

  db.delete(sim)
  db.commit()
  # 204 No Content -> no devolvemos body
