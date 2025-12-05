# app/seed_assets.py

from app.db import SessionLocal
from app import models

# Activos base que queremos tener en la tabla `assets`
# Asegúrate de que los símbolos coinciden con los de YF_SYMBOL_MAP en seed_market_data.py
ASSETS_TO_CREATE = [
    {"symbol": "AAPL",    "name": "Apple Inc.",                "asset_type": "stock"},
    {"symbol": "MSFT",    "name": "Microsoft Corp.",           "asset_type": "stock"},
    {"symbol": "GOOGL",   "name": "Alphabet Inc. (Google)",    "asset_type": "stock"},
    {"symbol": "TSLA",    "name": "Tesla Inc.",                "asset_type": "stock"},
    {"symbol": "SLV",     "name": "iShares Silver Trust",      "asset_type": "etf"},
    {"symbol": "BTC/USD", "name": "Bitcoin / US Dollar",       "asset_type": "crypto"},
]

def main():
    db = SessionLocal()
    try:
        for data in ASSETS_TO_CREATE:
            symbol = data["symbol"]

            # ¿Ya existe este asset?
            existing = db.query(models.Asset).filter(models.Asset.symbol == symbol).first()
            if existing:
                print(f"[SKIP] {symbol} ya existe (id={existing.id})")
                continue

            asset = models.Asset(
                symbol=data["symbol"],
                name=data["name"],
                asset_type=data["asset_type"],
                # ⚠️ Si tu modelo Asset tiene MÁS columnas NOT NULL,
                # añádelas aquí con sus valores por defecto.
            )

            db.add(asset)
            db.commit()
            db.refresh(asset)
            print(f"[OK] Creado asset {asset.symbol} (id={asset.id})")
    finally:
        db.close()

if __name__ == "__main__":
    main()
