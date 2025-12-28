# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.api import api_router
from app.core.health import check_db_connection

app = FastAPI(title="Backtest Lab API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # en prod pondrás tu dominio
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def _startup() -> None:
    # Falla rápido si la DB no está accesible
    check_db_connection()

app.include_router(api_router)
