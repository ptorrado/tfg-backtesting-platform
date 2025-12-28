# app/backtest/common/metrics.py
from __future__ import annotations

from typing import List

from .types import EquityPoint


def compute_max_drawdown(equity_curve: List[EquityPoint]) -> float:
    """
    Max drawdown in ratio form (0.15 == -15%).
    """
    if not equity_curve:
        return 0.0

    peak = float(equity_curve[0].equity)
    max_dd = 0.0

    for p in equity_curve:
        eq = float(p.equity)
        if eq > peak:
            peak = eq
        dd = (peak - eq) / peak if peak != 0 else 0.0
        if dd > max_dd:
            max_dd = dd

    return float(max_dd)


def compute_sharpe(equity_curve: List[EquityPoint]) -> float:
    """
    Simple annualized Sharpe (no risk-free), clipped to [-5, 5] to avoid crazy values.
    Keeps behavior compatible with your previous implementation.
    """
    if len(equity_curve) < 2:
        return 0.0

    returns: List[float] = []
    for i in range(1, len(equity_curve)):
        prev = float(equity_curve[i - 1].equity)
        curr = float(equity_curve[i].equity)
        if prev != 0:
            returns.append((curr - prev) / prev)

    if len(returns) < 2:
        return 0.0

    avg = sum(returns) / len(returns)
    var = sum((r - avg) ** 2 for r in returns) / len(returns)  # keep same as before
    std = var**0.5
    if std == 0:
        return 0.0

    sharpe = (avg / std) * (252**0.5)
    if sharpe > 5.0:
        return 5.0
    if sharpe < -5.0:
        return -5.0
    return float(sharpe)
