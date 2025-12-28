from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import List

from sqlalchemy.orm import Session

from app import models
from app.backtest.types import Candle


def load_ohlcv(
    db: Session,
    asset_symbol: str,
    start: date,
    end: date,
) -> List[Candle]:
    asset = db.query(models.Asset).filter(models.Asset.symbol == asset_symbol).first()
    if asset is None:
        raise ValueError(f"Asset '{asset_symbol}' not found in assets table")

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
        raise ValueError(f"No OHLCV data for '{asset_symbol}' between {start} and {end}")

    return [
        Candle(
            ts=row.ts,
            open=float(row.open),
            high=float(row.high),
            low=float(row.low),
            close=float(row.close),
            volume=float(row.volume),
        )
        for row in rows
    ]
