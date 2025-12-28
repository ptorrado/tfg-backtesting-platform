# app/backtest/algorithms/buy_and_hold.py

from __future__ import annotations

from datetime import date
from typing import Any, Dict, List

from sqlalchemy.orm import Session

from ... import models
from .sma_crossover import (
    Candle,
    EquityPoint,
    Trade,
    _load_ohlcv_from_db,
    _compute_max_drawdown,
    _compute_sharpe,
)



def run_buy_and_hold(
    db: Session,
    asset_symbol: str,
    start_date: date,
    end_date: date,
    initial_capital: float,
    params: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Estrategia Buy & Hold básica:

    - Compra el activo al cierre de la primera vela disponible en el periodo.
    - Mantiene la posición hasta el final del periodo (última vela).
    - No hay rebalanceos, ni stops, ni señales intermedias.
    """

    # 1) Cargar velas del rango (sin warmup, no hace falta)
    candles: List[Candle] = _load_ohlcv_from_db(
        db=db,
        asset_symbol=asset_symbol,
        start=start_date,
        end=end_date,
    )

    if not candles:
        raise ValueError(
            f"No OHLCV data for '{asset_symbol}' between {start_date} and {end_date}"
        )

    # Ordenados de más antiguo a más reciente (ya lo viene así del helper)
    first_candle = candles[0]
    last_candle = candles[-1]

    entry_date = first_candle.ts.date()
    exit_date = last_candle.ts.date()

    entry_price = float(first_candle.close)
    exit_price = float(last_candle.close)

    # 2) Tamaño de la posición: invertimos TODO el capital inicial
    size = initial_capital / entry_price if entry_price > 0 else 0.0

    # 3) Equity curve: mark-to-market diario
    equity_curve: List[EquityPoint] = []

    if size > 0:
        for c in candles:
            eq = size * float(c.close)
            equity_curve.append(
                EquityPoint(
                    date=c.ts.date().isoformat(),
                    equity=eq,
                )
            )
        final_equity = size * exit_price
    else:
        # Por seguridad, si el precio es 0 (caso raro), dejamos capital plano
        for c in candles:
            equity_curve.append(
                EquityPoint(
                    date=c.ts.date().isoformat(),
                    equity=float(initial_capital),
                )
            )
        final_equity = float(initial_capital)

    if not equity_curve:
        equity_curve = [
            EquityPoint(
                date=start_date.isoformat(),
                equity=float(initial_capital),
            )
        ]

    # 4) Trades: 1 buy al inicio, 1 sell al final
    trades: List[Trade] = []
    if size > 0:
        # entrada
        trades.append(
            Trade(
                date=entry_date.isoformat(),
                type="buy",
                price=entry_price,
                quantity=size,
                profit_loss=0.0,
            )
        )
        # salida
        pnl = final_equity - float(initial_capital)
        trades.append(
            Trade(
                date=exit_date.isoformat(),
                type="sell",
                price=exit_price,
                quantity=size,
                profit_loss=pnl,
            )
        )

    # 5) Métricas
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

    # 6) Info del asset para guardar en BBDD
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
        "algorithm": "buy_and_hold",
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
