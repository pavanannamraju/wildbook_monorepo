from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from pymongo.collection import Collection
from pymongo.errors import PyMongoError

from app.errors.http import NotFoundError, ServiceUnavailableError
from app.models.accommodation import (
    AccommodationCreate,
    AccommodationListItem,
    AccommodationResponse,
    AccommodationUpdate,
)
from app.models.pagination import CursorPage, CursorParams, decode_cursor, encode_cursor


class AccommodationsService:
    def __init__(
        self,
        *,
        accommodations: Collection[dict[str, Any]],
    ) -> None:
        self._accommodations = accommodations

    async def create(self, payload: AccommodationCreate) -> AccommodationResponse:
        now = datetime.now(timezone.utc)
        doc = payload.model_dump(exclude_none=True)
        self._coerce_foreign_keys_for_storage(doc)
        doc.update({"created_at": now, "updated_at": now, "schema_version": 1})

        def _create() -> dict[str, Any]:
            try:
                res = self._accommodations.insert_one(doc)
                created = self._accommodations.find_one({"_id": res.inserted_id})
            except PyMongoError as exc:
                raise RuntimeError(f"MongoDB insert failed: {exc}") from exc
            if created is None:
                raise RuntimeError("Accommodation insert succeeded but document not found.")
            return created

        try:
            created = await asyncio.to_thread(_create)
        except RuntimeError as exc:
            raise ServiceUnavailableError(detail=str(exc)) from exc
        return self._doc_to_response(created)

    async def get(self, *, slug_or_id: str) -> AccommodationResponse:
        def _get() -> dict[str, Any] | None:
            base_deleted_filter: dict[str, Any] = {"is_deleted": {"$ne": True}}
            try:
                by_id_query: dict[str, Any] = {"_id": ObjectId(slug_or_id), **base_deleted_filter}
                doc = self._accommodations.find_one(by_id_query)
                if doc is not None:
                    return doc
            except Exception:
                pass

            by_slug_query = {"slug": slug_or_id, **base_deleted_filter}
            doc = self._accommodations.find_one(by_slug_query)
            if doc is not None:
                return doc

            # Fallback for expert-driven navigation: lookup accommodation by expert_id.
            return self._accommodations.find_one(
                {"expert_id": self._to_object_id_or_raw(slug_or_id), **base_deleted_filter}
            )

        doc = await asyncio.to_thread(_get)
        if doc is None:
            raise NotFoundError(detail="Accommodation not found.")
        return self._doc_to_response(doc)

    async def list(
        self,
        *,
        params: CursorParams,
        status: str | None,
        location_id: str | None,
        provider_type: str | None,
        provider_id: str | None,
        q: str | None,
    ) -> CursorPage[AccommodationListItem]:
        cursor_payload = decode_cursor(params.cursor) if params.cursor else None
        base_query: dict[str, Any] = {"is_deleted": {"$ne": True}}
        if status is not None:
            base_query["status"] = status
            base_query["is_active"] = True
        if location_id is not None:
            base_query["primary_location_id"] = location_id
        if provider_type is not None:
            base_query["provider_ref.type"] = provider_type
        if provider_id is not None:
            base_query["provider_ref.id"] = self._to_object_id_or_raw(provider_id)
        if q and q.strip():
            base_query["$or"] = [
                {"name": {"$regex": q.strip(), "$options": "i"}},
                {"about": {"$regex": q.strip(), "$options": "i"}},
            ]

        query = dict(base_query)
        sort = [("rating_avg", -1), ("_id", 1)]
        if cursor_payload is not None:
            query["$or"] = [
                {"rating_avg": {"$lt": cursor_payload["v"]}},
                {"rating_avg": cursor_payload["v"], "_id": {"$gt": ObjectId(cursor_payload["id"])}},
            ]

        def _list() -> tuple[list[dict[str, Any]], str | None]:
            try:
                docs = list(self._accommodations.find(query).sort(sort).limit(params.limit + 1))
            except PyMongoError as exc:
                raise RuntimeError(f"MongoDB query failed: {exc}") from exc
            next_cur: str | None = None
            if len(docs) > params.limit:
                last = docs[params.limit - 1]
                next_cur = encode_cursor(sort_value=last.get("rating_avg"), id_value=str(last["_id"]))
                docs = docs[: params.limit]
            return docs, next_cur

        try:
            docs, next_cur = await asyncio.to_thread(_list)
        except RuntimeError as exc:
            raise ServiceUnavailableError(detail=str(exc)) from exc
        return CursorPage(items=[self._doc_to_list_item(d) for d in docs], next_cursor=next_cur)

    async def patch(self, *, accommodation_id: str, patch: AccommodationUpdate) -> AccommodationResponse:
        now = datetime.now(timezone.utc)
        patch_data = patch.model_dump(exclude_none=True)
        self._coerce_foreign_keys_for_storage(patch_data)
        update_doc = {"$set": {**patch_data, "updated_at": now}}

        def _patch() -> dict[str, Any] | None:
            try:
                oid = ObjectId(accommodation_id)
            except Exception:
                return None
            self._accommodations.update_one({"_id": oid, "is_deleted": {"$ne": True}}, update_doc)
            return self._accommodations.find_one({"_id": oid})

        doc = await asyncio.to_thread(_patch)
        if doc is None:
            raise NotFoundError(detail="Accommodation not found.")
        return self._doc_to_response(doc)

    async def delete(self, *, accommodation_id: str) -> None:
        now = datetime.now(timezone.utc)

        def _delete() -> bool:
            try:
                oid = ObjectId(accommodation_id)
            except Exception:
                return False
            result = self._accommodations.update_one(
                {"_id": oid},
                {"$set": {"is_deleted": True, "is_active": False, "status": "archived", "updated_at": now}},
            )
            return result.modified_count > 0

        ok = await asyncio.to_thread(_delete)
        if not ok:
            raise NotFoundError(detail="Accommodation not found.")

    def _doc_to_response(self, doc: dict[str, Any]) -> AccommodationResponse:
        payload = self._normalize_doc_for_api(doc)
        payload["id"] = str(doc["_id"])
        payload.pop("_id", None)
        return AccommodationResponse.model_validate(payload)

    def _doc_to_list_item(self, doc: dict[str, Any]) -> AccommodationListItem:
        payload = self._normalize_doc_for_api(doc)
        payload["id"] = str(doc["_id"])
        payload.pop("_id", None)
        return AccommodationListItem.model_validate(payload)

    def _to_object_id_or_raw(self, value: str) -> ObjectId | str:
        try:
            return ObjectId(value)
        except Exception:
            return value

    def _coerce_foreign_keys_for_storage(self, payload: dict[str, Any]) -> None:
        provider_ref = payload.get("provider_ref")
        if isinstance(provider_ref, dict) and isinstance(provider_ref.get("id"), str):
            provider_ref["id"] = self._to_object_id_or_raw(provider_ref["id"])
            payload["provider_ref"] = provider_ref
        expert_id = payload.get("expert_id")
        if isinstance(expert_id, str):
            payload["expert_id"] = self._to_object_id_or_raw(expert_id)

    def _normalize_doc_for_api(self, doc: dict[str, Any]) -> dict[str, Any]:
        payload = {**doc}
        provider_ref = payload.get("provider_ref")
        if isinstance(provider_ref, dict):
            provider_ref_payload = {**provider_ref}
            if provider_ref_payload.get("id") is not None:
                provider_ref_payload["id"] = str(provider_ref_payload["id"])
            payload["provider_ref"] = provider_ref_payload
        if payload.get("expert_id") is not None:
            payload["expert_id"] = str(payload["expert_id"])
        return payload
