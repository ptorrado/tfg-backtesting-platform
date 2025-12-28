# app/backtest/common/types.py
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class Candle:
    ts: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float


@dataclass(frozen=True)
class EquityPoint:
    date: str
    equity: float


@dataclass(frozen=True)
class Trade:
    date: str
    type: str  # "buy" | "sell"
    price: float
    quantity: float
    profit_loss: float
