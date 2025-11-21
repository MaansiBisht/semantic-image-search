from __future__ import annotations

from typing import Any, Optional
from enum import Enum

from pydantic import BaseModel, Field


class ColorFilter(str, Enum):
    BLACK_AND_WHITE = "black_and_white"
    BLACK = "black"
    WHITE = "white"
    YELLOW = "yellow"
    ORANGE = "orange"
    RED = "red"
    PURPLE = "purple"
    MAGENTA = "magenta"
    GREEN = "green"
    TEAL = "teal"
    BLUE = "blue"


class OrientationFilter(str, Enum):
    LANDSCAPE = "landscape"
    PORTRAIT = "portrait"
    SQUARISH = "squarish"


class SearchMode(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    HYBRID = "hybrid"


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1)
    mode: SearchMode = SearchMode.TEXT
    image_url: Optional[str] = None
    ingest: bool = False
    page: int = Field(1, ge=1)
    per_page: int | None = Field(None, ge=1, le=30)
    top_k: int | None = Field(None, ge=1, le=100)
    min_score: float | None = Field(None, ge=0.0, le=1.0, description="Minimum similarity score threshold (0.0-1.0)")
    # Filters
    color: Optional[ColorFilter] = None
    orientation: Optional[OrientationFilter] = None
    date_from: Optional[str] = Field(None, description="ISO date string (YYYY-MM-DD)")
    date_to: Optional[str] = Field(None, description="ISO date string (YYYY-MM-DD)")
    # Weighted scoring parameters
    image_weight: float = Field(0.6, ge=0.0, le=1.0, description="Weight for image embedding similarity")
    text_weight: float = Field(0.2, ge=0.0, le=1.0, description="Weight for text/metadata similarity")
    metadata_weight: float = Field(0.2, ge=0.0, le=1.0, description="Weight for metadata/color similarity")
    use_advanced_scoring: bool = Field(False, description="Enable weighted multi-modal scoring")


class SearchResult(BaseModel):
    id: str | None
    score: float
    metadata: dict[str, Any]


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResult]
    count: int
    top_k: int
    ingested: list[dict[str, Any]]


class Category(BaseModel):
    id: str | None
    title: str | None
    slug: str | None
    description: str | None
    cover_photo_url: str | None


class CategoriesResponse(BaseModel):
    categories: list[Category]


class StatsResponse(BaseModel):
    dimension: int
    namespaces: dict[str, int]
    total_vectors: int
