from functools import lru_cache
from typing import Any

import numpy as np
from sentence_transformers import SentenceTransformer


MODEL_NAME = "intfloat/multilingual-e5-small"


@lru_cache(maxsize=1)
def get_model() -> SentenceTransformer:
    """Load the multilingual embedding model once per service process."""
    return SentenceTransformer(MODEL_NAME, device="cpu")


def _product_text(product: dict[str, Any]) -> str:
    # Similarity is intentionally based ONLY on title and description.
    title = str(product.get("title") or "").strip()
    description = str(product.get("description") or "").strip()
    return f"passage: {title}. {description}".strip()


def _available_in_branch(
    product: dict[str, Any], branch_id: str
) -> bool:
    inventory = product.get("branchInventory") or []
    for item in inventory:
        if str(item.get("branchId")) == branch_id:
            try:
                return float(item.get("stock", 0)) > 0
            except (TypeError, ValueError):
                return False
    return False


def rank_products(
    query: str,
    products: list[dict[str, Any]],
    branch_id: str,
) -> list[dict[str, Any]]:
    available_products = [
        product
        for product in products
        if _available_in_branch(product, branch_id)
        and _product_text(product) != "passage: ."
    ]

    if not available_products:
        return []

    model = get_model()
    query_embedding = model.encode(
        [f"query: {query.strip()}"],
        normalize_embeddings=True,
        convert_to_numpy=True,
        show_progress_bar=False,
    )[0]

    product_texts = [_product_text(product) for product in available_products]
    product_embeddings = model.encode(
        product_texts,
        normalize_embeddings=True,
        convert_to_numpy=True,
        show_progress_bar=False,
        batch_size=16,
    )

    scores = np.dot(product_embeddings, query_embedding)
    ranked_indices = np.argsort(scores)[::-1]

    return [
        {
            "product": available_products[int(index)],
            "score": round(float(scores[index]), 4),
        }
        for index in ranked_indices
    ]
