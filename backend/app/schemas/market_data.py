from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class OHLCVPoint(BaseModel):
    """Single OHLCV bar returned by the market data endpoint."""

    model_config = ConfigDict(from_attributes=True)

    ts: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float
