#!/usr/bin/env python3
"""Normalize location aliases in wildbook_prod (Bangalore→Bengaluru, hyd→Hyderabad, etc.).

Remaps guides.primary_location_id onto canonical reference ids and deactivates
duplicate alias rows in reference_locations.
"""

from __future__ import annotations

import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient, UpdateOne

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
load_dotenv(ROOT / ".env")

from app.domain.guides.location_aliases import (  # noqa: E402
    canonicalize_location_id,
    canonical_location_display_name,
    iter_alias_location_ids,
)

TARGET_DATABASE = "wildbook_prod"


def main() -> None:
    uri = os.environ.get("MONGO_URI")
    if not uri:
        raise SystemExit("MONGO_URI is required")

    # Always target production catalog data for this normalization.
    db_name = TARGET_DATABASE
    env_db = os.environ.get("MONGO_DATABASE_NAME")
    if env_db and env_db != TARGET_DATABASE:
        print(f"Note: MONGO_DATABASE_NAME={env_db!r}, forcing target db={TARGET_DATABASE!r}")

    client = MongoClient(uri)
    db = client[db_name]
    guides = db["guides"]
    locations = db["reference_locations"]
    now = datetime.now(timezone.utc)

    print(f"Connected database: {db_name}")

    alias_ids = iter_alias_location_ids()
    remap_count = 0
    for alias_id in alias_ids:
        canonical_id = canonicalize_location_id(alias_id)
        if not canonical_id or canonical_id == alias_id:
            continue
        result = guides.update_many(
            {"primary_location_id": alias_id},
            {"$set": {"primary_location_id": canonical_id, "updated_at": now}},
        )
        if result.modified_count:
            print(f"  guides {alias_id} → {canonical_id}: {result.modified_count}")
            remap_count += result.modified_count

    # Ensure every published guide id is canonicalized even if not in alias list.
    published = list(
        guides.find(
            {"status": "PUBLISHED", "is_deleted": False},
            {"_id": 1, "primary_location_id": 1},
        )
    )
    guide_ops: list[UpdateOne] = []
    for guide in published:
        current = guide.get("primary_location_id")
        if not isinstance(current, str) or not current:
            continue
        canonical = canonicalize_location_id(current)
        if canonical and canonical != current:
            guide_ops.append(
                UpdateOne(
                    {"_id": guide["_id"]},
                    {"$set": {"primary_location_id": canonical, "updated_at": now}},
                )
            )
    if guide_ops:
        bulk = guides.bulk_write(guide_ops)
        remap_count += bulk.modified_count
        print(f"  additional guide remaps: {bulk.modified_count}")

    # Deactivate alias location rows and keep canonical display names clean.
    deactivated = 0
    for alias_id in alias_ids:
        canonical_id = canonicalize_location_id(alias_id)
        if not canonical_id or canonical_id == alias_id:
            continue
        alias_doc = locations.find_one({"_id": alias_id})
        if alias_doc is None:
            continue
        display_name = canonical_location_display_name(canonical_id) or canonical_id
        # Ensure canonical exists / is active with the preferred display name.
        locations.update_one(
            {"_id": canonical_id},
            {
                "$set": {
                    "name": display_name,
                    "city": display_name,
                    "is_active": True,
                    "updated_at": now,
                },
                "$setOnInsert": {
                    "state": alias_doc.get("state"),
                    "country": alias_doc.get("country") or "India",
                    "created_at": now,
                },
            },
            upsert=True,
        )
        result = locations.update_one(
            {"_id": alias_id},
            {
                "$set": {
                    "is_active": False,
                    "merged_into": canonical_id,
                    "updated_at": now,
                }
            },
        )
        if result.matched_count:
            deactivated += 1
            print(f"  deactivated {alias_id} → {canonical_id}")

    print(f"Done. guides remapped={remap_count}, alias refs touched={deactivated}")

    # Summary of remaining published location usage.
    usage = list(
        guides.aggregate(
            [
                {"$match": {"status": "PUBLISHED", "is_deleted": False}},
                {"$group": {"_id": "$primary_location_id", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}},
            ]
        )
    )
    print("Published guides by primary_location_id:")
    for row in usage:
        print(f"  {row['_id']}: {row['count']}")

    active_locs = list(
        locations.find({"is_active": True}, {"_id": 1, "name": 1}).sort("name", 1)
    )
    print("Active reference_locations:")
    for loc in active_locs:
        print(f"  {loc['_id']}: {loc.get('name')}")


if __name__ == "__main__":
    main()
