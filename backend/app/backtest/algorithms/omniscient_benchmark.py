# app/backtest/algorithms/omniscient_benchmark.py

from __future__ import annotations

from datetime import date
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


def run_omniscient_benchmark(
    db: Session,
    asset_symbol: str,
    start_date: date,
    end_date: date,
    initial_capital: float,
    params: Dict[str, Any] | None = None,  # se ignora, pero mantiene la interfaz
) -> Dict[str, Any]:
    """
    Benchmark omnisciente:

    - Conoce TODA la serie de precios futura.
    - Sólo puede estar long o en cash (sin cortos).
    - Puede hacer número ilimitado de trades.
    - Política: entrar antes de cada tramo de subida y salir antes de cada tramo de bajada.
    """

    candles = _load_ohlcv_from_db(db, asset_symbol, start_date, end_date)
    if not candles:
        raise ValueError(
            f"No OHLCV data for '{asset_symbol}' between {start_date} and {end_date}"
        )

    cash = float(initial_capital)
    position = 0.0
    entry_price = 0.0

    equity_curve: List[EquityPoint] = []
    trades: List[Trade] = []

    n = len(candles)

    for i, candle in enumerate(candles):
        price = float(candle.close)
        date_str = candle.ts.date().isoformat()

        if i < n - 1:
            next_price = float(candles[i + 1].close)

            # Entrar hoy si sabemos que mañana sube y estamos fuera
            if position == 0.0 and next_price > price:
                qty = cash / price if price > 0 else 0.0
                if qty > 0.0:
                    position = qty
                    cash -= qty * price
                    entry_price = price
                    trades.append(
                        Trade(
                            date=date_str,
                            type="buy",
                            price=price,
                            quantity=qty,
                            profit_loss=0.0,
                        )
                    )

            # Salir hoy si sabemos que mañana baja y estamos dentro
            elif position > 0.0 and next_price < price:
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
        else:
            # Último día: cerramos cualquier posición abierta
            if position > 0.0:
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

    final_equity = equity_curve[-1].equity if equity_curve else float(initial_capital)
    total_return = (
        final_equity / float(initial_capital) - 1.0
        if initial_capital != 0
        else 0.0
    )

    max_dd = _compute_max_drawdown(equity_curve)
    sharpe = _compute_sharpe(equity_curve)

    sell_trades = [t for t in trades if t.type == "sell"]
    winning = sum(1 for t in sell_trades if t.profit_loss > 0)
    losing = sum(1 for t in sell_trades if t.profit_loss < 0)
    total_closed = winning + losing
    accuracy = (winning / total_closed) * 100.0 if total_closed > 0 else 0.0

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
        "algorithm": "omniscient_benchmark",
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
