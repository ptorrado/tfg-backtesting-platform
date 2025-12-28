# app/backtest/algorithms/buy_and_hold.py
from __future__ import annotations

from datetime import date
from typing import Any, Dict, List

from sqlalchemy.orm import Session

from app.backtest.common import (
    Candle,
    EquityPoint,
    Trade,
    compute_max_drawdown,
    compute_sharpe,
    get_asset_meta,
    load_ohlcv_from_db,
    trade_stats,
)

from .utils.spec import AlgorithmSpec



def run_buy_and_hold(
    db: Session,
    asset_symbol: str,
    start_date: date,
    end_date: date,
    initial_capital: float,
    params: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Buy & Hold:
    - Buy at the first available close in the range
    - Hold until the last available close
    - Long-only, no rebalancing
    """
    candles: List[Candle] = load_ohlcv_from_db(
        db,
        asset_symbol=asset_symbol,
        start=start_date,
        end=end_date,
    )

    first_candle = candles[0]
    last_candle = candles[-1]

    entry_date = first_candle.ts.date()
    exit_date = last_candle.ts.date()

    entry_price = float(first_candle.close)
    exit_price = float(last_candle.close)

    size = (float(initial_capital) / entry_price) if entry_price > 0 else 0.0

    equity_curve: List[EquityPoint] = []
    if size > 0:
        for c in candles:
            equity_curve.append(
                EquityPoint(date=c.ts.date().isoformat(), equity=size * float(c.close))
            )
        final_equity = size * exit_price
    else:
        for c in candles:
            equity_curve.append(
                EquityPoint(date=c.ts.date().isoformat(), equity=float(initial_capital))
            )
        final_equity = float(initial_capital)

    trades: List[Trade] = []
    if size > 0:
        trades.append(
            Trade(
                date=entry_date.isoformat(),
                type="buy",
                price=entry_price,
                quantity=size,
                profit_loss=0.0,
            )
        )
        pnl = float(final_equity) - float(initial_capital)
        trades.append(
            Trade(
                date=exit_date.isoformat(),
                type="sell",
                price=exit_price,
                quantity=size,
                profit_loss=pnl,
            )
        )

    total_return = (
        float(final_equity) / float(initial_capital) - 1.0 if initial_capital != 0 else 0.0
    )
    max_dd = compute_max_drawdown(equity_curve)
    sharpe = compute_sharpe(equity_curve)
    winning, losing, accuracy = trade_stats(trades)

    asset_name, asset_type = get_asset_meta(db, asset_symbol=asset_symbol)

    return {
        "status": "completed",
        "asset_symbol": asset_symbol,
        "asset_name": asset_name,
        "asset_type": asset_type,
        "algorithm": "buy_and_hold",
        "start_date": start_date,
        "end_date": end_date,
        "initial_capital": float(initial_capital),
        "final_equity": float(final_equity),
        "total_return": float(total_return),
        "max_drawdown": float(max_dd),
        "sharpe_ratio": float(sharpe),
        "equity_curve": [{"date": p.date, "equity": float(p.equity)} for p in equity_curve],
        "trades": [
            {
                "date": t.date,
                "type": t.type,
                "price": float(t.price),
                "quantity": float(t.quantity),
                "profit_loss": float(t.profit_loss),
            }
            for t in trades
        ],
        "number_of_trades": len(trades),
        "winning_trades": winning,
        "losing_trades": losing,
        "accuracy": float(accuracy),
    }


ALGORITHM = AlgorithmSpec(
    id="buy_and_hold",
    name="Buy & Hold",
    category="Baseline",
    description="Buys at the first close in the period and holds until the end date.",
    params=[],
    fn=run_buy_and_hold,
)
