#!/usr/bin/env python3
"""Seed reference lookup collections for wildbook_v1 (single shared Mongo DB)."""

from __future__ import annotations

import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient, UpdateOne

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")

LANGUAGES = [
    {"_id": "lang-en", "code": "en", "name": "English"},
    {"_id": "lang-hi", "code": "hi", "name": "Hindi"},
    {"_id": "lang-ta", "code": "ta", "name": "Tamil"},
    {"_id": "lang-te", "code": "te", "name": "Telugu"},
    {"_id": "lang-kn", "code": "kn", "name": "Kannada"},
    {"_id": "lang-bn", "code": "bn", "name": "Bengali"},
    {"_id": "lang-mr", "code": "mr", "name": "Marathi"},
    {"_id": "lang-ml", "code": "ml", "name": "Malayalam"},
]

EXPERTISE = [
    {"_id": "exp-birds", "slug": "birding", "name": "Birding", "category": "wildlife"},
    {"_id": "exp-wildlife", "slug": "wildlife", "name": "Wildlife", "category": "wildlife"},
    {"_id": "exp-flora", "slug": "flora", "name": "Flora", "category": "nature"},
    {"_id": "exp-trekking", "slug": "trekking", "name": "Trekking", "category": "adventure"},
    {"_id": "exp-photo", "slug": "photography", "name": "Photography", "category": "media"},
    {"_id": "exp-conservation", "slug": "conservation", "name": "Conservation", "category": "education"},
]

LOCATIONS = [
    {"_id": "loc-bengaluru", "name": "Bengaluru", "city": "Bengaluru", "state": "Karnataka", "country": "India"},
    {"_id": "loc-mumbai", "name": "Mumbai", "city": "Mumbai", "state": "Maharashtra", "country": "India"},
    {"_id": "loc-delhi", "name": "Delhi", "city": "Delhi", "state": "Delhi", "country": "India"},
    {"_id": "loc-chennai", "name": "Chennai", "city": "Chennai", "state": "Tamil Nadu", "country": "India"},
    {"_id": "loc-kolkata", "name": "Kolkata", "city": "Kolkata", "state": "West Bengal", "country": "India"},
    {"_id": "loc-hyderabad", "name": "Hyderabad", "city": "Hyderabad", "state": "Telangana", "country": "India"},
    {"_id": "loc-pune", "name": "Pune", "city": "Pune", "state": "Maharashtra", "country": "India"},
    {"_id": "loc-jaipur", "name": "Jaipur", "city": "Jaipur", "state": "Rajasthan", "country": "India"},
    {"_id": "loc-kochi", "name": "Kochi", "city": "Kochi", "state": "Kerala", "country": "India"},
    {"_id": "loc-goa", "name": "Goa", "city": "Goa", "state": "Goa", "country": "India"},
]

FOCUS_AREAS = [
    {"_id": "focus-birds", "name": "Birds"},
    {"_id": "focus-mammals", "name": "Mammals"},
    {"_id": "focus-flora", "name": "Flora"},
    {"_id": "focus-insects", "name": "Insects"},
    {"_id": "focus-wetlands", "name": "Wetlands"},
    {"_id": "focus-forests", "name": "Forests"},
]

CERTIFICATIONS = [
    {"_id": "cert-bnhs", "name": "BNHS Certified", "issuer": "BNHS"},
    {"_id": "cert-first-aid", "name": "Wildlife First Aid", "issuer": "Wildbook Academy"},
    {"_id": "cert-forest-guide", "name": "Forest Guide License", "issuer": "State Forest Dept"},
]


def _stamp(docs: list[dict]) -> list[dict]:
    now = datetime.now(timezone.utc)
    return [{**doc, "is_active": True, "created_at": now, "updated_at": now} for doc in docs]


def _upsert_many(collection, docs: list[dict]) -> None:
    ops = [UpdateOne({"_id": doc["_id"]}, {"$set": doc}, upsert=True) for doc in docs]
    if ops:
        collection.bulk_write(ops)


def main() -> int:
    mongo_uri = os.getenv("MONGO_URI")
    db_name = os.getenv("MONGO_DATABASE_NAME", "wildbook_v1")
    if not mongo_uri:
        print("MONGO_URI is required", file=sys.stderr)
        return 1

    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=10_000)
    db = client[db_name]
    _upsert_many(db["reference_languages"], _stamp(LANGUAGES))
    _upsert_many(db["reference_expertise"], _stamp(EXPERTISE))
    _upsert_many(db["reference_locations"], _stamp(LOCATIONS))
    _upsert_many(db["reference_focus_areas"], _stamp(FOCUS_AREAS))
    _upsert_many(db["reference_certifications"], _stamp(CERTIFICATIONS))
    print(f"Seeded references into {db_name}")
    client.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
