from typing import Any

from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=300)
    branch_id: str = Field(min_length=1, max_length=100)
    # React can send its current product list (including localStorage changes).
    # If omitted, the service reads the repository mock products.
    products: list[dict[str, Any]] | None = None


class SearchResult(BaseModel):
    product: dict[str, Any]
    score: float


class SearchResponse(BaseModel):
    query: str
    branch_id: str
    total: int
    results: list[SearchResult]
