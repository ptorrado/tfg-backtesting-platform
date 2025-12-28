from __future__ import annotations

from datetime import date, datetime
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class SimulationRequest(BaseModel):
    """Payload sent by the frontend to run a simulation."""

    mode: Literal["single", "batch"] = "single"
    asset: str
    algorithm: str
    start_date: date
    end_date: date
    initial_capital: float
    params: Dict[str, float] = Field(default_factory=dict)
    batch_name: Optional[str] = None
    batch_group_id: Optional[str] = None


class EquityPoint(BaseModel):
    date: str
    equity: float


class Trade(BaseModel):
    date: str
    type: str
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
    total_return: float
    max_drawdown: float
    sharpe_ratio: float

    created_at: datetime

    number_of_trades: int
    winning_trades: int
    losing_trades: int
    accuracy: float

    batch_name: Optional[str] = None
    batch_group_id: Optional[str] = None
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

    batch_name: Optional[str] = None
    batch_group_id: Optional[str] = None


class SimulationDetail(SimulationStored):
    equity_curve: List[EquityPoint]
    trades: List[Trade]
    benchmark: Optional[BenchmarkMetrics] = None
