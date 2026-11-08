import json
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .schemas import SearchRequest, SearchResponse
from .semantic_search import rank_products


app = FastAPI(
    title="Crown & Anchor Semantic Search",
    description="Arabic-English semantic product search for the Store App.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MOCK_PRODUCTS_PATH = (
    Path(__file__).resolve().parents[2]
    / "frontend"
    / "public"
    / "mock"
    / "products.json"
)


def load_mock_products() -> list[dict[str, Any]]:
    try:
        with MOCK_PRODUCTS_PATH.open("r", encoding="utf-8") as file:
            data = json.load(file)
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=500,
            detail="Mock products file was not found.",
        ) from exc
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=500,
            detail="Mock products file contains invalid JSON.",
        ) from exc

    products = data.get("products")
    if not isinstance(products, list):
        raise HTTPException(
            status_code=500,
            detail="Mock products file must contain a products array.",
        )
    return products


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "semantic-search"}


@app.post("/search", response_model=SearchResponse)
def semantic_search(request: SearchRequest) -> SearchResponse:
    query = request.query.strip()
    if not query:
        raise HTTPException(status_code=422, detail="Query cannot be empty.")

    products = (
        request.products
        if request.products is not None
        else load_mock_products()
    )

    try:
        results = rank_products(query, products, request.branch_id)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Semantic search failed: {type(exc).__name__}: {exc}",
        ) from exc

    return SearchResponse(
        query=query,
        branch_id=request.branch_id,
        total=len(results),
        results=results,
    )
