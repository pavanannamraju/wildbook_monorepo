#!/usr/bin/env python3
"""Backfill unique name-based slugs on guides missing `slug`.

Uses the same allocate_unique_slug rules as guide create (-2, -3 on collision).
Targets MONGO_DATABASE_NAME from .env (default wildbook_v1).
"""

from __future__ import annotations

import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
load_dotenv(ROOT / ".env")

from app.domain.guides.catalog_service import allocate_unique_slug  # noqa: E402


def main() -> None:
    uri = os.environ.get("MONGO_URI")
    if not uri:
        raise SystemExit("MONGO_URI is required")

    db_name = os.environ.get("MONGO_DATABASE_NAME") or "wildbook_v1"
    client = MongoClient(uri)
    guides = client[db_name]["guides"]
    now = datetime.now(timezone.utc)

    print(f"Connected database: {db_name}")

    taken: set[str] = set()
    for doc in guides.find({"slug": {"$type": "string"}, "is_deleted": False}, {"slug": 1}):
        slug = doc.get("slug")
        if isinstance(slug, str) and slug:
            taken.add(slug)

    missing = list(
        guides.find(
            {
                "is_deleted": False,
                "$or": [{"slug": {"$exists": False}}, {"slug": None}, {"slug": ""}],
            },
            {"_id": 1, "full_name": 1},
        ).sort("_id", 1)
    )
    print(f"Guides missing slug: {len(missing)}; existing slugs: {len(taken)}")

    updated = 0
    for doc in missing:
        name = str(doc.get("full_name") or "")
        slug = allocate_unique_slug(name, is_taken=lambda candidate, t=taken: candidate in t)
        taken.add(slug)
        result = guides.update_one(
            {"_id": doc["_id"]},
            {"$set": {"slug": slug, "updated_at": now}},
        )
        if result.modified_count:
            updated += 1
            print(f"  {doc['_id']} → {slug}")

    print(f"Updated {updated} guide(s)")


if __name__ == "__main__":
    main()
