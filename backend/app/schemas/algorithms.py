from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel


class AlgorithmParam(BaseModel):
    name: str
    label: str
    type: Literal["int", "float"]
    min: float
    max: float
    step: float
    default: float
    description: Optional[str] = None


class AlgorithmInfo(BaseModel):
    id: str
    name: str
    category: str
    description: str
    params: List[AlgorithmParam]
