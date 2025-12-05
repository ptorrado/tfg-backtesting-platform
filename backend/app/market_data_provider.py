# app/market_data_provider.py
from datetime import date, datetime
from typing import List

import pandas as pd
from sqlalchemy.orm import Session

from .db import SessionLocal
from . import models


def load_ohlcv_dataframe(
    symbol: str,
    start: date,
    end: date,
) -> pd.DataFrame:
    """
    Carga datos OHLCV diarios de la base de datos (TimescaleDB/Postgres)
    y los devuelve como un DataFrame listo para usar con Backtrader.

    El índice será la columna datetime, y las columnas:
    ['open', 'high', 'low', 'close', 'volume'].
    """

    # Abrimos sesión a la BBDD
    db: Session = SessionLocal()

    try:
        # 1) Buscar el asset por símbolo
        asset = (
            db.query(models.Asset)
            .filter(models.Asset.symbol == symbol)
            .first()
        )
        if asset is None:
            return pd.DataFrame()

        # 2) Traer las velas de market_ohlcv
        rows: List[models.MarketOHLCV] = (
            db.query(models.MarketOHLCV)
            .filter(
                models.MarketOHLCV.asset_id == asset.id,
                models.MarketOHLCV.ts >= datetime.combine(start, datetime.min.time()),
                models.MarketOHLCV.ts <= datetime.combine(end, datetime.max.time()),
            )
            .order_by(models.MarketOHLCV.ts.asc())
            .all()
        )

        if not rows:
            return pd.DataFrame()

        data = {
            "datetime": [r.ts for r in rows],
            "open": [float(r.open) for r in rows],
            "high": [float(r.high) for r in rows],
            "low": [float(r.low) for r in rows],
            "close": [float(r.close) for r in rows],
            "volume": [float(r.volume or 0.0) for r in rows],
        }

        df = pd.DataFrame(data)
        df.set_index("datetime", inplace=True)
        return df

    finally:
        db.close()
