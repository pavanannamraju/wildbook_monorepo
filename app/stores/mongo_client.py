from __future__ import annotations

from pymongo import MongoClient


def create_mongo_client(*, mongo_uri: str) -> MongoClient:
    return MongoClient(
        mongo_uri,
        serverSelectionTimeoutMS=10_000,
        connectTimeoutMS=10_000,
        socketTimeoutMS=30_000,
    )
