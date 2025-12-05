# app/api/algorithms.py

from typing import List

from fastapi import APIRouter
from pydantic import BaseModel

from ..backtest.registry import list_algorithm_definitions

router = APIRouter(prefix="/algorithms", tags=["algorithms"])


class AlgorithmParam(BaseModel):
    name: str
    label: str
    type: str          # "int" | "float"
    min: float
    max: float
    step: float
    default: float
    description: str | None = None


class AlgorithmInfo(BaseModel):
    id: str
    name: str
    category: str
    description: str
    params: List[AlgorithmParam]


@router.get("", response_model=List[AlgorithmInfo])
def get_algorithms() -> List[AlgorithmInfo]:
    """
    Devuelve la lista de algoritmos registrados en el motor.
    SOLO aparecerán los que estén en backtest.registry.ALGORITHMS.
    """
    return list_algorithm_definitions()
