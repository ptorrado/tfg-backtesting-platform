from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models
from app.db import get_db
from app.schemas.assets import AssetOut

router = APIRouter(prefix="/assets", tags=["assets"])


@router.get("", response_model=List[AssetOut])
def list_assets(db: Session = Depends(get_db)) -> List[AssetOut]:
    """List all assets stored in the database, ordered by symbol."""
    return db.query(models.Asset).order_by(models.Asset.symbol.asc()).all()
