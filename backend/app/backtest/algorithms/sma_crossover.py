# app/backtest/algorithms/sma_crossover.py

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Dict, List, Any

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
    # end exclusivo -> +1 día
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


def _sma(values: List[float], window: int) -> List[float]:
    if window <= 0:
        raise ValueError("SMA window must be > 0")

    sma: List[float] = []
    for i in range(len(values)):
        if i + 1 < window:
            sma.append(float("nan"))
        else:
            window_vals = values[i + 1 - window: i + 1]
            sma.append(sum(window_vals) / window)
    return sma


def _compute_max_drawdown(equity_curve: List[EquityPoint]) -> float:
    if not equity_curve:
        return 0.0

    peak = equity_curve[0].equity
    max_dd = 0.0
    for p in equity_curve:
        if p.equity > peak:
            peak = p.equity
        dd = (peak - p.equity) / peak
        if dd > max_dd:
            max_dd = dd
    return max_dd


def _compute_sharpe(equity_curve: List[EquityPoint]) -> float:
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
    # Acotamos un poco porque el motor es simple
    return max(min(sharpe, 5.0), -5.0)


# ========= Algoritmo SMA crossover =========

def run_sma_crossover(
    db: Session,
    asset_symbol: str,
    start_date: date,
    end_date: date,
    initial_capital: float,
    params: Dict[str, float],
) -> Dict[str, Any]:
    """
    Motor muy sencillo: long-only cuando SMA rápida > SMA lenta.
    Opera con TODO el capital en cada entrada.
    """

    short_window = int(params.get("short_window", 20))
    long_window = int(params.get("long_window", 50))

    if short_window <= 0 or long_window <= 0:
        raise ValueError("short_window and long_window must be > 0")
    if short_window >= long_window:
        raise ValueError("short_window must be < long_window")

    candles = _load_ohlcv_from_db(db, asset_symbol, start_date, end_date)
    closes = [c.close for c in candles]

    fast_sma = _sma(closes, short_window)
    slow_sma = _sma(closes, long_window)

    equity_curve: List[EquityPoint] = []
    trades: List[Trade] = []

    cash = float(initial_capital)
    position = 0.0
    entry_price = 0.0

    for i, candle in enumerate(candles):
        price = candle.close
        date_str = candle.ts.date().isoformat()

        # Señales sólo cuando hay ambas SMAs definidas
        if i >= long_window - 1:
            f = fast_sma[i]
            s = slow_sma[i]

            if not (f != f or s != s):  # NaN check: NaN != NaN
                # Entrada: rápida cruza por encima y estamos fuera
                if position == 0 and f > s:
                    quantity = cash / price if price > 0 else 0.0
                    if quantity > 0:
                        position = quantity
                        entry_price = price
                        cash -= quantity * price
                        trades.append(
                            Trade(
                                date=date_str,
                                type="buy",
                                price=price,
                                quantity=quantity,
                                profit_loss=0.0,
                            )
                        )

                # Salida: rápida cruza por debajo y estamos dentro
                elif position > 0 and f < s:
                    cash += position * price
                    pnl = (price - entry_price) * position
                    trades.append(
                        Trade(
                            date=date_str,
                            type="sell",
                            price=price,
                            quantity=position,
                            profit_loss=pnl,
                        )
                    )
                    position = 0.0
                    entry_price = 0.0

        equity = cash + position * price
        equity_curve.append(EquityPoint(date=date_str, equity=equity))

    final_equity = equity_curve[-1].equity if equity_curve else initial_capital
    total_return = (
        final_equity / initial_capital - 1.0 if initial_capital != 0 else 0.0
    )

    max_dd = _compute_max_drawdown(equity_curve)
    sharpe = _compute_sharpe(equity_curve)

    sell_trades = [t for t in trades if t.type == "sell"]
    winning = sum(1 for t in sell_trades if t.profit_loss > 0)
    losing = sum(1 for t in sell_trades if t.profit_loss < 0)
    total_closed = winning + losing
    accuracy = (winning / total_closed) * 100.0 if total_closed > 0 else 0.0

    return {
        "status": "completed",
        "asset_symbol": asset_symbol,
        "asset_name": asset_symbol,   # por ahora usamos el símbolo
        "asset_type": "stock",
        "algorithm": "sma_crossover",
        "start_date": start_date,
        "end_date": end_date,
        "initial_capital": initial_capital,
        "final_equity": final_equity,
        "total_return": total_return,
        "max_drawdown": max_dd,
        "sharpe_ratio": sharpe,
        "equity_curve": [
            {"date": p.date, "equity": p.equity} for p in equity_curve
        ],
        "trades": [
            {
                "date": t.date,
                "type": t.type,
                "price": t.price,
                "quantity": t.quantity,
                "profit_loss": t.profit_loss,
            }
            for t in trades
        ],
        "number_of_trades": len(trades),
        "winning_trades": winning,
        "losing_trades": losing,
        "accuracy": accuracy,
    }
