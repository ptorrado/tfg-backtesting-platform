# app/backtest/algorithms/rsi_reversion.py

from __future__ import annotations

from datetime import date, timedelta
from typing import Any, Dict, List

from sqlalchemy.orm import Session

from ... import models
from .sma_crossover import (
    EquityPoint,
    Trade,
    _load_ohlcv_from_db,
    _compute_max_drawdown,
    _compute_sharpe,
)


def run_rsi_reversion(
    db: Session,
    asset_symbol: str,
    start_date: date,
    end_date: date,
    initial_capital: float,
    params: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Estrategia RSI Mean Reversion (Backtrader):

    - Indicador RSI sobre el cierre.
    - Long-only.
    - Entra cuando RSI < oversold (activos "sobrevendidos").
    - Sale cuando RSI > overbought (activos "sobrecomprados").
    - Usa TODO el capital disponible en cada entrada.
    """

    try:
        import backtrader as bt  # type: ignore
        import pandas as pd  # type: ignore
    except ImportError as exc:  # pragma: no cover
        raise RuntimeError(
            "backtrader and pandas must be installed to use 'rsi_reversion'"
        ) from exc

    rsi_period = int(params.get("rsi_period", 14))
    oversold = float(params.get("oversold", 30.0))
    overbought = float(params.get("overbought", 70.0))

    # ---- Validación de params ----
    if rsi_period <= 1:
        raise ValueError("rsi_period must be > 1")
    if not (0.0 <= oversold < overbought <= 100.0):
        raise ValueError("Require 0 <= oversold < overbought <= 100")

    # --------- WARMUP: algo de histórico previo para el RSI ---------
    warmup_days = rsi_period * 2
    warmup_start_date = start_date - timedelta(days=warmup_days)

    candles = _load_ohlcv_from_db(
        db,
        asset_symbol,
        warmup_start_date,
        end_date,
    )

    # ---- DataFrame para Backtrader ----
    index = [
        c.ts.replace(tzinfo=None) if c.ts.tzinfo else c.ts
        for c in candles
    ]
    data_dict = {
        "open": [c.open for c in candles],
        "high": [c.high for c in candles],
        "low": [c.low for c in candles],
        "close": [c.close for c in candles],
        "volume": [c.volume for c in candles],
    }

    df = pd.DataFrame(data_dict, index=index)

    data_feed = bt.feeds.PandasData(dataname=df)

    cerebro = bt.Cerebro()
    cerebro.adddata(data_feed)
    cerebro.broker.setcash(float(initial_capital))
    cerebro.broker.setcommission(commission=0.0)
    cerebro.broker.set_coc(True)

    class RSIMeanReversionBT(bt.Strategy):
        params = dict(
            rsi_period=rsi_period,
            oversold=oversold,
            overbought=overbought,
            sim_start_date=start_date,
        )

        def __init__(self):
            self.rsi = bt.indicators.RSI(
                self.data.close, period=self.p.rsi_period
            )

            self.entry_price: float = 0.0
            self.trades_log: List[Trade] = []
            self.equity_curve: List[EquityPoint] = []

        def next(self):
            dt = self.data.datetime.date(0)

            # Warmup antes del periodo de simulación "oficial"
            if dt < self.p.sim_start_date:
                return

            price = float(self.data.close[0])

            # Asegurarnos de que el RSI está formado
            if len(self.data) < self.p.rsi_period:
                value = float(self.broker.getvalue())
                self.equity_curve.append(
                    EquityPoint(date=dt.isoformat(), equity=value)
                )
                return

            rsi_value = float(self.rsi[0])

            # ----- Lógica de trading -----
            if not self.position:
                # Entrada mean-reversion: activo muy sobrevendido
                if rsi_value < self.p.oversold:
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
                # Salida cuando el RSI indica "sobrecompra"
                if rsi_value > self.p.overbought:
                    size = float(self.position.size)
                    exit_price = price
                    pnl = (exit_price - self.entry_price) * size
                    self.sell(size=size)
                    self.trades_log.append(
                        Trade(
                            date=dt.isoformat(),
                            type="sell",
                            price=exit_price,
                            quantity=size,
                            profit_loss=pnl,
                        )
                    )
                    self.entry_price = 0.0

            # Equity diaria sólo dentro del periodo oficial
            value = float(self.broker.getvalue())
            self.equity_curve.append(
                EquityPoint(date=dt.isoformat(), equity=value)
            )

    cerebro.addstrategy(RSIMeanReversionBT)
    strategies = cerebro.run()
    strat: RSIMeanReversionBT = strategies[0]

    equity_curve = strat.equity_curve
    if not equity_curve:
        equity_curve = [
            EquityPoint(
                date=start_date.isoformat(),
                equity=float(initial_capital),
            )
        ]

    final_equity = float(equity_curve[-1].equity)
    total_return = (
        final_equity / float(initial_capital) - 1.0
        if initial_capital != 0
        else 0.0
    )

    max_dd = _compute_max_drawdown(equity_curve)
    sharpe = _compute_sharpe(equity_curve)

    trades = strat.trades_log
    sell_trades = [t for t in trades if t.type == "sell"]
    winning = sum(1 for t in sell_trades if t.profit_loss > 0)
    losing = sum(1 for t in sell_trades if t.profit_loss < 0)
    total_closed = winning + losing
    accuracy = (winning / total_closed) * 100.0 if total_closed > 0 else 0.0

    # Info del asset para guardar en BBDD
    asset_row = (
        db.query(models.Asset)
        .filter(models.Asset.symbol == asset_symbol)
        .first()
    )
    if asset_row:
        asset_name = asset_row.name
        asset_type = asset_row.asset_type
    else:
        asset_name = asset_symbol
        asset_type = "stock"

    return {
        "status": "completed",
        "asset_symbol": asset_symbol,
        "asset_name": asset_name,
        "asset_type": asset_type,
        "algorithm": "rsi_reversion",
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
