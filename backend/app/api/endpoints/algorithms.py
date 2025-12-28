from __future__ import annotations

from typing import List

from fastapi import APIRouter

from backend.app.backtest.algorithms.utils.discovery import list_algorithm_definitions
from app.schemas.algorithms import AlgorithmInfo

router = APIRouter(prefix="/algorithms", tags=["algorithms"])


@router.get("", response_model=List[AlgorithmInfo])
def list_algorithms() -> List[AlgorithmInfo]:
    """Return the list of algorithms available to the UI (excluding hidden ones)."""
    return list_algorithm_definitions()
