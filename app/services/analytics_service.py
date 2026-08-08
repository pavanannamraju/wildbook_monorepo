from __future__ import annotations

import asyncio
from datetime import UTC, datetime
from typing import Any

from pymongo import ReturnDocument
from pymongo.collection import Collection
from pymongo.errors import PyMongoError

from app.errors.http import ServiceUnavailableError
from app.models.analytics import AnalyticsEventCreate, AnalyticsEventResponse
from app.models.auth import CurrentUserResponse
from app.services.analytics_geo import client_ip_from_headers, lookup_geo


class AnalyticsService:
    def __init__(
        self,
        *,
        events: Collection[dict[str, Any]],
        identities: Collection[dict[str, Any]],
        geoip_db_path: str | None = None,
        enabled: bool = True,
    ) -> None:
        self._events = events
        self._identities = identities
        self._geoip_db_path = geoip_db_path
        self._enabled = enabled

    async def ingest(
        self,
        *,
        payload: AnalyticsEventCreate,
        current_user: CurrentUserResponse | None,
        forwarded_for: str | None,
        client_host: str | None,
    ) -> AnalyticsEventResponse:
        now = datetime.now(UTC)
        if not self._enabled:
            return AnalyticsEventResponse(id="disabled", accepted=False, ts=now)

        ip = client_ip_from_headers(forwarded_for=forwarded_for, client_host=client_host)
        geo = lookup_geo(ip=ip, geoip_db_path=self._geoip_db_path)

        is_authenticated = current_user is not None
        user_id = current_user.id if current_user else None
        firebase_uid = current_user.uid if current_user else None

        doc: dict[str, Any] = {
            "event": payload.event,
            "anonymous_id": payload.anonymous_id,
            "session_id": payload.session_id,
            "path": payload.path,
            "props": payload.props,
            "ts": now,
            "user_id": user_id,
            "firebase_uid": firebase_uid,
            "is_authenticated": is_authenticated,
            "ip": ip,
            "geo": geo,
        }

        def _write() -> dict[str, Any]:
            try:
                result = self._events.insert_one(doc)
            except PyMongoError as exc:
                raise RuntimeError(f"MongoDB analytics insert failed: {exc}") from exc

            if is_authenticated and user_id:
                self._identities.find_one_and_update(
                    {"anonymous_id": payload.anonymous_id},
                    {
                        "$set": {
                            "user_id": user_id,
                            "firebase_uid": firebase_uid,
                            "last_seen_at": now,
                        },
                        "$setOnInsert": {
                            "anonymous_id": payload.anonymous_id,
                            "linked_at": now,
                        },
                    },
                    upsert=True,
                    return_document=ReturnDocument.AFTER,
                )

            created = self._events.find_one({"_id": result.inserted_id})
            if created is None:
                raise RuntimeError("Analytics insert succeeded but document not found.")
            return created

        try:
            created = await asyncio.to_thread(_write)
        except RuntimeError as exc:
            raise ServiceUnavailableError(detail=str(exc)) from exc

        return AnalyticsEventResponse(
            id=str(created["_id"]),
            accepted=True,
            ts=created["ts"],
        )
