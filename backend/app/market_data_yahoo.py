# app/market_data_yahoo.py

from datetime import date
from typing import List

import yfinance as yf

from .backtest.engine import Candle
from .market_data_provider import MarketDataProvider


# Mapa de símbolo interno -> símbolo que entiende yfinance
SYMBOL_MAP = {
    "BTC/USD": "BTC-USD",  # ejemplo: el resto coinciden
    # si en el futuro tienes símbolos raros, los añades aquí
}


class YahooMarketDataProvider(MarketDataProvider):
    """
    Proveedor de datos basado en yfinance (Yahoo Finance).
    """

    def _to_provider_symbol(self, symbol: str) -> str:
        return SYMBOL_MAP.get(symbol, symbol)

    def get_daily_ohlcv(
        self,
        symbol: str,
        start: date,
        end: date,
    ) -> List[Candle]:
        yf_symbol = self._to_provider_symbol(symbol)

        # yfinance usa end exclusivo para fechas, así que si quieres
        # incluir end puedes sumar un día, pero para diario normalmente
        # no pasa nada si lo dejas así.
        df = yf.download(
            yf_symbol,
            start=start.isoformat(),
            end=end.isoformat(),
            interval="1d",
            auto_adjust=False,   # dejamos precios “crudos”
            progress=False,
        )

        candles: List[Candle] = []

        # df.index -> Timestamp (con o sin tz)
        for ts, row in df.iterrows():
            # Por si hubiese algún NaN raro
            if row.isna().any():
                continue

            ts_dt = ts.to_pydatetime()
            # Opcional: dejarlo “naive” sin tz
            ts_dt = ts_dt.replace(tzinfo=None)

            candles.append(
                Candle(
                    ts=ts_dt,
                    open=float(row["Open"]),
                    high=float(row["High"]),
                    low=float(row["Low"]),
                    close=float(row["Close"]),
                    volume=float(row["Volume"]),
                )
            )

        return candles
