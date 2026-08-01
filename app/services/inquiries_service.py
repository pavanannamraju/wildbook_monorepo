from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from pymongo.collection import Collection
from pymongo.errors import PyMongoError

from app.domain.guides.local_search import LocalSearch
from app.errors.http import NotFoundError, ServiceUnavailableError
from app.models.enums import InquiryDatesPreference, InquiryStatus
from app.models.inquiry import InquiryAdminUpdate, InquiryCreate, InquiryResponse
from app.models.pagination import CursorPage, CursorParams, decode_cursor, encode_cursor


class InquiriesService:
    def __init__(
        self,
        *,
        inquiries: Collection[dict[str, Any]],
        search_client: LocalSearch,
    ) -> None:
        self._inquiries = inquiries
        self._search = search_client

    async def create(
        self,
        payload: InquiryCreate,
        *,
        correlation_id: str | None,
    ) -> InquiryResponse:
        expert_id = payload.expert_id.strip()
        try:
            await self._search.get_guide(guide_id=expert_id, correlation_id=correlation_id)
        except NotFoundError as exc:
            raise NotFoundError(detail="Expert not found for inquiry.") from exc

        def _create() -> dict[str, Any]:
            now = datetime.now(timezone.utc)
            doc = payload.model_dump(exclude_none=True)
            doc["expert_id"] = expert_id
            doc["customer_email"] = payload.customer_email.strip().lower()
            doc["dates_preference"] = payload.dates_preference.value
            if payload.dates_preference == InquiryDatesPreference.fixed:
                assert payload.travel_start_date is not None
                assert payload.travel_end_date is not None
                doc["travel_start_date"] = payload.travel_start_date.isoformat()
                doc["travel_end_date"] = payload.travel_end_date.isoformat()
                doc["travel_dates"] = (
                    f"{payload.travel_start_date.isoformat()} to {payload.travel_end_date.isoformat()}"
                )
            else:
                doc.pop("travel_start_date", None)
                doc.pop("travel_end_date", None)
                doc["travel_dates"] = None
            doc.update(
                {
                    "status": InquiryStatus.new.value,
                    "priority": "medium",
                    "created_at": now,
                    "updated_at": now,
                    "last_status_changed_at": now,
                }
            )

            try:
                res = self._inquiries.insert_one(doc)
                created = self._inquiries.find_one({"_id": res.inserted_id})
            except PyMongoError as exc:
                raise RuntimeError(f"MongoDB insert failed: {exc}") from exc

            if created is None:
                raise RuntimeError("Inquiry insert succeeded but document not found.")
            return created

        try:
            doc = await asyncio.to_thread(_create)
        except RuntimeError as exc:
            raise ServiceUnavailableError(detail=str(exc)) from exc
        return self._doc_to_response(doc)

    async def get(self, *, inquiry_id: str) -> InquiryResponse:
        def _get() -> dict[str, Any] | None:
            try:
                return self._inquiries.find_one({"_id": ObjectId(inquiry_id)})
            except Exception:
                return None

        doc = await asyncio.to_thread(_get)
        if doc is None:
            raise NotFoundError(detail="Inquiry not found.")
        return self._doc_to_response(doc)

    async def list(
        self,
        *,
        params: CursorParams,
        expert_id: str | None,
        status: InquiryStatus | None,
        email: str | None,
    ) -> CursorPage[InquiryResponse]:
        cursor_payload = decode_cursor(params.cursor) if params.cursor else None
        query: dict[str, Any] = {}
        if expert_id:
            query["expert_id"] = expert_id
        if status:
            query["status"] = status.value
        if email:
            query["customer_email"] = email.strip().lower()

        sort = [("created_at", -1), ("_id", -1)]
        if cursor_payload is not None:
            query["$or"] = [
                {"created_at": {"$lt": cursor_payload["v"]}},
                {"created_at": cursor_payload["v"], "_id": {"$lt": ObjectId(cursor_payload["id"])}},
            ]

        def _list() -> tuple[list[dict[str, Any]], str | None]:
            try:
                docs = list(self._inquiries.find(query).sort(sort).limit(params.limit + 1))
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

        return CursorPage(items=[self._doc_to_response(d) for d in docs], next_cursor=next_cur)

    async def patch_admin(self, *, inquiry_id: str, patch: InquiryAdminUpdate) -> InquiryResponse:
        def _patch() -> dict[str, Any]:
            try:
                oid = ObjectId(inquiry_id)
            except Exception:
                raise NotFoundError(detail="Inquiry not found.")

            before = self._inquiries.find_one({"_id": oid})
            if before is None:
                raise NotFoundError(detail="Inquiry not found.")

            now = datetime.now(timezone.utc)
            patch_data = patch.model_dump(exclude_none=True)
            patch_data["updated_at"] = now
            if patch.status is not None and patch.status.value != before.get("status"):
                patch_data["last_status_changed_at"] = now

            self._inquiries.update_one({"_id": oid}, {"$set": patch_data})
            updated = self._inquiries.find_one({"_id": oid})
            if updated is None:
                raise RuntimeError("Inquiry vanished after update.")
            return updated

        doc = await asyncio.to_thread(_patch)
        return self._doc_to_response(doc)

    def _doc_to_response(self, doc: dict[str, Any]) -> InquiryResponse:
        payload = {**doc, "id": str(doc["_id"])}
        payload.pop("_id", None)
        if payload.get("dates_preference") is None and payload.get("travel_dates"):
            payload["dates_preference"] = InquiryDatesPreference.fixed.value
        return InquiryResponse.model_validate(payload)
