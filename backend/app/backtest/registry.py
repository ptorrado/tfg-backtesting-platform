# app/backtest/registry.py

from datetime import date
from typing import Any, Callable, Dict, List

from sqlalchemy.orm import Session

from .algorithms.sma_crossover import run_sma_crossover
from .algorithms.omniscient_benchmark import run_omniscient_benchmark
from .algorithms.rsi_reversion import run_rsi_reversion

AlgorithmFn = Callable[
    [Session, str, date, date, float, Dict[str, Any]],
    Dict[str, Any],
]

ALGORITHMS: Dict[str, Dict[str, Any]] = {
    "sma_crossover": {
        "id": "sma_crossover",
        "name": "SMA Crossover",
        "category": "Trend-following",
        "description": (
            "Long-only SMA crossover: enters long when fast SMA > slow SMA "
            "and exits when it crosses below."
        ),
        "params": [
            {
                "name": "short_window",
                "label": "Fast SMA window",
                "type": "int",
                "min": 5,
                "max": 50,
                "step": 1,
                "default": 20,
                "description": "Number of days for the fast moving average.",
            },
            {
                "name": "long_window",
                "label": "Slow SMA window",
                "type": "int",
                "min": 20,
                "max": 200,
                "step": 1,
                "default": 50,
                "description": "Number of days for the slow moving average.",
            },
        ],
        "fn": run_sma_crossover,
    },
    "rsi_reversion": {
        "id": "rsi_reversion",
        "name": "RSI Mean Reversion",
        "category": "Mean-reversion",
        "description": (
            "Long-only RSI strategy: buys when RSI indicates oversold "
            "and exits when RSI reaches overbought levels."
        ),
        "params": [
            {
                "name": "rsi_period",
                "label": "RSI period",
                "type": "int",
                "min": 2,
                "max": 100,
                "step": 1,
                "default": 14,
                "description": "Number of days to compute the RSI.",
            },
            {
                "name": "oversold",
                "label": "Oversold level",
                "type": "float",
                "min": 5,
                "max": 50,
                "step": 1,
                "default": 30,
                "description": "RSI threshold below which the asset is considered oversold.",
            },
            {
                "name": "overbought",
                "label": "Overbought level",
                "type": "float",
                "min": 50,
                "max": 95,
                "step": 1,
                "default": 70,
                "description": "RSI threshold above which the asset is considered overbought.",
            },
        ],
        "fn": run_rsi_reversion,
    },
    # 👇 Benchmark ideal, no seleccionable desde el frontend
    "omniscient_benchmark": {
        "id": "omniscient_benchmark",
        "name": "Omniscient benchmark",
        "category": "Benchmark",
        "description": (
            "Ideal, non-tradable benchmark that knows all future prices "
            "and perfectly buys before each upswing and sells before each downswing."
        ),
        "params": [],
        "fn": run_omniscient_benchmark,
        "hidden": True,  # ⬅️ así no aparece en /algorithms
    },
}


def list_algorithm_definitions() -> List[Dict[str, Any]]:
    return [
        {
            "id": cfg["id"],
            "name": cfg["name"],
            "category": cfg["category"],
            "description": cfg["description"],
            "params": cfg["params"],
        }
        for cfg in ALGORITHMS.values()
        if not cfg.get("hidden", False)
    ]


def get_algorithm_fn(algorithm_id: str) -> AlgorithmFn:
    try:
        algo_def = ALGORITHMS[algorithm_id]
    except KeyError:
        raise ValueError(f"Unsupported algorithm: {algorithm_id}")

    fn = algo_def.get("fn")
    if fn is None:
        raise ValueError(f"Algorithm '{algorithm_id}' has no 'fn' configured")

    return fn  # type: ignore[return-value]
