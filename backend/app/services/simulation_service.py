from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from fastapi import HTTPException
from sqlalchemy import asc, desc
from sqlalchemy.orm import Session

from app.models import Asset, Simulation, SimulationEquityPoint, SimulationTrade
from app.backtest.engine import run_backtest
from app.db.crud_simulations import save_simulation
from app.schemas.simulations import (
    BenchmarkMetrics,
    EquityPoint,
    SimulationDetail,
    SimulationRequest,
    SimulationSummary,
    Trade,
)

logger = logging.getLogger(__name__)

BENCHMARK_ALGO_ID = "market_benchmark"
BENCHMARK_NAME = "Market Benchmark"


# =========================
# Internal helpers
# =========================


def _load_equity_curve(db: Session, simulation_id: int) -> List[EquityPoint]:
    rows = (
        db.query(SimulationEquityPoint)
        .filter(SimulationEquityPoint.simulation_id == simulation_id)
        .order_by(SimulationEquityPoint.date.asc())
        .all()
    )
    return [EquityPoint(date=r.date.isoformat(), equity=float(r.equity)) for r in rows]


def _load_trades(db: Session, simulation_id: int) -> List[Trade]:
    rows = (
        db.query(SimulationTrade)
        .filter(SimulationTrade.simulation_id == simulation_id)
        .order_by(SimulationTrade.date.asc())
        .all()
    )
    return [
        Trade(
            date=r.date.isoformat(),
            type=r.type,
            price=float(r.price),
            quantity=float(r.quantity),
            profit_loss=float(r.profit_loss),
        )
        for r in rows
    ]


def _find_benchmark_for_sim(db: Session, sim: Simulation) -> Optional[BenchmarkMetrics]:
    bench = (
        db.query(Simulation)
        .filter(
            Simulation.algorithm == BENCHMARK_ALGO_ID,
            Simulation.asset_id == sim.asset_id,
            Simulation.start_date == sim.start_date,
            Simulation.end_date == sim.end_date,
            Simulation.initial_capital == sim.initial_capital,
        )
        .order_by(Simulation.created_at.desc())
        .first()
    )
    if bench is None:
        return None

    return BenchmarkMetrics(
        name=BENCHMARK_NAME,
        final_equity=float(bench.final_equity),
        total_return=float(bench.total_return),
        max_drawdown=float(bench.max_drawdown),
        sharpe_ratio=float(bench.sharpe_ratio),
        equity_curve=_load_equity_curve(db, bench.id),
    )


def _build_simulation_detail(db: Session, sim: Simulation) -> SimulationDetail:
    asset = db.query(Asset).filter(Asset.id == sim.asset_id).first()
    if asset is None:
        raise HTTPException(status_code=500, detail="Asset not found for simulation")

    return SimulationDetail(
        id=sim.id,
        status=sim.status,
        asset=asset.symbol,
        algorithm=sim.algorithm,
        start_date=sim.start_date,
        end_date=sim.end_date,
        initial_capital=float(sim.initial_capital),
        final_equity=float(sim.final_equity),
        total_return=float(sim.total_return),
        max_drawdown=float(sim.max_drawdown),
        sharpe_ratio=float(sim.sharpe_ratio),
        created_at=sim.created_at,
        number_of_trades=int(sim.number_of_trades),
        winning_trades=int(sim.winning_trades),
        losing_trades=int(sim.losing_trades),
        accuracy=float(sim.accuracy),
        equity_curve=_load_equity_curve(db, sim.id),
        trades=_load_trades(db, sim.id),
        benchmark=_find_benchmark_for_sim(db, sim),
        batch_name=sim.batch_name,
        batch_group_id=sim.batch_group_id,
        params=sim.params or None,
    )


# =========================
# Public service functions
# =========================


