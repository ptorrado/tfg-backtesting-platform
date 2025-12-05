# app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import simulations
from .api import assets
from .api import market_data
from .api import algorithms  # <-- NUEVO

app = FastAPI(title="Backtest Lab API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(assets.router)
app.include_router(market_data.router)
app.include_router(simulations.router)
app.include_router(algorithms.router)  # <-- NUEVO
