from __future__ import annotations

import asyncio
from datetime import UTC, datetime
from typing import Any

from bson import ObjectId
from pymongo.collection import Collection
from pymongo.errors import DuplicateKeyError, PyMongoError

from app.errors.http import ServiceUnavailableError
from app.models.feature_notify import FeatureNotifyCreate, FeatureNotifyListItem, FeatureNotifyResponse
from app.models.pagination import CursorPage, CursorParams, decode_cursor, encode_cursor


class FeatureNotifyService:
    def __init__(self, *, notifications: Collection[dict[str, Any]]) -> None:
        self._notifications = notifications

    async def subscribe(self, payload: FeatureNotifyCreate) -> FeatureNotifyResponse:
        email = payload.email.strip().lower()
        feature = payload.feature.strip()

        def _upsert() -> tuple[dict[str, Any], bool]:
            now = datetime.now(UTC)
            existing = self._notifications.find_one({"email": email, "feature": feature})
            if existing is not None:
                return existing, True

            doc = {
                "email": email,
                "feature": feature,
                "created_at": now,
                "updated_at": now,
            }
            try:
                result = self._notifications.insert_one(doc)
            except DuplicateKeyError:
                existing_after_race = self._notifications.find_one({"email": email, "feature": feature})
                if existing_after_race is None:
                    raise RuntimeError("Duplicate key raised but document was not found.")
                return existing_after_race, True
            except PyMongoError as exc:
                raise RuntimeError(f"MongoDB insert failed: {exc}") from exc

            created = self._notifications.find_one({"_id": result.inserted_id})
            if created is None:
                raise RuntimeError("Notify insert succeeded but document not found.")
            return created, False

        try:
            doc, already_subscribed = await asyncio.to_thread(_upsert)
        except RuntimeError as exc:
            raise ServiceUnavailableError(detail=str(exc)) from exc

        return FeatureNotifyResponse(
            id=str(doc["_id"]),
            email=str(doc["email"]),
            feature=str(doc["feature"]),
            created_at=doc["created_at"],
            already_subscribed=already_subscribed,
        )

    async def list(
        self,
        *,
        params: CursorParams,
        feature: str | None = None,
        email: str | None = None,
    ) -> CursorPage[FeatureNotifyListItem]:
        cursor_payload = decode_cursor(params.cursor) if params.cursor else None
        query: dict[str, Any] = {}
        if feature:
            query["feature"] = feature.strip()
        if email:
            query["email"] = email.strip().lower()

        sort = [("created_at", -1), ("_id", -1)]
        if cursor_payload is not None:
            query["$or"] = [
                {"created_at": {"$lt": cursor_payload["v"]}},
                {"created_at": cursor_payload["v"], "_id": {"$lt": ObjectId(cursor_payload["id"])}},
            ]

        def _list() -> tuple[list[dict[str, Any]], str | None]:
            try:
                docs = list(self._notifications.find(query).sort(sort).limit(params.limit + 1))
            except PyMongoError as exc:
                raise RuntimeError(f"MongoDB query failed: {exc}") from exc

            next_cur: str | None = None
            if len(docs) > params.limit:
                last = docs[params.limit - 1]
                next_cur = encode_cursor(sort_value=last.get("created_at"), id_value=str(last["_id"]))
                docs = docs[: params.limit]
            return docs, next_cur

        try:
            docs, next_cur = await asyncio.to_thread(_list)
        except RuntimeError as exc:
            raise ServiceUnavailableError(detail=str(exc)) from exc

        items = [
            FeatureNotifyListItem(
                id=str(doc["_id"]),
                email=str(doc["email"]),
                feature=str(doc["feature"]),
                created_at=doc.get("created_at"),
            )
            for doc in docs
        ]
        return CursorPage(items=items, next_cursor=next_cur)
