"""Response models for search endpoints."""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

from backend.app.schemas.llm_outputs import ProductAnalysis


class ProductReview(BaseModel):
    content: str
    rating: Optional[int] = None
    verified_purchase: Optional[bool] = None
    user_id: Optional[str] = None
    timestamp: Optional[datetime] = None
    similarity: Optional[float] = None
    has_rating: Optional[int] = None


class ProductSearchResult(BaseModel):
    asin: str
    product_title: str
    cleaned_item_description: str
    product_categories: str
    similarity: Optional[float] = None
    avg_rating: Optional[float] = None
    rating_count: Optional[int] = None
    displayed_rating: Optional[str] = None
    combined_score: Optional[float] = None
    reviews: List[ProductReview] = Field(default_factory=list)
    analysis: Optional[ProductAnalysis] = None


class SearchResponse(BaseModel):
    query: str
    count: int
    results: List[ProductSearchResult]


__all__ = [
    "ProductReview",
    "ProductSearchResult",
    "SearchResponse",
]
