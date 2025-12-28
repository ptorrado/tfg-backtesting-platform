from __future__ import annotations

from sqlalchemy import (
    JSON,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    text,
)
from sqlalchemy.orm import relationship

from app.db import Base


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

    # Batch info (optional)
    batch_name = Column(String, nullable=True)
    batch_group_id = Column(String, nullable=True, index=True)

    # Params used by the strategy (optional)
    params = Column(JSON, nullable=True)

    asset = relationship("Asset", back_populates="simulations")

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
