from fastapi import APIRouter

from app.api.endpoints.assets import router as assets_router
from app.api.endpoints.market_data import router as market_data_router
from app.api.endpoints.simulations import router as simulations_router
from app.api.endpoints.algorithms import router as algorithms_router

api_router = APIRouter()

api_router.include_router(assets_router)
api_router.include_router(market_data_router)
api_router.include_router(simulations_router)
api_router.include_router(algorithms_router)
