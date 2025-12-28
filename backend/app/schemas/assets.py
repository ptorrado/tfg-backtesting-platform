from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class AssetOut(BaseModel):
    """Public representation of an Asset row."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    symbol: str
    name: str
    asset_type: str
