# app/api/simulations.py

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

    equity_curve: List[EquityPoint]
    created_at: datetime

    number_of_trades: int
    winning_trades: int
    losing_trades: int
    accuracy: float               # 0–100 (%)

    trades: List[Trade]


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


class SimulationDetail(SimulationStored):
    """Detalle completo que devolvemos en GET /simulations/{id}"""
    pass


# ========= Endpoints conectados a la BBDD =========


@router.post("/run", response_model=SimulationDetail)
def run_simulation(
    payload: SimulationRequest,
    db: Session = Depends(get_db),
) -> SimulationDetail:
    """
    Lanza una simulación usando el motor real, guarda el resultado en BBDD
    y devuelve el detalle completo para la UI.
    """

    try:
        result: Dict[str, Any] = run_backtest(
            db=db,
            asset=payload.asset,
            algorithm=payload.algorithm,
            start_date=payload.start_date,
            end_date=payload.end_date,
            initial_capital=payload.initial_capital,
            params=payload.params or {},
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Guardamos en BBDD a partir del dict que devuelve el motor
    sim_row = save_simulation(db, result)

    # A partir del row + asset construimos el SimulationDetail
    asset = (
        db.query(models.Asset)
        .filter(models.Asset.id == sim_row.asset_id)
        .first()
    )

    equity_curve = [EquityPoint(**p) for p in sim_row.equity_curve]
    trades = [Trade(**t) for t in sim_row.trades]

    profit_loss = sim_row.final_equity - sim_row.initial_capital
    total_return = sim_row.total_return

    return SimulationDetail(
        id=sim_row.id,
        status=sim_row.status,
        asset=asset.symbol if asset else result.get("asset_symbol", payload.asset),
        algorithm=sim_row.algorithm,
        start_date=sim_row.start_date,
        end_date=sim_row.end_date,
        initial_capital=sim_row.initial_capital,
        final_equity=sim_row.final_equity,
        total_return=total_return,
        max_drawdown=sim_row.max_drawdown,
        sharpe_ratio=sim_row.sharpe_ratio,
        equity_curve=equity_curve,
        created_at=sim_row.created_at,
        number_of_trades=sim_row.number_of_trades,
        winning_trades=sim_row.winning_trades,
        losing_trades=sim_row.losing_trades,
        accuracy=sim_row.accuracy,
        trades=trades,
    )


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
    """

    query = (
        db.query(models.Simulation, models.Asset)
        .join(models.Asset, models.Simulation.asset_id == models.Asset.id)
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
            )
        )

    return summaries


@router.get("/{sim_id}", response_model=SimulationDetail)
def get_simulation(sim_id: int, db: Session = Depends(get_db)) -> SimulationDetail:
    """
    Detalle de una simulación concreta (para Result si vienes desde History
    o después de lanzar una nueva simulación).
    """
    row = (
        db.query(models.Simulation, models.Asset)
        .join(models.Asset, models.Simulation.asset_id == models.Asset.id)
        .filter(models.Simulation.id == sim_id)
        .first()
    )

    if not row:
        raise HTTPException(status_code=404, detail="Simulation not found")

    sim, asset = row

    equity_curve = [EquityPoint(**p) for p in sim.equity_curve]
    trades = [Trade(**t) for t in sim.trades]

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
        equity_curve=equity_curve,
        created_at=sim.created_at,
        number_of_trades=sim.number_of_trades,
        winning_trades=sim.winning_trades,
        losing_trades=sim.losing_trades,
        accuracy=sim.accuracy,
        trades=trades,
    )


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
