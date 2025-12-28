# app/backtest/algorithms/sma_crossover.py
from __future__ import annotations

from datetime import date, timedelta
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

from .utils.spec import AlgorithmSpec, ParamDef



def run_sma_crossover(
    db: Session,
    asset_symbol: str,
    start_date: date,
    end_date: date,
    initial_capital: float,
    params: Dict[str, Any],
) -> Dict[str, Any]:
    """
    SMA crossover (Backtrader):
    - Long-only
    - Enter when fast SMA > slow SMA
    - Exit when fast SMA < slow SMA
    - Uses all available cash
    - Uses warmup data before start_date, but only trades + equity are recorded from start_date
    """
    try:
        import backtrader as bt  # type: ignore
        import pandas as pd  # type: ignore
    except ImportError as exc:  # pragma: no cover
        raise RuntimeError("backtrader and pandas must be installed to use 'sma_crossover'") from exc

    short_window = int(params.get("short_window", 20))
    long_window = int(params.get("long_window", 50))

    if short_window <= 0 or long_window <= 0:
        raise ValueError("short_window and long_window must be > 0")
    if short_window >= long_window:
        raise ValueError("short_window must be < long_window")

    warmup_days = long_window * 2
    warmup_start_date = start_date - timedelta(days=warmup_days)

    candles: List[Candle] = load_ohlcv_from_db(
        db,
        asset_symbol=asset_symbol,
        start=warmup_start_date,
        end=end_date,
    )

    index = [c.ts.replace(tzinfo=None) if c.ts.tzinfo else c.ts for c in candles]
    df = pd.DataFrame(
        {
            "open": [c.open for c in candles],
            "high": [c.high for c in candles],
            "low": [c.low for c in candles],
            "close": [c.close for c in candles],
            "volume": [c.volume for c in candles],
        },
        index=index,
    )

    data_feed = bt.feeds.PandasData(dataname=df)

    cerebro = bt.Cerebro()
    cerebro.adddata(data_feed)
    cerebro.broker.setcash(float(initial_capital))
    cerebro.broker.setcommission(commission=0.0)
    cerebro.broker.set_coc(True)

    class SmaCrossoverBT(bt.Strategy):
        params = dict(
            short_window=short_window,
            long_window=long_window,
            sim_start_date=start_date,
        )

        def __init__(self):
            self.sma_fast = bt.indicators.SimpleMovingAverage(self.data.close, period=self.p.short_window)
            self.sma_slow = bt.indicators.SimpleMovingAverage(self.data.close, period=self.p.long_window)

            self.entry_price: float = 0.0
            self.trades_log: List[Trade] = []
            self.equity_curve: List[EquityPoint] = []

        def next(self):
            dt = self.data.datetime.date(0)
            if dt < self.p.sim_start_date:
                return

            price = float(self.data.close[0])

            if len(self.data) < self.p.long_window:
                self.equity_curve.append(EquityPoint(date=dt.isoformat(), equity=float(self.broker.getvalue())))
                return

            if not self.position:
                if self.sma_fast[0] > self.sma_slow[0]:
                    cash = float(self.broker.getcash())
                    size = cash / price if price > 0 else 0.0
                    if size > 0:
                        self.buy(size=size)
                        self.entry_price = price
                        self.trades_log.append(
                            Trade(date=dt.isoformat(), type="buy", price=price, quantity=size, profit_loss=0.0)
                        )
            else:
                if self.sma_fast[0] < self.sma_slow[0]:
                    size = float(self.position.size)
                    pnl = (price - self.entry_price) * size
                    self.sell(size=size)
                    self.trades_log.append(
                        Trade(date=dt.isoformat(), type="sell", price=price, quantity=size, profit_loss=pnl)
                    )
                    self.entry_price = 0.0

            self.equity_curve.append(EquityPoint(date=dt.isoformat(), equity=float(self.broker.getvalue())))

    cerebro.addstrategy(SmaCrossoverBT)
    strat: SmaCrossoverBT = cerebro.run()[0]

    equity_curve = strat.equity_curve or [EquityPoint(date=start_date.isoformat(), equity=float(initial_capital))]
    final_equity = float(equity_curve[-1].equity)
    total_return = final_equity / float(initial_capital) - 1.0 if initial_capital != 0 else 0.0

    max_dd = compute_max_drawdown(equity_curve)
    sharpe = compute_sharpe(equity_curve)

    trades = strat.trades_log
    winning, losing, accuracy = trade_stats(trades)

    asset_name, asset_type = get_asset_meta(db, asset_symbol=asset_symbol)

    return {
        "status": "completed",
        "asset_symbol": asset_symbol,
        "asset_name": asset_name,
        "asset_type": asset_type,
        "algorithm": "sma_crossover",
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
    id="sma_crossover",
    name="SMA Crossover",
    category="Trend-following",
    description="Long-only SMA crossover: enters when fast SMA > slow SMA and exits when it crosses below.",
    params=[
        ParamDef(
            name="short_window",
            label="Fast SMA window",
            type="int",
            min=5, max=50, step=1, default=20,
            description="Number of days for the fast moving average.",
        ),
        ParamDef(
            name="long_window",
            label="Slow SMA window",
            type="int",
            min=20, max=200, step=1, default=50,
            description="Number of days for the slow moving average.",
        ),
    ],
    fn=run_sma_crossover,
)