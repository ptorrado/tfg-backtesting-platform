# app/backtest/algorithms/donchian_breakout.py
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


def run_donchian_breakout(
    db: Session,
    asset_symbol: str,
    start_date: date,
    end_date: date,
    initial_capital: float,
    params: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Donchian Breakout (Backtrader):
    - Long-only strategy
    - Enter Long when Close > Highest High of last N days (Lookback)
    - Exit (Sell) when Close < Lowest Low of last N days
    - Uses all available cash for entry
    """
    try:
        import backtrader as bt  # type: ignore
        import pandas as pd  # type: ignore
    except ImportError as exc:  # pragma: no cover
        raise RuntimeError(
            "backtrader and pandas must be installed to use 'donchian_breakout'"
        ) from exc

    lookback_period = int(params.get("lookback_period", 20))

    if lookback_period < 5:
        raise ValueError("lookback_period must be >= 5")

    # Warmup needs to be at least the lookback period
    warmup_days = lookback_period * 2
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

    class DonchianBreakoutBT(bt.Strategy):
        params = dict(
            lookback=lookback_period,
            sim_start_date=start_date,
        )

        def __init__(self):
            # Highest high of the lookback period
            self.highest = bt.indicators.Highest(self.data.high, period=self.p.lookback)
            # Lowest low of the lookback period
            self.lowest = bt.indicators.Lowest(self.data.low, period=self.p.lookback)

            self.entry_price: float = 0.0
            self.trades_log: List[Trade] = []
            self.equity_curve: List[EquityPoint] = []

        def next(self):
            dt = self.data.datetime.date(0)
            if dt < self.p.sim_start_date:
                return

            price = float(self.data.close[0])

            # Ensure we have enough data
            if len(self.data) < self.p.lookback:
                self.equity_curve.append(
                    EquityPoint(
                        date=dt.isoformat(), equity=float(self.broker.getvalue())
                    )
                )
                return

            # Logic:
            # We look at the PREVIOUS bar's channel to decide if we break out today.
            # If Close[0] > Highest[-1]: Buy
            # If Close[0] < Lowest[-1]: Sell
            
            # Using index -1 to access the previous value of the indicator
            prev_highest = self.highest[-1]
            prev_lowest = self.lowest[-1]

            if not self.position:
                if price > prev_highest:
                    cash = float(self.broker.getcash())
                    size = cash / price if price > 0 else 0.0
                    if size > 0:
                        self.buy(size=size)
                        self.entry_price = price
                        self.trades_log.append(
                            Trade(
                                date=dt.isoformat(),
                                type="buy",
                                price=price,
                                quantity=size,
                                profit_loss=0.0,
                            )
                        )
            else:
                if price < prev_lowest:
                    size = float(self.position.size)
                    pnl = (price - self.entry_price) * size
                    self.sell(size=size)
                    self.trades_log.append(
                        Trade(
                            date=dt.isoformat(),
                            type="sell",
                            price=price,
                            quantity=size,
                            profit_loss=pnl,
                        )
                    )
                    self.entry_price = 0.0

            self.equity_curve.append(
                EquityPoint(date=dt.isoformat(), equity=float(self.broker.getvalue()))
            )

    cerebro.addstrategy(DonchianBreakoutBT)
    strat: DonchianBreakoutBT = cerebro.run()[0]

    equity_curve = strat.equity_curve or [
        EquityPoint(date=start_date.isoformat(), equity=float(initial_capital))
    ]
    final_equity = float(equity_curve[-1].equity)
    total_return = (
        final_equity / float(initial_capital) - 1.0 if initial_capital != 0 else 0.0
    )

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
        "algorithm": "donchian_breakout",
        "start_date": start_date,
        "end_date": end_date,
        "initial_capital": float(initial_capital),
        "final_equity": float(final_equity),
        "total_return": float(total_return),
        "max_drawdown": float(max_dd),
        "sharpe_ratio": float(sharpe),
        "equity_curve": [
            {"date": p.date, "equity": float(p.equity)} for p in equity_curve
        ],
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
    id="donchian_breakout",
    name="Donchian Breakout",
    category="Trend-following",
    description="Enters long when price exceeds the recent high; exits when price falls below the recent low.",
    params=[
        ParamDef(
            name="lookback_period",
            label="Lookback Period",
            type="int",
            min=5,
            max=200,
            step=1,
            default=20,
            description="Number of days for the High/Low channel.",
        ),
    ],
    fn=run_donchian_breakout,
)
