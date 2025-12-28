from __future__ import annotations
from dataclasses import dataclass
from datetime import date, datetime
from typing import Any, Dict, List, Literal, Optional


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
    date: date
    equity: float


@dataclass(frozen=True)
class Trade:
    date: date
    type: Literal["buy", "sell"]
    price: float
    quantity: float
    profit_loss: float


@dataclass(frozen=True)
class BacktestResult:
    status: str
    asset_symbol: str
    asset_name: str
    asset_type: str
    algorithm: str
    start_date: date
    end_date: date
    initial_capital: float
    final_equity: float
    total_return: float
    max_drawdown: float
    sharpe_ratio: float
    equity_curve: List[EquityPoint]
    trades: List[Trade]
    number_of_trades: int
    winning_trades: int
    losing_trades: int
    accuracy: float
    params: Optional[Dict[str, Any]] = None
    batch_name: Optional[str] = None
    batch_group_id: Optional[str] = None

    def to_legacy_dict(self) -> Dict[str, Any]:
        """Compatibilidad con tu save_simulation actual (fase 3 lo quitamos)."""
        return {
            "status": self.status,
            "asset_symbol": self.asset_symbol,
            "asset_name": self.asset_name,
            "asset_type": self.asset_type,
            "algorithm": self.algorithm,
            "start_date": self.start_date,
            "end_date": self.end_date,
            "initial_capital": self.initial_capital,
            "final_equity": self.final_equity,
            "total_return": self.total_return,
            "max_drawdown": self.max_drawdown,
            "sharpe_ratio": self.sharpe_ratio,
            "equity_curve": [{"date": p.date.isoformat(), "equity": float(p.equity)} for p in self.equity_curve],
            "trades": [{
                "date": t.date.isoformat(),
                "type": t.type,
                "price": float(t.price),
                "quantity": float(t.quantity),
                "profit_loss": float(t.profit_loss),
            } for t in self.trades],
            "number_of_trades": self.number_of_trades,
            "winning_trades": self.winning_trades,
            "losing_trades": self.losing_trades,
            "accuracy": self.accuracy,
            "params": self.params,
            "batch_name": self.batch_name,
            "batch_group_id": self.batch_group_id,
        }
