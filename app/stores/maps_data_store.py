from __future__ import annotations

import asyncio
from typing import Protocol

from pymongo.collection import Collection
from pymongo.errors import PyMongoError


class MapsDataStore(Protocol):
    async def list_documents(self) -> list[dict[str, object]]: ...


class MongoMapsDataStore:
    def __init__(self, *, collection: Collection[dict[str, object]]) -> None:
        self._collection = collection

    async def list_documents(self) -> list[dict[str, object]]:
        def _read_all() -> list[dict[str, object]]:
            try:
                return list(self._collection.find({}))
            except PyMongoError as exc:
                raise RuntimeError(f"MongoDB query failed: {exc}") from exc

        return await asyncio.to_thread(_read_all)

