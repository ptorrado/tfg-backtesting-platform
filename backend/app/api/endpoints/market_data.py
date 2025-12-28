from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Asset, MarketOHLCV
from app.schemas.market_data import OHLCVPoint

router = APIRouter(prefix="/market-data", tags=["market-data"])


@router.get("", response_model=List[OHLCVPoint])
def get_market_data(
    asset: str = Query(..., description="Asset symbol, e.g. AAPL"),
    start_date: date = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: date = Query(..., description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
) -> List[OHLCVPoint]:
    """Return OHLCV bars for an asset between start_date and end_date (inclusive)."""
    if start_date > end_date:
        raise HTTPException(status_code=400, detail="start_date must be <= end_date")

    asset_row = db.query(Asset).filter(Asset.symbol == asset).first()
    if asset_row is None:
        raise HTTPException(status_code=404, detail="Asset not found")

    start_dt = datetime.combine(start_date, datetime.min.time())
    end_dt = datetime.combine(end_date + timedelta(days=1), datetime.min.time())

    return (
        db.query(MarketOHLCV)
        .filter(MarketOHLCV.asset_id == asset_row.id)
        .filter(MarketOHLCV.ts >= start_dt)
        .filter(MarketOHLCV.ts < end_dt)
        .order_by(MarketOHLCV.ts.asc())
        .all()
    )
