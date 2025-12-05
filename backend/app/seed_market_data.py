# app/seed_market_data.py
"""
Rellena la tabla market_ohlcv con datos diarios de Yahoo Finance
para todos los assets que haya en la tabla assets.

Se conecta usando la misma DATABASE_URL que FastAPI (archivo .env).
"""

from __future__ import annotations

from typing import Dict

import yfinance as yf
from sqlalchemy.orm import Session

from .db import SessionLocal
from . import models


# Map de símbolo en tu tabla "assets" -> ticker de Yahoo Finance
YF_SYMBOL_MAP: Dict[str, str] = {
    "AAPL": "AAPL",
    "MSFT": "MSFT",
    "GOOGL": "GOOGL",
    "TSLA": "TSLA",
    "SLV": "SLV",
    # Ojo con BTC: en tu tabla es "BTC/USD", en Yahoo es "BTC-USD"
    "BTC/USD": "BTC-USD",
}


def fetch_yf_data(symbol: str):
    """
    Descarga TODO el histórico disponible en Yahoo Finance
    en temporalidad diaria (1d).
    """
    print(f"  -> Descargando datos de Yahoo Finance para {symbol} (period=max, 1d)")

    df = yf.download(
        symbol,
        period="max",      # TODO el histórico disponible
        interval="1d",     # OHLCV diario
        auto_adjust=False,
        progress=False,
    )

    if df.empty:
        print("  !! DataFrame vacío, sin datos recibidos")
        return None

    # Nos aseguramos de que el índice datetime no tenga timezone
    try:
        if getattr(df.index, "tz", None) is not None:
            df.index = df.index.tz_convert(None)
    except Exception:
        # Si ya es naive, pasamos
        pass

    return df


def load_asset_ohlcv(db: Session, asset: models.Asset):
    """
    Elimina los datos previos de ese asset en market_ohlcv
    y los rellena con lo obtenido de Yahoo Finance.
    """
    yf_symbol = YF_SYMBOL_MAP.get(asset.symbol)
    if not yf_symbol:
        print(f"[SKIP] Asset {asset.symbol}: no tiene mapping a Yahoo Finance")
        return

    df = fetch_yf_data(yf_symbol)
    if df is None:
        print(f"[WARN] Sin datos para {asset.symbol} / {yf_symbol}")
        return

    print(f"  -> Borrando datos antiguos de market_ohlcv para asset_id={asset.id}")
    db.query(models.MarketOHLCV).filter(
        models.MarketOHLCV.asset_id == asset.id
    ).delete()

    candles = []
    for ts, row in df.iterrows():
        # Algunas veces Volume puede venir como NaN -> lo convertimos a 0
        volume_val = row.get("Volume", 0.0)
        try:
            volume = float(volume_val) if volume_val == volume_val else 0.0  # NaN check
        except Exception:
            volume = 0.0

        candle = models.MarketOHLCV(
            asset_id=asset.id,
            ts=ts.to_pydatetime(),
            open=float(row["Open"]),
            high=float(row["High"]),
            low=float(row["Low"]),
            close=float(row["Close"]),
            volume=volume,
        )
        candles.append(candle)

    db.bulk_save_objects(candles)
    db.commit()

    print(f"[OK] Insertadas {len(candles)} velas para {asset.symbol} (asset_id={asset.id})")


def main():
    db = SessionLocal()
    try:
        assets = db.query(models.Asset).all()
        print(f"Encontrados {len(assets)} assets en tabla 'assets'")

        for asset in assets:
            print(f"\n=== Procesando asset {asset.id} - {asset.symbol} ===")
            load_asset_ohlcv(db, asset)

        print("\n✅ Seed de market_ohlcv terminado.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
