from typing import List

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app import models

router = APIRouter(prefix="/assets", tags=["assets"])


class AssetOut(BaseModel):
    id: int
    symbol: str
    name: str
    asset_type: str

    class Config:
        from_attributes = True  # pydantic v2


@router.get("", response_model=List[AssetOut])
def list_assets(db: Session = Depends(get_db)) -> List[AssetOut]:
    """
    Devuelve todos los activos registrados en la tabla assets,
    ordenados por símbolo.
    """
    return (
        db.query(models.Asset)
        .order_by(models.Asset.symbol.asc())
        .all()
    )
