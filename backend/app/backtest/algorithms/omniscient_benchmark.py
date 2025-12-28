# app/backtest/algorithms/omniscient_benchmark.py
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



def run_omniscient_benchmark(
    db: Session,
    asset_symbol: str,
    start_date: date,
    end_date: date,
    initial_capital: float,
    params: Dict[str, Any] | None = None,
) -> Dict[str, Any]:
    """
    Omniscient benchmark:
    - Knows the future
    - Long-only or cash
    - Enters before up moves and exits before down moves
    """
    candles: List[Candle] = load_ohlcv_from_db(
        db,
        asset_symbol=asset_symbol,
        start=start_date,
        end=end_date,
    )

    cash = float(initial_capital)
    position = 0.0
    entry_price = 0.0

    equity_curve: List[EquityPoint] = []
    trades: List[Trade] = []

    n = len(candles)
    for i, candle in enumerate(candles):
        price = float(candle.close)
        d = candle.ts.date().isoformat()

        if i < n - 1:
            next_price = float(candles[i + 1].close)

            if position == 0.0 and next_price > price:
                qty = cash / price if price > 0 else 0.0
                if qty > 0.0:
                    position = qty
                    cash -= qty * price
                    entry_price = price
                    trades.append(Trade(date=d, type="buy", price=price, quantity=qty, profit_loss=0.0))

            elif position > 0.0 and next_price < price:
                cash += position * price
                pnl = (price - entry_price) * position
                trades.append(Trade(date=d, type="sell", price=price, quantity=position, profit_loss=pnl))
                position = 0.0
                entry_price = 0.0
        else:
            if position > 0.0:
                cash += position * price
                pnl = (price - entry_price) * position
                trades.append(Trade(date=d, type="sell", price=price, quantity=position, profit_loss=pnl))
                position = 0.0
                entry_price = 0.0

        equity_curve.append(EquityPoint(date=d, equity=cash + position * price))

    final_equity = float(equity_curve[-1].equity) if equity_curve else float(initial_capital)
    total_return = final_equity / float(initial_capital) - 1.0 if initial_capital != 0 else 0.0

    max_dd = compute_max_drawdown(equity_curve)
    sharpe = compute_sharpe(equity_curve)
    winning, losing, accuracy = trade_stats(trades)

    asset_name, asset_type = get_asset_meta(db, asset_symbol=asset_symbol)

    return {
        "status": "completed",
        "asset_symbol": asset_symbol,
        "asset_name": asset_name,
        "asset_type": asset_type,
        "algorithm": "omniscient_benchmark",
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
    id="omniscient_benchmark",
    name="Omniscient benchmark",
    category="Benchmark",
    description="Ideal benchmark that knows future prices.",
    params=[],
    fn=run_omniscient_benchmark,
    hidden=True,
)