# app/backtest/algorithms/buy_and_hold.py

from datetime import date
from typing import Any, Dict, List

from sqlalchemy.orm import Session

from ..registry import register_algorithm
from ... import models


@register_algorithm("buy_and_hold")
def run_buy_and_hold(
    db: Session,
    asset_symbol: str,
    start_date: date,
    end_date: date,
    initial_capital: float,
    params: Dict[str, Any],
) -> Dict[str, Any]:
    # 1) Cargar OHLCV de la BBDD (puedes reutilizar el helper del SMA)
    # 2) Comprar al principio, mantener hasta el final
    # 3) Construir equity_curve, trades, métricas...
    ...
    return {
        "status": "completed",
        "asset_symbol": asset_symbol,
        "asset_name": asset_symbol,
        "asset_type": "stock",
        "algorithm": "buy_and_hold",
        "start_date": start_date,
        "end_date": end_date,
        "initial_capital": initial_capital,
        "final_equity": final_equity,
        "total_return": total_return,
        "max_drawdown": max_dd,
        "sharpe_ratio": sharpe,
        "equity_curve": equity_curve_list,
        "trades": trades_list,
        "number_of_trades": len(trades_list),
        "winning_trades": winning,
        "losing_trades": losing,
        "accuracy": accuracy,
    }
