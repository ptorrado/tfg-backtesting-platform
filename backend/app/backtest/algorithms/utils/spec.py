# app/backtest/algorithms/spec.py
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable, Dict, List, Optional

from sqlalchemy.orm import Session
from datetime import date


AlgorithmFn = Callable[[Session, str, date, date, float, Dict[str, Any]], Dict[str, Any]]


@dataclass(frozen=True)
class ParamDef:
    name: str
    label: str
    type: str  # "int" | "float"
    min: float
    max: float
    step: float
    default: float
    description: Optional[str] = None


@dataclass(frozen=True)
class AlgorithmSpec:
    id: str
    name: str
    category: str
    description: str
    params: List[ParamDef]
    fn: AlgorithmFn
    hidden: bool = False
