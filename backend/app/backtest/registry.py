from datetime import date
from typing import Any, Callable, Dict, List

from sqlalchemy.orm import Session

from .algorithms.sma_crossover import run_sma_crossover

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