def run_and_store_simulation(
    db: Session, payload: SimulationRequest
) -> SimulationDetail:
    """
    Runs a backtest, stores the result in DB and returns the full detail.
    Also tries to compute and store a 'market_benchmark' for comparison.
    """
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
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        # e.g. missing optional dependencies such as backtrader/pandas
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    # Persist request metadata along with the backtest result
    if payload.params:
        result_main["params"] = dict(payload.params)
    if payload.batch_name:
        result_main["batch_name"] = payload.batch_name
    if payload.batch_group_id:
        result_main["batch_group_id"] = payload.batch_group_id

    sim_main = save_simulation(db, result_main)

    # Best-effort benchmark (must not fail the main request)
    try:
        result_bench: Dict[str, Any] = run_backtest(
            db=db,
            asset=payload.asset,
            algorithm=BENCHMARK_ALGO_ID,
            start_date=payload.start_date,
            end_date=payload.end_date,
            initial_capital=payload.initial_capital,
            params={},
        )
        save_simulation(db, result_bench)
    except Exception:  # noqa: BLE001
        logger.warning("Market benchmark failed", exc_info=True)

    return _build_simulation_detail(db, sim_main)


def list_simulations(
    db: Session,
    *,
    order_by: str = "created_at",
    direction: str = "desc",
    asset: Optional[str] = None,
    page: int = 1,
    page_size: int = 50,
) -> Dict[str, Any]:
    """
    List simulations for the History view with pagination.
    Supports sorting and optional filtering by asset symbol.
    Excludes the market benchmark runs.
    
    Returns a dictionary with:
    - items: List of SimulationSummary
    - total: Total count of simulations
    - page: Current page number
    - page_size: Items per page
    - total_pages: Total number of pages
    """
    order_by = order_by.lower().strip()
    direction = direction.lower().strip()

    if order_by not in {"created_at", "profit_loss"}:
        raise HTTPException(
            status_code=400, detail="order_by must be 'created_at' or 'profit_loss'"
        )
    if direction not in {"asc", "desc"}:
        raise HTTPException(status_code=400, detail="direction must be 'asc' or 'desc'")
    
    if page < 1:
        raise HTTPException(status_code=400, detail="page must be >= 1")
    if page_size < 1 or page_size > 200:
        raise HTTPException(status_code=400, detail="page_size must be between 1 and 200")

    # Base query
    query = (
        db.query(Simulation, Asset)
        .join(Asset, Simulation.asset_id == Asset.id)
        .filter(Simulation.algorithm != BENCHMARK_ALGO_ID)
    )

    if asset:
        # Search in both asset symbol and batch name (partial, case-insensitive)
        from sqlalchemy import or_
        query = query.filter(
            or_(
                Asset.symbol.ilike(f"%{asset}%"),
                Simulation.batch_name.ilike(f"%{asset}%")
            )
        )

    # Get total count before pagination
    total = query.count()
    
    # Calculate total pages
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    # Apply ordering
    expr = (
        Simulation.final_equity - Simulation.initial_capital
        if order_by == "profit_loss"
        else Simulation.created_at
    )

    query = query.order_by(asc(expr) if direction == "asc" else desc(expr))
    
    # Apply pagination
    offset = (page - 1) * page_size
    rows = query.limit(page_size).offset(offset).all()

    # Build response items
    out: List[SimulationSummary] = []
    for sim, asset_row in rows:
        profit_loss = float(sim.final_equity) - float(sim.initial_capital)
        profit_loss_pct = (
            (profit_loss / float(sim.initial_capital)) * 100.0
            if sim.initial_capital
            else 0.0
        )

        out.append(
            SimulationSummary(
                id=sim.id,
                created_at=sim.created_at,
                asset=asset_row.symbol,
                algorithm=sim.algorithm,
                start_date=sim.start_date,
                end_date=sim.end_date,
                initial_capital=float(sim.initial_capital),
                profit_loss=profit_loss,
                profit_loss_percentage=profit_loss_pct,
                batch_name=sim.batch_name,
                batch_group_id=sim.batch_group_id,
                params=sim.params or None,
            )
        )

    return {
        "items": out,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


def get_simulation_detail(db: Session, sim_id: int) -> SimulationDetail:
    """Return the full detail for a given simulation id."""
    sim = db.query(Simulation).filter(Simulation.id == sim_id).first()
    if sim is None:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return _build_simulation_detail(db, sim)


def delete_simulation(db: Session, sim_id: int) -> None:
    """Delete a simulation and its dependent rows (equity/trades) via cascade."""
    sim = db.query(Simulation).filter(Simulation.id == sim_id).first()
    if sim is None:
        raise HTTPException(status_code=404, detail="Simulation not found")

    db.delete(sim)
    db.commit()
