# Wildbook v1 Monolith

Single-process app: FastAPI serves the React SPA as static files and owns guide
catalog + search against **one MongoDB database** (no denormalized search clone,
no separate catalog/search services).

## What is included

- Site APIs under `/api/v1` (auth, experts, guide-profiles, bookmarks, inquiries, maps/accommodations)
- Guide search under `/api/search/guides`
- In-process guide domain (`guides`, `offerings`, references) with derived search fields on the guide document
- Frontend SPA from `static/` (same origin — leave `BUN_PUBLIC_BACKEND_ORIGIN` empty)

## Out of scope (v1)

Availability slots, checkout, bookings, payments, RabbitMQ/outbox.

## Setup

```bash
cd wildbook_v1
cp .env.example .env
# set MONGO_URI, FIREBASE_*, etc.

# Python deps (prefer uv)
uv sync
# or: python -m venv .venv && .venv/Scripts/activate && pip install -e .

# Seed reference data
uv run python scripts/seed_references.py

# Build SPA into static/
cd frontend
bun install
bun run build
cd ..

# Run one server
uv run uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000 — UI and API on the same origin.

## Layout

```
wildbook_v1/
  app/                 # FastAPI app
  frontend/            # React/Bun sources
  static/              # built SPA (from bun run build)
  scripts/             # seed_references.py
```

## Notes

- Existing microservice trees under `services/` and `backend/`/`frontend/` are unchanged.
- Search filters published active guides and uses `search_text` / price aggregates maintained on write.
