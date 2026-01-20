# app/backtest/algorithms/market_benchmark.py
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



def run_market_benchmark(
    db: Session,
    asset_symbol: str,
    start_date: date,
    end_date: date,
    initial_capital: float,
    params: Dict[str, Any] | None = None,
) -> Dict[str, Any]:
    """
    Standard Buy & Hold Benchmark:
    - Buys 100% of capital on the first available day.
    - Holds until the last available day.
    - Serves as the "Market" comparison baseline.
    """
    candles: List[Candle] = load_ohlcv_from_db(
        db,
        asset_symbol=asset_symbol,
        start=start_date,
        end=end_date,
    )

    if not candles:
        return {
            "status": "error",
            "message": "No data found",
            "equity_curve": [],
            "trades": [],
        }

    # --- Buy & Hold Logic ---
    # 1. Buy at Open/Close of first candle
    # 2. Sell at Close of last candle (to realize PnL for stats)
    
    prices = [float(c.close) for c in candles]
    dates = [c.ts.date().isoformat() for c in candles]
    n = len(prices)
    
    cash = float(initial_capital)
    position = 0.0
    equity_curve: List[EquityPoint] = []
    trades_list: List[Trade] = []
    
    if n > 0:
        # EXECUTE BUY ON DAY 1
        first_price = prices[0]
        first_date = dates[0]
        
        qty = cash / first_price
        if qty > 0:
            position = qty
            cash = 0.0 # All in
            trades_list.append(Trade(
                date=first_date,
                type="buy",
                price=first_price,
                quantity=qty,
                profit_loss=0.0
            ))
            
        # TRACK EQUITY
        for i in range(n):
            curr_price = prices[i]
            d = dates[i]
            
            # If it's the very last candle, we simulate a SELL to close the position for stats
            if i == n - 1 and position > 0:
                pnl = (curr_price - first_price) * position
                trades_list.append(Trade(
                    date=d,
                    type="sell",
                    price=curr_price,
                    quantity=position,
                    profit_loss=pnl
                ))
                # Cash becomes realized
                cash = position * curr_price
                position = 0.0
            
            # Current Equity
            val = cash + (position * curr_price)
            equity_curve.append(EquityPoint(date=d, equity=val))

    final_equity = float(equity_curve[-1].equity) if equity_curve else float(initial_capital)
    total_return = (final_equity / float(initial_capital) - 1.0) if initial_capital != 0 else 0.0

    max_dd = compute_max_drawdown(equity_curve)
    sharpe = compute_sharpe(equity_curve)
    winning, losing, accuracy = trade_stats(trades_list)

    asset_name, asset_type = get_asset_meta(db, asset_symbol=asset_symbol)

    return {
        "status": "completed",
        "asset_symbol": asset_symbol,
        "asset_name": asset_name,
        "asset_type": asset_type,
        "algorithm": "market_benchmark",
        "start_date": start_date,
        "end_date": end_date,
        "initial_capital": float(initial_capital),
        "final_equity": final_equity,
        "total_return": total_return,
        "max_drawdown": max_dd,
        "sharpe_ratio": sharpe,
        "equity_curve": [{"date": p.date, "equity": float(p.equity)} for p in equity_curve],
        "trades": [
            {
                "date": t.date,
                "type": t.type,
                "price": float(t.price),
                "quantity": float(t.quantity),
                "profit_loss": float(t.profit_loss),
            }
            for t in trades_list
        ],
        "number_of_trades": len(trades_list),
        "winning_trades": winning,
        "losing_trades": losing,
        "accuracy": float(accuracy),
    }


ALGORITHM = AlgorithmSpec(
    id="market_benchmark",
    name="Market Benchmark",
    category="Benchmark",
    description="Standard Buy and Hold benchmark.",
    params=[],
    fn=run_market_benchmark,
    hidden=True,
)
