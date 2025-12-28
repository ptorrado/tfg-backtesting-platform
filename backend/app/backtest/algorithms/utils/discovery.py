# app/backtest/algorithms/discovery.py
from __future__ import annotations

from functools import lru_cache
from importlib import import_module
from pkgutil import iter_modules
from typing import Any, Dict, List

from .spec import AlgorithmSpec


_EXCLUDE = {"__init__", "spec", "discovery"}


@lru_cache(maxsize=1)
def _load_specs() -> Dict[str, AlgorithmSpec]:
    pkg = import_module("app.backtest.algorithms")
    pkg_path = pkg.__path__  # type: ignore[attr-defined]

    specs: Dict[str, AlgorithmSpec] = {}

    for mod in iter_modules(pkg_path):
        if mod.ispkg or mod.name in _EXCLUDE:
            continue

        module = import_module(f"{pkg.__name__}.{mod.name}")

        spec = getattr(module, "ALGORITHM", None)
        if spec is None:
            continue

        if not isinstance(spec, AlgorithmSpec):
            raise TypeError(f"{module.__name__}.ALGORITHM must be an AlgorithmSpec")

        if spec.id in specs:
            raise ValueError(f"Duplicate algorithm id: {spec.id}")

        specs[spec.id] = spec

    return specs


def list_algorithm_definitions() -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    for spec in _load_specs().values():
        if spec.hidden:
            continue
        out.append(
            {
                "id": spec.id,
                "name": spec.name,
                "category": spec.category,
                "description": spec.description,
                "params": [
                    {
                        "name": p.name,
                        "label": p.label,
                        "type": p.type,
                        "min": p.min,
                        "max": p.max,
                        "step": p.step,
                        "default": p.default,
                        "description": p.description,
                    }
                    for p in spec.params
                ],
            }
        )
    return out


def get_algorithm_fn(algorithm_id: str):
    spec = _load_specs().get(algorithm_id)
    if spec is None:
        raise ValueError(f"Unsupported algorithm: {algorithm_id}")
    return spec.fn
