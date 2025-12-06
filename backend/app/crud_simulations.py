# app/crud_simulations.py
from datetime import date, datetime
from typing import Any, Dict, List

from sqlalchemy.orm import Session

from . import models


def _normalize_date(value: Any) -> date:
    """
    Acepta str, date o datetime y devuelve un date.
    """
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, str):
        return date.fromisoformat(value)
    raise TypeError(f"Invalid date value for simulation: {value!r}")


def _to_date(value: Any) -> date:
    """
    Versión más permisiva usada para equity/trades: reutilizamos _normalize_date.
    """
    return _normalize_date(value)


def save_simulation(db: Session, data: Dict[str, Any]) -> models.Simulation:
    """
    Crea el Asset si no existe y guarda la Simulation en la BBDD.
    (...)
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

    # --- Normalizar fechas de la simulación ---
    start_date = _normalize_date(data["start_date"])
    end_date = _normalize_date(data["end_date"])

    # --- Crear Simulation (sin equity/trades todavía) ---
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
        # info de batch (si viene)
        batch_name=data.get("batch_name"),
        batch_group_id=data.get("batch_group_id"),
        # parámetros del algoritmo (si vienen)
        params=data.get("params"),
    )

    db.add(sim)
    db.flush()  # ya tenemos sim.id sin hacer commit aún

    # --- Guardar equity_curve normalizada en simulation_equity_curve ---
    raw_curve = data.get("equity_curve", []) or []
    equity_points: List[models.SimulationEquityPoint] = []

    for p in raw_curve:
        if isinstance(p, dict):
            d = p.get("date") or p.get("ts") or p.get("timestamp")
            v = p.get("equity") or p.get("value")
        else:
            d = getattr(p, "date", None) or getattr(p, "ts", None) or getattr(
                p, "timestamp", None
            )
            v = getattr(p, "equity", None) or getattr(p, "value", None)

        if d is None:
            continue

        equity_points.append(
            models.SimulationEquityPoint(
                simulation_id=sim.id,
                date=_to_date(d),
                equity=float(v) if v is not None else 0.0,
            )
        )

    if equity_points:
        db.bulk_save_objects(equity_points)

    # --- Guardar trades normalizados en simulation_trades ---
    raw_trades = data.get("trades", []) or []
    trade_rows: List[models.SimulationTrade] = []

    for t in raw_trades:
        if isinstance(t, dict):
            d = t.get("date") or t.get("ts") or t.get("timestamp")
            typ = t.get("type", "")
            price = float(t.get("price", 0.0))
            quantity = float(t.get("quantity", 0.0))
            profit_loss = float(t.get("profit_loss", 0.0))
        else:
            d = getattr(t, "date", None) or getattr(t, "ts", None) or getattr(
                t, "timestamp", None
            )
            typ = getattr(t, "type", "")
            price = float(getattr(t, "price", 0.0))
            quantity = float(getattr(t, "quantity", 0.0))
            profit_loss = float(getattr(t, "profit_loss", 0.0))

        if d is None:
            continue

        trade_rows.append(
            models.SimulationTrade(
                simulation_id=sim.id,
                date=_to_date(d),
                type=typ,
                price=price,
                quantity=quantity,
                profit_loss=profit_loss,
            )
        )

    if trade_rows:
        db.bulk_save_objects(trade_rows)

    # --- Commit final ---
    db.commit()
    db.refresh(sim)

    return sim
