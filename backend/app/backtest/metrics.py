from __future__ import annotations
from typing import List
from app.backtest.types import EquityPoint


def compute_max_drawdown(equity_curve: List[EquityPoint]) -> float:
    if not equity_curve:
        return 0.0

    peak = equity_curve[0].equity
    max_dd = 0.0
    for p in equity_curve:
        if p.equity > peak:
            peak = p.equity
        dd = (peak - p.equity) / peak if peak else 0.0
        if dd > max_dd:
            max_dd = dd
    return float(max_dd)


def compute_sharpe(equity_curve: List[EquityPoint]) -> float:
    if len(equity_curve) < 2:
        return 0.0

    rets: List[float] = []
    for i in range(1, len(equity_curve)):
        prev = equity_curve[i - 1].equity
        curr = equity_curve[i].equity
        if prev:
            rets.append((curr - prev) / prev)

    if len(rets) < 2:
        return 0.0

    avg = sum(rets) / len(rets)
    var = sum((r - avg) ** 2 for r in rets) / len(rets)
    std = var ** 0.5
    if std == 0:
        return 0.0

    sharpe = (avg / std) * (252 ** 0.5)
    return float(max(min(sharpe, 5.0), -5.0))
