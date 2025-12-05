from datetime import date, datetime
from typing import Any, Dict, List

from sqlalchemy.orm import Session

from . import models


def _normalize_date(value: Any) -> date:
    """
    Acepta str, date o datetime y devuelve un date.
    Evita errores tipo: fromisoformat: argument must be str
    """
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, str):
        return date.fromisoformat(value)
    raise TypeError(f"Invalid date value for simulation: {value!r}")


def _normalize_equity_curve(raw_curve: Any) -> List[Dict[str, Any]]:
    """
    Asegura que equity_curve se guarda como lista de dicts {date, equity}.
    raw_curve puede venir como lista de dict, Pydantic models, etc.
    """
    curve: List[Dict[str, Any]] = []

    if not raw_curve:
        return curve

    for p in raw_curve:
        if isinstance(p, dict):
            d = p.get("date") or p.get("ts") or p.get("timestamp")
            v = p.get("equity") or p.get("value")
        else:
            d = getattr(p, "date", None) or getattr(p, "ts", None) or getattr(
                p, "timestamp", None
            )
            v = getattr(p, "equity", None) or getattr(p, "value", None)

        if isinstance(d, (datetime, date)):
            d_str = d.isoformat()
        else:
            d_str = str(d)

        curve.append(
            {
                "date": d_str,
                "equity": float(v) if v is not None else 0.0,
            }
        )

    return curve


def _normalize_trades(raw_trades: Any) -> List[Dict[str, Any]]:
    """
    Igual para los trades, guardamos siempre lista de dict.
    """
    trades: List[Dict[str, Any]] = []
    if not raw_trades:
        return trades

    for t in raw_trades:
        if isinstance(t, dict):
            trades.append(dict(t))
        else:
            trades.append(
                {
                    "date": str(getattr(t, "date", "")),
                    "type": getattr(t, "type", ""),
                    "price": float(getattr(t, "price", 0.0)),
                    "quantity": float(getattr(t, "quantity", 0.0)),
                    "profit_loss": float(getattr(t, "profit_loss", 0.0)),
                }
            )

    return trades


def save_simulation(db: Session, data: Dict[str, Any]) -> models.Simulation:
    """
    Crea el Asset si no existe y guarda la Simulation en la BBDD.

    `data` viene del motor (run_backtest) y se espera que contenga,
    al menos:

    - asset_symbol
    - asset_name (opcional)
    - asset_type (opcional)
    - algorithm
    - start_date, end_date (str o date)
    - initial_capital
    - final_equity
    - total_return
    - max_drawdown
    - sharpe_ratio
    - equity_curve (lista)
    - trades (lista)
    - number_of_trades, winning_trades, losing_trades, accuracy
    """

    asset_symbol = data["asset_symbol"]
    asset_name = data.get("asset_name", asset_symbol)
    asset_type = data.get("asset_type", "stock")

    # --- Asset ---
    asset = (
        db.query(models.Asset)
        .filter(models.Asset.symbol == asset_symbol)
        .first()
    )

    if asset is None:
        asset = models.Asset(
            symbol=asset_symbol,
            name=asset_name,
            asset_type=asset_type,
        )
        db.add(asset)
        db.commit()
        db.refresh(asset)

    # --- Normalizar fechas ---
    start_date = _normalize_date(data["start_date"])
    end_date = _normalize_date(data["end_date"])

    # --- Normalizar equity_curve y trades ---
    equity_curve = _normalize_equity_curve(data.get("equity_curve", []))
    trades = _normalize_trades(data.get("trades", []))

    # --- Crear Simulation ---
    sim = models.Simulation(
        status=data.get("status", "completed"),
        asset_id=asset.id,
        algorithm=data["algorithm"],
        start_date=start_date,
        end_date=end_date,
        initial_capital=float(data["initial_capital"]),
        final_equity=float(data["final_equity"]),
        total_return=float(data.get("total_return", 0.0)),
        max_drawdown=float(data.get("max_drawdown", 0.0)),
        sharpe_ratio=float(data.get("sharpe_ratio", 0.0)),
        number_of_trades=int(data.get("number_of_trades", 0)),
        winning_trades=int(data.get("winning_trades", 0)),
        losing_trades=int(data.get("losing_trades", 0)),
        accuracy=float(data.get("accuracy", 0.0)),
        equity_curve=equity_curve,
        trades=trades,
    )

    db.add(sim)
    db.commit()
    db.refresh(sim)

    return sim
