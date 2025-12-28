# app/backtest/engine.py

from __future__ import annotations

from datetime import date
from typing import Any, Dict

from sqlalchemy.orm import Session

from .algorithms.utils.discovery import get_algorithm_fn


def run_backtest(
    *,
    db: Session,
    asset: str,
    algorithm: str,
    start_date: date,
    end_date: date,
    initial_capital: float,
    params: Dict[str, Any] | None = None,
) -> Dict[str, Any]:
    """
    Punto de entrada único del motor.

    Busca el algoritmo en el registry y lo ejecuta con los parámetros estándar.
    """
    params = params or {}

    algo_fn = get_algorithm_fn(algorithm)
    return algo_fn(
        db,
        asset,
        start_date,
        end_date,
        initial_capital,
        params,
    )
