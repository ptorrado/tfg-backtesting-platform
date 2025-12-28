# app/backtest/common/stats.py
from __future__ import annotations

from typing import List, Tuple

from .types import Trade


def trade_stats(trades: List[Trade]) -> Tuple[int, int, float]:
    """
    Returns (winning_trades, losing_trades, accuracy_percent),
    computed only on closed trades (sell side).
    """
    sell_trades = [t for t in trades if t.type == "sell"]
    winning = sum(1 for t in sell_trades if float(t.profit_loss) > 0)
    losing = sum(1 for t in sell_trades if float(t.profit_loss) < 0)
    total_closed = winning + losing
    accuracy = (winning / total_closed) * 100.0 if total_closed > 0 else 0.0
    return winning, losing, float(accuracy)
