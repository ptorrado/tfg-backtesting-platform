# app/backtest/algorithms/sma_crossover.py

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Any, Dict, List

from sqlalchemy.orm import Session

from ... import models


# ========= Dataclasses internas =========

@dataclass
class Candle:
    ts: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float


@dataclass
class EquityPoint:
    date: str
    equity: float


@dataclass
class Trade:
    date: str
    type: str          # "buy" / "sell"
    price: float
    quantity: float
    profit_loss: float


# ========= Helpers de datos =========

def _load_ohlcv_from_db(
    db: Session,
    asset_symbol: str,
    start: date,
    end: date,
) -> List[Candle]:
    # 1) Buscar asset
    asset = (
        db.query(models.Asset)
        .filter(models.Asset.symbol == asset_symbol)
        .first()
    )
    if asset is None:
        raise ValueError(f"Asset '{asset_symbol}' not found in assets table")

    # 2) Rango de fechas -> datetimes
    start_dt = datetime.combine(start, datetime.min.time())
    end_dt = datetime.combine(end + timedelta(days=1), datetime.min.time())

    rows = (
        db.query(models.MarketOHLCV)
        .filter(models.MarketOHLCV.asset_id == asset.id)
        .filter(models.MarketOHLCV.ts >= start_dt)
        .filter(models.MarketOHLCV.ts < end_dt)
        .order_by(models.MarketOHLCV.ts.asc())
        .all()
    )

    if not rows:
        raise ValueError(
            f"No OHLCV data for '{asset_symbol}' between {start} and {end}"
        )

    return [
        Candle(
            ts=row.ts,
            open=row.open,
            high=row.high,
            low=row.low,
            close=row.close,
            volume=row.volume,
        )
        for row in rows
    ]


def _compute_max_drawdown(equity_curve: List[EquityPoint]) -> float:
    """
    Devuelve el drawdown máximo en tanto 1 (0.15 = -15%).
    """
    if not equity_curve:
        return 0.0

    peak = equity_curve[0].equity
    max_dd = 0.0
    for p in equity_curve:
        if p.equity > peak:
            peak = p.equity
        dd = (peak - p.equity) / peak if peak != 0 else 0.0
        if dd > max_dd:
            max_dd = dd
    return max_dd


def _compute_sharpe(equity_curve: List[EquityPoint]) -> float:
    """
    Sharpe anualizado simple, sin free-rate, acotado entre -5 y 5.
    """
    if len(equity_curve) < 2:
        return 0.0

    returns: List[float] = []
    for i in range(1, len(equity_curve)):
        prev = equity_curve[i - 1].equity
        curr = equity_curve[i].equity
        if prev != 0:
            returns.append((curr - prev) / prev)

    if len(returns) < 2:
        return 0.0

    avg = sum(returns) / len(returns)
    var = sum((r - avg) ** 2 for r in returns) / len(returns)
    std = var ** 0.5
    if std == 0:
        return 0.0

    sharpe = (avg / std) * (252 ** 0.5)
    return max(min(sharpe, 5.0), -5.0)


# ========= Algoritmo SMA crossover (Backtrader) =========

def run_sma_crossover(
    db: Session,
    asset_symbol: str,
    start_date: date,
    end_date: date,
    initial_capital: float,
    params: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Implementación del SMA crossover usando Backtrader.
    - Long-only
    - Entra cuando SMA rápida > SMA lenta
    - Sale cuando SMA rápida < SMA lenta
    - Usa TODO el capital en cada entrada

    IMPORTANTE: usa datos de warmup antes de start_date para calcular las SMAs,
    pero SOLO opera y SOLO registra equity desde start_date.
    """

    try:
        import backtrader as bt
        import pandas as pd
    except ImportError as exc:  # pragma: no cover
        raise RuntimeError(
            "backtrader and pandas must be installed to use 'sma_crossover'"
        ) from exc

    short_window = int(params.get("short_window", 20))
    long_window = int(params.get("long_window", 50))

    if short_window <= 0 or long_window <= 0:
        raise ValueError("short_window and long_window must be > 0")
    if short_window >= long_window:
        raise ValueError("short_window must be < long_window")

    # --------- WARMUP: cargamos más histórico antes de start_date ---------
    # Queremos que la SMA lenta tenga datos decentes antes de empezar el periodo.
    # Usamos un margen de 2 * long_window días por simplicidad (contando findes/festivos).
    warmup_days = long_window * 2
    warmup_start_date = start_date - timedelta(days=warmup_days)

    candles = _load_ohlcv_from_db(
        db,
        asset_symbol,
        warmup_start_date,
        end_date,
    )

    # ---- DataFrame para Backtrader ----
    # Aseguramos datetimes 'naive' (Backtrader se lleva mejor con ellos)
    index = [c.ts.replace(tzinfo=None) if c.ts.tzinfo else c.ts for c in candles]
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
    # Ejecutar órdenes al cierre
    cerebro.broker.set_coc(True)

    # ---- Estrategia Backtrader ----
    class SmaCrossoverBT(bt.Strategy):
        params = dict(
            short_window=short_window,
            long_window=long_window,
            sim_start_date=start_date,  # 👈 periodo "oficial" del backtest
        )

        def __init__(self):
            self.sma_fast = bt.indicators.SimpleMovingAverage(
                self.data.close, period=self.p.short_window
            )
            self.sma_slow = bt.indicators.SimpleMovingAverage(
                self.data.close, period=self.p.long_window
            )

            self.entry_price: float = 0.0
            self.trades_log: List[Trade] = []
            self.equity_curve: List[EquityPoint] = []

        def next(self):
            dt = self.data.datetime.date(0)

            # ---------- Fase de warmup: antes de start_date ----------
            # Aquí solo dejamos que las SMAs se "formen", pero
            # NO operamos y NO registramos equity.
            if dt < self.p.sim_start_date:
                return

            price = float(self.data.close[0])

            # Si todavía no tenemos suficientes barras para la SMA lenta,
            # no operamos, pero sí registramos equity desde start_date.
            if len(self.data) < self.p.long_window:
                value = float(self.broker.getvalue())
                self.equity_curve.append(
                    EquityPoint(date=dt.isoformat(), equity=value)
                )
                return

            # ---------- Lógica de entrada/salida DENTRO del periodo ----------
            if not self.position:
                if self.sma_fast[0] > self.sma_slow[0]:
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
                if self.sma_fast[0] < self.sma_slow[0]:
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

            # Guardamos equity diaria SOLO dentro del periodo oficial
            value = float(self.broker.getvalue())
            self.equity_curve.append(
                EquityPoint(date=dt.isoformat(), equity=value)
            )

    cerebro.addstrategy(SmaCrossoverBT)
    strategies = cerebro.run()
    strat: SmaCrossoverBT = strategies[0]

    # La equity_curve ya solo contiene puntos desde start_date
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

    # Meta del asset para guardarlo limpio en BBDD
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
        "algorithm": "sma_crossover",
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
