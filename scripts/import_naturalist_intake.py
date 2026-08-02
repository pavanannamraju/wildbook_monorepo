#!/usr/bin/env python3
"""Upsert naturalist Google Form intake package into wildbook_v1."""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from pymongo import MongoClient, UpdateOne

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PACKAGE = ROOT / "scripts/data/naturalist_intake_guides_2026_08.json"


def _parse_extended(value: Any) -> Any:
    if isinstance(value, dict):
        if set(value.keys()) == {"$date"} and isinstance(value["$date"], str):
            raw = value["$date"].replace("Z", "+00:00")
            return datetime.fromisoformat(raw)
        return {key: _parse_extended(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_parse_extended(item) for item in value]
    return value


def _upsert(collection, docs: list[dict[str, Any]]) -> tuple[int, int]:
    if not docs:
        return 0, 0
    ops = [UpdateOne({"_id": doc["_id"]}, {"$set": doc}, upsert=True) for doc in docs]
    result = collection.bulk_write(ops, ordered=True)
    return result.upserted_count, result.modified_count


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--package",
        type=Path,
        default=DEFAULT_PACKAGE,
        help="Path to intake JSON package",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate and print counts without writing",
    )
    args = parser.parse_args()

    load_dotenv(ROOT / ".env")
    mongo_uri = os.getenv("MONGO_URI")
    db_name = os.getenv("MONGO_DATABASE_NAME", "wildbook_v1")
    if not mongo_uri:
        print("MONGO_URI is required", file=sys.stderr)
        return 1

    package = json.loads(args.package.read_text())
    order = package.get("_meta", {}).get(
        "import_order",
        [
            "reference_locations",
            "reference_focus_areas",
            "reference_expertise",
            "reference_certifications",
            "guides",
        ],
    )

    parsed: dict[str, list[dict[str, Any]]] = {}
    for key in order:
        docs = package.get(key, [])
        if not isinstance(docs, list):
            print(f"Expected list for {key}", file=sys.stderr)
            return 1
        parsed[key] = [_parse_extended(doc) for doc in docs]
        print(f"{key}: {len(parsed[key])} docs")

    if args.dry_run:
        print("Dry run only — no writes.")
        return 0

    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=10_000)
    db = client[db_name]
    for key in order:
        upserted, modified = _upsert(db[key], parsed[key])
        print(f"  {key}: upserted={upserted} modified={modified}")
    client.close()
    print(f"Imported into {db_name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
