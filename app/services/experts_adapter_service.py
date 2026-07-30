from __future__ import annotations

import base64
import json
from typing import Any

from app.domain.guides.local_catalog import LocalCatalog
from app.models.expert import (
    CursorPage,
    ExperienceDetail,
    ExpertBio,
    ExpertListItem,
    ExpertLocation,
    ExpertPublicDetail,
)

# Maximum guides scanned for in-memory text filtering when a query is supplied.
# The catalog list endpoint has no full-text search, so the BFF filters a window.
_TEXT_FILTER_SCAN_CAP = 100


def _expert_photo_url(expert_id: str, *, has_profile_photo: bool, media_base_url: str | None) -> str | None:
    if not has_profile_photo or not media_base_url:
        return None
    return f"{media_base_url}/api/v1/experts/{expert_id}/photo"


def _role_to_frontend(role: str) -> str:
    normalized = role.strip().upper()
    if normalized == "GUIDE":
        return "guide"
    if normalized == "NATURALIST":
        return "naturalist"
    return role.lower()


def _encode_offset_cursor(offset: int) -> str:
    payload = json.dumps({"offset": offset}, separators=(",", ":"))
    return base64.urlsafe_b64encode(payload.encode("utf-8")).decode("ascii").rstrip("=")


def _decode_offset_cursor(cursor: str) -> int:
    padding = "=" * (-len(cursor) % 4)
    raw = base64.urlsafe_b64decode(cursor + padding)
    payload = json.loads(raw.decode("utf-8"))
    if not isinstance(payload, dict) or "offset" not in payload:
        raise ValueError("Invalid cursor payload.")
    offset = payload["offset"]
    if not isinstance(offset, int) or offset < 0:
        raise ValueError("Invalid cursor offset.")
    return offset


def _ref_pair(items: Any) -> tuple[list[str], list[str]]:
    """Return (ids, names) from a list of {id, name} reference dicts."""
    if not isinstance(items, list):
        return [], []
    ids = [str(item.get("id", "")) for item in items if isinstance(item, dict)]
    names = [str(item.get("name", "")) for item in items if isinstance(item, dict)]
    return ids, names


def _guide_bio_summary(guide: dict[str, Any]) -> str | None:
    bio = guide.get("bio") if isinstance(guide.get("bio"), dict) else None
    if bio and isinstance(bio.get("summary"), str) and bio["summary"]:
        return bio["summary"]
    naturalist = guide.get("naturalist_profile") if isinstance(guide.get("naturalist_profile"), dict) else None
    if naturalist and isinstance(naturalist.get("summary"), str):
        return naturalist["summary"]
    return None


def _offering_to_detail(offering: dict[str, Any]) -> ExperienceDetail:
    pricing = offering.get("pricing") if isinstance(offering.get("pricing"), dict) else None
    duration = offering.get("duration") if isinstance(offering.get("duration"), dict) else None
    group_size = offering.get("group_size") if isinstance(offering.get("group_size"), dict) else None
    return ExperienceDetail(
        id=str(offering.get("offering_id", "")),
        title=str(offering.get("title", "")),
        description=offering.get("description") if isinstance(offering.get("description"), str) else None,
        image_url=offering.get("image_url") if isinstance(offering.get("image_url"), str) else None,
        duration=duration,
        group_size=group_size,
        pricing=pricing,
        reviews_count=offering.get("reviews_count") if isinstance(offering.get("reviews_count"), int) else None,
        rating=offering.get("rating") if isinstance(offering.get("rating"), (int, float)) else None,
    )


