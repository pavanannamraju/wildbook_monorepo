from __future__ import annotations

import asyncio
from datetime import date, datetime, time, timezone
from typing import Any

from bson import ObjectId
from pymongo.collection import Collection
from pymongo.errors import PyMongoError

from app.errors.http import BadRequestError, NotFoundError, ServiceUnavailableError
from app.models.accommodation_booking import (
    AccommodationBookingAdminUpdate,
    AccommodationBookingCreate,
    AccommodationBookingResponse,
    PriceSnapshot,
)
from app.models.enums import BookingStatus, PaymentStatus
from app.models.pagination import CursorPage, CursorParams, decode_cursor, encode_cursor


class AccommodationBookingsService:
    def __init__(
        self,
        *,
        accommodations: Collection[dict[str, Any]],
        accommodation_bookings: Collection[dict[str, Any]],
    ) -> None:
        self._accommodations = accommodations
        self._accommodation_bookings = accommodation_bookings

    async def create(self, payload: AccommodationBookingCreate) -> AccommodationBookingResponse:
        def _create() -> dict[str, Any]:
            now = datetime.now(timezone.utc)
            check_in_dt = self._date_to_utc_datetime(payload.check_in)
            check_out_dt = self._date_to_utc_datetime(payload.check_out)
            accommodation = self._accommodations.find_one(
                {"_id": ObjectId(payload.accommodation_id), "is_deleted": {"$ne": True}}
            )
            if accommodation is None:
                raise NotFoundError(detail="Accommodation not found.")

            nights = max((payload.check_out - payload.check_in).days, 0)
            if nights <= 0:
                raise BadRequestError(detail="Invalid booking dates: check_out must be after check_in.")

            base_rate = int(accommodation.get("base_rate_amount") or 0)
            subtotal = base_rate * nights * payload.adults
            tax_rate = float(accommodation.get("default_tax_rate_pct") or 0)
            taxes = int(round(subtotal * tax_rate / 100))
            total = subtotal + taxes
            snapshot = PriceSnapshot(
                rate_amount=base_rate,
                currency=str(accommodation.get("currency") or "INR"),
                nights=nights,
                subtotal_amount=subtotal,
                taxes_amount=taxes,
                total_amount=total,
            )

            overlap_query = {
                "accommodation_id": ObjectId(payload.accommodation_id),
                "status": {"$in": [BookingStatus.pending.value, BookingStatus.confirmed.value]},
                "check_in": {"$lt": check_out_dt},
                "check_out": {"$gt": check_in_dt},
            }
            if self._accommodation_bookings.find_one(overlap_query) is not None:
                raise BadRequestError(detail="Accommodation not available for selected dates.")

            doc = {
                "accommodation_id": ObjectId(payload.accommodation_id),
                "provider_ref": accommodation.get("provider_ref"),
                "check_in": check_in_dt,
                "check_out": check_out_dt,
                "adults": payload.adults,
                "customer_name": payload.customer_name.strip(),
                "customer_email": payload.customer_email.strip().lower(),
                "customer_phone": payload.customer_phone,
                "special_requests": payload.special_requests,
                "price_snapshot": snapshot.model_dump(),
                "status": BookingStatus.pending.value,
                "payment_status": PaymentStatus.offline_pending.value,
                "payment_notes": None,
                "provider_response_notes": None,
                "created_at": now,
                "updated_at": now,
                "last_status_changed_at": now,
                "schema_version": 1,
            }
            try:
                res = self._accommodation_bookings.insert_one(doc)
                created = self._accommodation_bookings.find_one({"_id": res.inserted_id})
            except PyMongoError as exc:
                raise RuntimeError(f"MongoDB insert failed: {exc}") from exc
            if created is None:
                raise RuntimeError("Accommodation booking insert succeeded but document not found.")
            return created

        try:
            doc = await asyncio.to_thread(_create)
        except RuntimeError as exc:
            raise ServiceUnavailableError(detail=str(exc)) from exc
        return self._doc_to_response(doc)

    async def get(self, *, booking_id: str) -> AccommodationBookingResponse:
        def _get() -> dict[str, Any] | None:
            try:
                return self._accommodation_bookings.find_one({"_id": ObjectId(booking_id)})
            except Exception:
                return None

        doc = await asyncio.to_thread(_get)
        if doc is None:
            raise NotFoundError(detail="Accommodation booking not found.")
        return self._doc_to_response(doc)

    async def list(
        self,
        *,
        params: CursorParams,
        accommodation_id: str | None,
        status: BookingStatus | None,
        provider_type: str | None,
        provider_id: str | None,
        customer_email: str | None = None,
    ) -> CursorPage[AccommodationBookingResponse]:
        cursor_payload = decode_cursor(params.cursor) if params.cursor else None
        query: dict[str, Any] = {}
        if accommodation_id:
            query["accommodation_id"] = self._to_object_id_or_raw(accommodation_id)
        if status:
            query["status"] = status.value
        if provider_type:
            query["provider_ref.type"] = provider_type
        if provider_id:
            query["provider_ref.id"] = self._to_object_id_or_raw(provider_id)
        if customer_email:
            query["customer_email"] = customer_email.strip().lower()

        sort = [("created_at", -1), ("_id", -1)]
        if cursor_payload is not None:
            query["$or"] = [
                {"created_at": {"$lt": cursor_payload["v"]}},
                {"created_at": cursor_payload["v"], "_id": {"$lt": ObjectId(cursor_payload["id"])}},
            ]

        def _list() -> tuple[list[dict[str, Any]], str | None]:
            try:
                docs = list(self._accommodation_bookings.find(query).sort(sort).limit(params.limit + 1))
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

    async def patch_admin(self, *, booking_id: str, patch: AccommodationBookingAdminUpdate) -> AccommodationBookingResponse:
        def _patch() -> dict[str, Any]:
            try:
                oid = ObjectId(booking_id)
            except Exception:
                raise NotFoundError(detail="Accommodation booking not found.")
            before = self._accommodation_bookings.find_one({"_id": oid})
            if before is None:
                raise NotFoundError(detail="Accommodation booking not found.")

            now = datetime.now(timezone.utc)
            patch_data = patch.model_dump(exclude_none=True)
            patch_data["updated_at"] = now
            if patch.status is not None and patch.status.value != before.get("status"):
                patch_data["last_status_changed_at"] = now
            self._accommodation_bookings.update_one({"_id": oid}, {"$set": patch_data})
            updated = self._accommodation_bookings.find_one({"_id": oid})
            if updated is None:
                raise RuntimeError("Accommodation booking vanished after update.")
            return updated

        doc = await asyncio.to_thread(_patch)
        return self._doc_to_response(doc)

    def _doc_to_response(self, doc: dict[str, Any]) -> AccommodationBookingResponse:
        payload = {**doc, "id": str(doc["_id"])}
        if payload.get("accommodation_id") is not None:
            payload["accommodation_id"] = str(payload["accommodation_id"])
        provider_ref = payload.get("provider_ref")
        if isinstance(provider_ref, dict) and provider_ref.get("id") is not None:
            provider_ref_payload = {**provider_ref}
            provider_ref_payload["id"] = str(provider_ref_payload["id"])
            payload["provider_ref"] = provider_ref_payload
        payload.pop("_id", None)
        return AccommodationBookingResponse.model_validate(payload)

    def _to_object_id_or_raw(self, value: str) -> ObjectId | str:
        try:
            return ObjectId(value)
        except Exception:
            return value

    def _date_to_utc_datetime(self, value: date) -> datetime:
        return datetime.combine(value, time.min, tzinfo=timezone.utc)
