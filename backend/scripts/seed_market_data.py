# app/seed_market_data.py

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from typing import List

import pandas as pd
import yfinance as yf
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.models import MarketOHLCV, Asset


# ========= HELPERS DB =========

def get_last_ts_for_asset(db: Session, asset_id: int) -> datetime | None:
    """
    Devuelve el último timestamp que tenemos en market_ohlcv
    para ese asset, o None si no hay datos.
    """
    return (
        db.query(func.max(MarketOHLCV.ts))
        .filter(MarketOHLCV.asset_id == asset_id)
        .scalar()
    )


def _normalize_ts_to_utc(ts: object) -> datetime:
    """
    Normaliza un índice ts (Timestamp / datetime / date) a datetime con tz UTC.
    """
    if isinstance(ts, pd.Timestamp):
        if ts.tzinfo is not None:
            return ts.tz_convert("UTC").to_pydatetime()
        return datetime(ts.year, ts.month, ts.day, tzinfo=timezone.utc)

    if isinstance(ts, datetime):
        if ts.tzinfo is not None:
            return ts.astimezone(timezone.utc)
        return ts.replace(tzinfo=timezone.utc)

    # Si es date u otro compatible
    return datetime(ts.year, ts.month, ts.day, tzinfo=timezone.utc)


def _ensure_single_ticker_df(df: pd.DataFrame, symbol: str) -> pd.DataFrame:
    """
    Asegura que df tiene columnas simples ['Open','High','Low','Close','Volume']
    incluso si yfinance devuelve MultiIndex por ticker.
    """
    if not isinstance(df.columns, pd.MultiIndex):
        # Caso normal: columnas planas
        return df

    # MultiIndex: típicamente level 0 = campo (Open, High...), level 1 = ticker
    # Intentamos seleccionar por símbolo en el segundo nivel
    levels0 = df.columns.get_level_values(0)
    levels1 = df.columns.get_level_values(1)

    if symbol in levels1:
        # columnas tipo ('Open', 'AAPL'), ('High','AAPL'), etc.
        df_single = df.xs(symbol, axis=1, level=1)
        return df_single

    if symbol in levels0:
        # columnas tipo ('AAPL', 'Open'), ('AAPL','High'), etc.
        df_single = df.xs(symbol, axis=1, level=0)
        return df_single

    # Si por lo que sea no encontramos el símbolo, cogemos el primer ticker disponible
    first_ticker = list(dict.fromkeys(levels1))[0]
    df_single = df.xs(first_ticker, axis=1, level=1)
    return df_single


# ========= LÓGICA DE ACTUALIZACIÓN =========

def seed_asset_ohlcv(db: Session, asset: Asset) -> None:
    """
    Descarga OHLCV diarios para UN asset usando su símbolo tal cual está
    en la tabla `assets` (debe coincidir con el ticker de Yahoo).

    - Si NO hay datos en market_ohlcv -> descarga TODO el histórico disponible (period="max").
    - Si SÍ hay datos                  -> descarga solo desde (último día + 1) hasta hoy.
    """
    symbol = asset.symbol
    print(f"\n========== Procesando {symbol} ==========")

    last_ts = get_last_ts_for_asset(db, asset.id)
    today = date.today()

    # ---- Caso 1: sin datos previos -> histórico máximo disponible ----
    if last_ts is None:
        print(f"[{symbol}] Sin datos previos. Bajando histórico completo (period='max').")

        df = yf.download(
            symbol,
            period="max",          # TODO el histórico disponible
            interval="1d",
            auto_adjust=False,
            progress=False,
        )

        if df.empty:
            print(f"[{symbol}] Yahoo no devolvió datos (period='max').")
            return

    # ---- Caso 2: ya hay datos -> incremental desde último día + 1 ----
    else:
        last_day = last_ts.date()
        from_date = last_day + timedelta(days=1)
        print(
            f"[{symbol}] Último día en BBDD: {last_day}. "
            f"Buscando datos desde {from_date} hasta {today}"
        )

        if from_date > today:
            print(f"[{symbol}] Datos ya actualizados hasta {today}. Nada que hacer.")
            return

        yf_end = today + timedelta(days=1)  # end exclusivo

        df = yf.download(
            symbol,
            start=from_date,
            end=yf_end,
            interval="1d",
            auto_adjust=False,
            progress=False,
        )

        if df.empty:
            print(
                f"[{symbol}] Sin datos nuevos entre {from_date} y {today} "
                f"(puede ser fin de semana / festivos)."
            )
            return

    # --- Normalizar estructura del DataFrame ---
    df = _ensure_single_ticker_df(df, symbol)

    # Nos quedamos solo con las columnas que necesitamos
    needed_cols = ["Open", "High", "Low", "Close", "Volume"]
    missing = [c for c in needed_cols if c not in df.columns]
    if missing:
        print(f"[{symbol}] Faltan columnas en datos de Yahoo: {missing}. Saltando asset.")
        return

    # Por si acaso, nos aseguramos de que no haya filas completamente vacías
    df = df[needed_cols].dropna(subset=["Open", "High", "Low", "Close"], how="any")

    if df.empty:
        print(f"[{symbol}] Tras limpiar NaNs no quedan filas válidas.")
        return

    rows_to_insert: List[MarketOHLCV] = []

    # Iteramos de forma ESCALAR, sin usar row["col"] (que podría ser Series)
    opens = df["Open"].values
    highs = df["High"].values
    lows = df["Low"].values
    closes = df["Close"].values
    volumes = df["Volume"].values

    for ts, open_, high, low, close, volume_raw in zip(
        df.index, opens, highs, lows, closes, volumes
    ):
        ts_utc = _normalize_ts_to_utc(ts)

        # Convertimos a float de forma segura
        try:
            open_f = float(open_)
            high_f = float(high)
            low_f = float(low)
            close_f = float(close)
        except Exception:
            # Si por lo que sea no se puede convertir, saltamos la fila
            continue

        vol = 0.0
        try:
            vol = float(volume_raw)
            if pd.isna(vol):
                vol = 0.0
        except Exception:
            vol = 0.0

        rows_to_insert.append(
            MarketOHLCV(
                asset_id=asset.id,
                ts=ts_utc,
                open=open_f,
                high=high_f,
                low=low_f,
                close=close_f,
                volume=vol,
            )
        )

    if not rows_to_insert:
        print(f"[{symbol}] No hay filas nuevas para insertar (todas inválidas).")
        return

    db.bulk_save_objects(rows_to_insert)
    db.commit()

    first_ts = rows_to_insert[0].ts.date()
    last_ts_new = rows_to_insert[-1].ts.date()
    print(
        f"[{symbol}] Insertadas {len(rows_to_insert)} filas nuevas "
        f"({first_ts} -> {last_ts_new})"
    )


def main() -> None:
    db = SessionLocal()
    try:
        assets: List[Asset] = db.query(Asset).all()

        if not assets:
            print(
                "No se encontraron assets en la tabla 'assets'. "
                "Ejecuta antes seed_assets.py."
            )
            return

        print(f"Encontrados {len(assets)} assets. Actualizando OHLCV...")
        for asset in assets:
            seed_asset_ohlcv(db, asset)
    finally:
        db.close()


if __name__ == "__main__":
    main()
