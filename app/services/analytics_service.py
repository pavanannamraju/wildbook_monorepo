from __future__ import annotations

import asyncio
from collections import defaultdict
from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from typing import Any

from pymongo import ReturnDocument
from pymongo.collection import Collection
from pymongo.errors import PyMongoError

from app.errors.http import ServiceUnavailableError
from app.models.analytics import (
    AnalyticsEventCreate,
    AnalyticsEventResponse,
    AnalyticsFunnelResponse,
    AnalyticsFunnelStep,
)
from app.models.auth import CurrentUserResponse
from app.services.analytics_geo import client_ip_from_headers, lookup_geo

EventMatcher = Callable[[dict[str, Any]], bool]

# Ordered funnel: visitor must hit step i before counting toward drop into i+1.
FUNNEL_STEPS: list[tuple[str, EventMatcher]] = [
    ("land_home", lambda e: e.get("event") == "page_view" and e.get("path") == "/"),
    (
        "home_engaged",
        lambda e: e.get("event") == "home_section_view"
        and (e.get("props") or {}).get("section") in {"about", "offerings", "responsible"},
    ),
    (
        "explore",
        lambda e: (e.get("event") == "page_view" and e.get("path") == "/experts")
        or e.get("event") == "home_cta_click"
        or (e.get("event") == "nav_click" and (e.get("props") or {}).get("to") == "/experts"),
    ),
    ("expert_detail", lambda e: e.get("event") == "expert_detail_view"),
    ("enquiry_focus", lambda e: e.get("event") == "expert_enquiry_focus"),
    (
        "enquiry_submit",
        lambda e: e.get("event") == "expert_enquiry_submit" and (e.get("props") or {}).get("ok") is True,
    ),
]


def _reached_steps(events: list[dict[str, Any]], *, window: timedelta) -> set[str]:
    reached: set[str] = set()
    last_ts: datetime | None = None
    step_i = 0
    for e in events:
        ts = e.get("ts")
        if not isinstance(ts, datetime):
            continue
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=UTC)
        while step_i < len(FUNNEL_STEPS):
            name, match = FUNNEL_STEPS[step_i]
            if not match(e):
                break
            if last_ts is not None and ts - last_ts > window:
                return reached
            reached.add(name)
            last_ts = ts
            step_i += 1
            if step_i >= len(FUNNEL_STEPS):
                return reached
    return reached


def compute_funnel(
    docs: list[dict[str, Any]],
    *,
    window_hours: float,
) -> list[AnalyticsFunnelStep]:
    by_anon: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for d in docs:
        anon = d.get("anonymous_id")
        if not anon:
            continue
        by_anon[str(anon)].append(d)
    for items in by_anon.values():
        items.sort(key=lambda x: x.get("ts") or datetime.min.replace(tzinfo=UTC))

    window = timedelta(hours=window_hours)
    counts = {name: 0 for name, _ in FUNNEL_STEPS}
    for items in by_anon.values():
        for name in _reached_steps(items, window=window):
            counts[name] += 1

    rows: list[AnalyticsFunnelStep] = []
    prev: int | None = None
    for name, _ in FUNNEL_STEPS:
        n = counts[name]
        drop = None if prev is None or prev == 0 else 1.0 - (n / prev)
        rows.append(AnalyticsFunnelStep(step=name, uniques=n, drop_from_prev=drop))
        prev = n
    return rows


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
        if payload.source is not None:
            doc["source"] = payload.source

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

    async def funnel(
        self,
        *,
        lookback_hours: float = 24 * 30,
        step_window_hours: float = 24,
    ) -> AnalyticsFunnelResponse:
        since = datetime.now(UTC) - timedelta(hours=lookback_hours)

        def _read() -> list[dict[str, Any]]:
            try:
                return list(
                    self._events.find(
                        {"ts": {"$gte": since}},
                        {"event": 1, "path": 1, "props": 1, "anonymous_id": 1, "ts": 1},
                    )
                )
            except PyMongoError as exc:
                raise RuntimeError(f"MongoDB analytics funnel read failed: {exc}") from exc

        try:
            docs = await asyncio.to_thread(_read)
        except RuntimeError as exc:
            raise ServiceUnavailableError(detail=str(exc)) from exc

        visitors = len({d.get("anonymous_id") for d in docs if d.get("anonymous_id")})
        return AnalyticsFunnelResponse(
            lookback_hours=lookback_hours,
            step_window_hours=step_window_hours,
            events=len(docs),
            visitors=visitors,
            steps=compute_funnel(docs, window_hours=step_window_hours),
        )
