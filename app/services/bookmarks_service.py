from __future__ import annotations

import asyncio
from datetime import UTC, datetime
from typing import Any

from pymongo.collection import Collection
from pymongo.errors import PyMongoError

from app.errors.http import ServiceUnavailableError
from app.models.bookmark import (
    BookmarkCreateRequest,
    BookmarkResponse,
    BookmarkStatusResponse,
    BookmarkType,
)


def _utcnow() -> datetime:
    return datetime.now(UTC)


class BookmarksService:
    def __init__(self, *, bookmarks: Collection[dict[str, Any]]) -> None:
        self._bookmarks = bookmarks

    async def create_or_update(
        self,
        *,
        user_id: str,
        payload: BookmarkCreateRequest,
    ) -> BookmarkResponse:
        now = _utcnow()

        def _upsert() -> dict[str, Any]:
            query = {"user_id": user_id, "type": payload.type.value, "target_id": payload.target_id}
            try:
                self._bookmarks.update_one(
                    query,
                    {"$set": {"updated_at": now}, "$setOnInsert": {"created_at": now}},
                    upsert=True,
                )
                doc = self._bookmarks.find_one(query)
            except PyMongoError as exc:
                raise RuntimeError(f"MongoDB upsert failed: {exc}") from exc
            if doc is None:
                raise RuntimeError("Bookmark upsert succeeded but document not found.")
            return doc

        try:
            doc = await asyncio.to_thread(_upsert)
        except RuntimeError as exc:
            raise ServiceUnavailableError(detail=str(exc)) from exc
        return self._serialize(doc)

    async def delete(self, *, user_id: str, bookmark_type: BookmarkType, target_id: str) -> None:
        def _delete() -> None:
            try:
                self._bookmarks.delete_one(
                    {"user_id": user_id, "type": bookmark_type.value, "target_id": target_id}
                )
            except PyMongoError as exc:
                raise RuntimeError(f"MongoDB delete failed: {exc}") from exc

        try:
            await asyncio.to_thread(_delete)
        except RuntimeError as exc:
            raise ServiceUnavailableError(detail=str(exc)) from exc

    async def list(self, *, user_id: str, bookmark_type: BookmarkType) -> list[BookmarkResponse]:
        def _list() -> list[dict[str, Any]]:
            try:
                return list(
                    self._bookmarks.find({"user_id": user_id, "type": bookmark_type.value}).sort("created_at", -1)
                )
            except PyMongoError as exc:
                raise RuntimeError(f"MongoDB list failed: {exc}") from exc

        try:
            docs = await asyncio.to_thread(_list)
        except RuntimeError as exc:
            raise ServiceUnavailableError(detail=str(exc)) from exc
        return [self._serialize(doc) for doc in docs]

    async def status(
        self,
        *,
        user_id: str,
        bookmark_type: BookmarkType,
        target_ids: list[str],
    ) -> BookmarkStatusResponse:
        if not target_ids:
            return BookmarkStatusResponse(type=bookmark_type, bookmarked_target_ids=[])

        unique_target_ids = list(dict.fromkeys(target_ids))

        def _status() -> list[str]:
            try:
                cursor = self._bookmarks.find(
                    {
                        "user_id": user_id,
                        "type": bookmark_type.value,
                        "target_id": {"$in": unique_target_ids},
                    },
                    {"target_id": 1},
                )
                return [str(item["target_id"]) for item in cursor if isinstance(item.get("target_id"), str)]
            except PyMongoError as exc:
                raise RuntimeError(f"MongoDB status query failed: {exc}") from exc

        try:
            bookmarked = await asyncio.to_thread(_status)
        except RuntimeError as exc:
            raise ServiceUnavailableError(detail=str(exc)) from exc
        return BookmarkStatusResponse(type=bookmark_type, bookmarked_target_ids=bookmarked)

    def _serialize(self, doc: dict[str, Any]) -> BookmarkResponse:
        return BookmarkResponse(
            id=str(doc["_id"]),
            user_id=str(doc["user_id"]),
            type=BookmarkType(str(doc["type"])),
            target_id=str(doc["target_id"]),
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
        )