class ExpertsAdapterService:
    """Serves the public experts directory from the catalog service (single source of truth)."""

    def __init__(self, *, catalog_client: LocalCatalog) -> None:
        self._catalog = catalog_client

    def _guide_to_list_item(
        self,
        guide: dict[str, Any],
        *,
        bookmarked_ids: set[str] | None,
        media_base_url: str | None,
    ) -> ExpertListItem:
        guide_id = str(guide.get("guide_id", ""))
        location = guide.get("location") if isinstance(guide.get("location"), dict) else {}
        expertise_ids, expertise_names = _ref_pair(guide.get("expertise"))
        language_ids, language_names = _ref_pair(guide.get("languages"))

        return ExpertListItem(
            id=guide_id,
            slug=guide_id,
            name=str(guide.get("full_name", "")),
            bio_summary=_guide_bio_summary(guide),
            location_primary_location_id=str(location.get("id", "")) if location else None,
            location_name=str(location.get("name", "")) if location else None,
            profile_image_url=_expert_photo_url(
                guide_id,
                has_profile_photo=bool(guide.get("has_profile_photo")),
                media_base_url=media_base_url,
            ),
            source="catalog",
            roles=[_role_to_frontend(str(guide.get("role", "GUIDE")))],
            expertise_ids=expertise_ids,
            expertise_names=expertise_names,
            language_ids=language_ids,
            language_names=language_names,
            experience_snapshots=[],
            testimonial_snapshots=[],
            experience_rating_max=None,
            is_bookmarked=guide_id in bookmarked_ids if bookmarked_ids is not None else None,
        )

    @staticmethod
    def _matches_query(item: ExpertListItem, needle: str) -> bool:
        haystacks = [item.name, item.location_name or "", *item.expertise_names]
        return any(needle in value.casefold() for value in haystacks)

    async def list_experts(
        self,
        *,
        correlation_id: str | None,
        limit: int,
        cursor: str | None,
        role: str | None,
        q: str | None,
        bookmarked_ids: set[str] | None,
        media_base_url: str | None = None,
    ) -> CursorPage:
        offset = _decode_offset_cursor(cursor) if cursor else 0
        catalog_role = role.upper() if role and role not in {"all", ""} else None
        search_term = q.strip().casefold() if q and q.strip() else None

        if search_term is not None:
            return await self._list_with_text_filter(
                correlation_id=correlation_id,
                limit=limit,
                offset=offset,
                catalog_role=catalog_role,
                needle=search_term,
                bookmarked_ids=bookmarked_ids,
                media_base_url=media_base_url,
            )

        payload = await self._catalog.list_guides(
            correlation_id=correlation_id,
            status="PUBLISHED",
            is_active=True,
            role=catalog_role,
            limit=limit,
            offset=offset,
        )
        guides = payload.get("items") if isinstance(payload.get("items"), list) else []
        total = payload.get("total") if isinstance(payload.get("total"), int) else None
        items = [
            self._guide_to_list_item(g, bookmarked_ids=bookmarked_ids, media_base_url=media_base_url)
            for g in guides
            if isinstance(g, dict)
        ]

        next_offset = offset + len(items)
        if total is not None:
            next_cursor = _encode_offset_cursor(next_offset) if next_offset < total else None
        else:
            next_cursor = _encode_offset_cursor(next_offset) if len(items) == limit else None

        return CursorPage(items=items, next_cursor=next_cursor, total_count=total)

    async def _list_with_text_filter(
        self,
        *,
        correlation_id: str | None,
        limit: int,
        offset: int,
        catalog_role: str | None,
        needle: str,
        bookmarked_ids: set[str] | None,
        media_base_url: str | None,
    ) -> CursorPage:
        payload = await self._catalog.list_guides(
            correlation_id=correlation_id,
            status="PUBLISHED",
            is_active=True,
            role=catalog_role,
            limit=_TEXT_FILTER_SCAN_CAP,
            offset=0,
        )
        guides = payload.get("items") if isinstance(payload.get("items"), list) else []
        all_items = [
            self._guide_to_list_item(g, bookmarked_ids=bookmarked_ids, media_base_url=media_base_url)
            for g in guides
            if isinstance(g, dict)
        ]
        filtered = [item for item in all_items if self._matches_query(item, needle)]

        window = filtered[offset : offset + limit]
        next_offset = offset + len(window)
        next_cursor = _encode_offset_cursor(next_offset) if next_offset < len(filtered) else None
        return CursorPage(items=window, next_cursor=next_cursor, total_count=len(filtered))

    async def get_expert(
        self,
        *,
        slug_or_id: str,
        correlation_id: str | None,
        include: list[str],
        media_base_url: str | None = None,
    ) -> ExpertPublicDetail:
        guide = await self._catalog.get_guide(guide_id=slug_or_id, correlation_id=correlation_id)
        guide_id = str(guide.get("guide_id", slug_or_id))

        offerings: list[dict[str, Any]] = []
        if "experiences_full" in include:
            offerings = await self._catalog.list_offerings(
                guide_id=guide_id, correlation_id=correlation_id
            )
            offerings = [o for o in offerings if isinstance(o, dict) and o.get("status") == "PUBLISHED"]

        location = guide.get("location") if isinstance(guide.get("location"), dict) else {}
        expertise_ids, expertise_names = _ref_pair(guide.get("expertise"))
        language_ids, language_names = _ref_pair(guide.get("languages"))
        naturalist = guide.get("naturalist_profile") if isinstance(guide.get("naturalist_profile"), dict) else None
        bio_summary = _guide_bio_summary(guide)
        location_primary_id = str(location.get("id", "")) if location else None
        experience_years = guide.get("years_of_experience")
        if not isinstance(experience_years, int) and naturalist:
            experience_years = naturalist.get("years_field_experience")

        return ExpertPublicDetail(
            id=guide_id,
            slug=guide_id,
            name=str(guide.get("full_name", "")),
            roles=[_role_to_frontend(str(guide.get("role", "GUIDE")))],
            profile_image_url=_expert_photo_url(
                guide_id,
                has_profile_photo=bool(guide.get("has_profile_photo")),
                media_base_url=media_base_url,
            ),
            source="catalog",
            experience_years=experience_years if isinstance(experience_years, int) else None,
            bio=ExpertBio(summary=bio_summary) if bio_summary else None,
            location=ExpertLocation(primary_location_id=location_primary_id)
            if location_primary_id
            else None,
            location_name=str(location.get("name", "")) if location else None,
            homestay=None,
            expertise_ids=expertise_ids,
            expertise_names=expertise_names,
            language_ids=language_ids,
            language_names=language_names,
            experience_rating_max=None,
            experiences_full=[_offering_to_detail(o) for o in offerings] if "experiences_full" in include else None,
            testimonials_full=[] if "testimonials_full" in include else None,
            field_entries_full=[] if "field_entries_full" in include else None,
        )
