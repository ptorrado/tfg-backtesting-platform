# app/models.py
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Date,
    DateTime,
    ForeignKey,
    JSON,
    text,
)
from sqlalchemy.orm import relationship

from .db import Base


class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    asset_type = Column(String, nullable=False)

    ohlcv = relationship("MarketOHLCV", back_populates="asset")
    simulations = relationship("Simulation", back_populates="asset")


class MarketOHLCV(Base):
    """
    Debe coincidir EXACTAMENTE con la tabla market_ohlcv que creaste
    al hacer la hypertable en TimescaleDB.

    Clave primaria compuesta: (asset_id, ts)
    SIN columnas id ni timeframe.
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


class Simulation(Base):
    __tablename__ = "simulations"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False, index=True)
    algorithm = Column(String, nullable=False)

    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)

    initial_capital = Column(Float, nullable=False)
    final_equity = Column(Float, nullable=False)
    total_return = Column(Float, nullable=False)
    max_drawdown = Column(Float, nullable=False)
    sharpe_ratio = Column(Float, nullable=False)

    status = Column(String, nullable=False, default="completed")
    number_of_trades = Column(Integer, nullable=False, default=0)
    winning_trades = Column(Integer, nullable=False, default=0)
    losing_trades = Column(Integer, nullable=False, default=0)
    accuracy = Column(Float, nullable=False, default=0.0)

    created_at = Column(
        DateTime(timezone=True),
        server_default=text("NOW()"),
        nullable=False,
    )

    # 👇 NUEVO: información de batch (para agrupar multi-sim)
    batch_name = Column(String, nullable=True)
    batch_group_id = Column(String, nullable=True, index=True)

    # 👇 parámetros usados en el backtest (modo avanzado)
    params = Column(JSON, nullable=True)

    asset = relationship("Asset", back_populates="simulations")

    # Nuevas relaciones normalizadas
    equity_points = relationship(
        "SimulationEquityPoint",
        back_populates="simulation",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    trades = relationship(
        "SimulationTrade",
        back_populates="simulation",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class SimulationEquityPoint(Base):
    __tablename__ = "simulation_equity_curve"

    id = Column(Integer, primary_key=True, index=True)
    simulation_id = Column(
        Integer,
        ForeignKey("simulations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    date = Column(Date, nullable=False)
    equity = Column(Float, nullable=False)

    simulation = relationship("Simulation", back_populates="equity_points")


class SimulationTrade(Base):
    __tablename__ = "simulation_trades"

    id = Column(Integer, primary_key=True, index=True)
    simulation_id = Column(
        Integer,
        ForeignKey("simulations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    date = Column(Date, nullable=False)
    type = Column(String, nullable=False)  # "buy" / "sell"
    price = Column(Float, nullable=False)
    quantity = Column(Float, nullable=False)
    profit_loss = Column(Float, nullable=False)

    simulation = relationship("Simulation", back_populates="trades")
