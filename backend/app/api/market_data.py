from datetime import date, datetime, timedelta
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Asset, MarketOHLCV

router = APIRouter(prefix="/market-data", tags=["market-data"])


class OHLCVPoint(BaseModel):
    ts: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float

    class Config:
        from_attributes = True


@router.get("", response_model=List[OHLCVPoint])
def get_market_data(
    asset: str = Query(..., description="Asset symbol, e.g. AAPL"),
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
) -> List[OHLCVPoint]:
    """
    Devuelve OHLCV diario para un asset entre start_date y end_date (incluidos).
    """
    try:
        start_date_obj = date.fromisoformat(start_date.strip())
        end_date_obj = date.fromisoformat(end_date.strip())
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="start_date and end_date must be in format YYYY-MM-DD",
        )

    asset_row = db.query(Asset).filter(Asset.symbol == asset).first()
    if not asset_row:
        raise HTTPException(status_code=404, detail="Asset not found")

    start_dt = datetime.combine(start_date_obj, datetime.min.time())
    end_dt = datetime.combine(end_date_obj + timedelta(days=1), datetime.min.time())

    rows = (
        db.query(MarketOHLCV)
        .filter(MarketOHLCV.asset_id == asset_row.id)
        .filter(MarketOHLCV.ts >= start_dt)
        .filter(MarketOHLCV.ts < end_dt)
        .order_by(MarketOHLCV.ts.asc())
        .all()
    )

    return rows
