from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.simulations import SimulationDetail, SimulationRequest, SimulationSummary
from app.services.simulation_service import (
    delete_simulation,
    get_simulation_detail,
    list_simulations,
    run_and_store_simulation,
)

router = APIRouter(prefix="/simulations", tags=["simulations"])


@router.post("/run", response_model=SimulationDetail)
def run_simulation(payload: SimulationRequest, db: Session = Depends(get_db)) -> SimulationDetail:
    return run_and_store_simulation(db, payload)


@router.get("", response_model=List[SimulationSummary])
def list_simulations_endpoint(
    order_by: str = "created_at",
    direction: str = "desc",
    asset: Optional[str] = None,
    db: Session = Depends(get_db),
) -> List[SimulationSummary]:
    return list_simulations(db, order_by=order_by, direction=direction, asset=asset)


@router.get("/{sim_id}", response_model=SimulationDetail)
def get_simulation(sim_id: int, db: Session = Depends(get_db)) -> SimulationDetail:
    return get_simulation_detail(db, sim_id)


@router.delete("/{sim_id}", status_code=204)
def delete_simulation_endpoint(sim_id: int, db: Session = Depends(get_db)) -> None:
    delete_simulation(db, sim_id)
