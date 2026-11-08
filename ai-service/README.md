# Store App Semantic Search API

A small FastAPI service for Arabic-English semantic product search.

## Requirements

- Python 3.10+
- The repository's `frontend/public/mock/products.json` file

## Setup (Windows PowerShell)

Run these commands from the repository root:

```powershell
cd ai-service
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## Run

From the `ai-service` directory:

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The first semantic search downloads `intfloat/multilingual-e5-small`. This is a one-time download; subsequent runs use the local model cache.

## Endpoints

- `GET /health` — service status
- `POST /search` — semantic product search

Example request (uses the repository mock products):

```json
{
  "query": "هاتف مناسب للألعاب",
  "branch_id": "damascus"
}
```

You can also pass a `products` array in the request. This is intended for the React prototype so searches use the same product data currently displayed by the UI (including local changes).

The service filters products by positive stock in the selected branch before ranking. Similarity uses only each product's `title` and `description`; brand, category, price, and rating are not embedded.

Interactive API documentation is available at `http://127.0.0.1:8000/docs`.
