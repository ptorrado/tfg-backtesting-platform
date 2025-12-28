from __future__ import annotations

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer
from sqlalchemy.orm import relationship

from app.db import Base


class MarketOHLCV(Base):
    """
    OHLCV table with composite primary key (asset_id, ts).
    Must match the existing DB schema.
    """

    __tablename__ = "market_ohlcv"

    asset_id = Column(
        Integer,
        ForeignKey("assets.id"),
        primary_key=True,
        index=True,
        nullable=False,
    )
    ts = Column(
        DateTime(timezone=True),
        primary_key=True,
        index=True,
        nullable=False,
    )

    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    volume = Column(Float, nullable=False)

    asset = relationship("Asset", back_populates="ohlcv")
