from __future__ import annotations

import base64
import json
from typing import Any

from app.domain.guides.local_catalog import LocalCatalog
from app.domain.guides.local_search import LocalSearch
from app.models.expert import (
    CursorPage,
    ExperienceDetail,
    ExperienceSnapshot,
    ExpertBio,
    ExpertFilterOption,
    ExpertFilterOptions,
    ExpertListItem,
    ExpertLocation,
    ExpertPublicDetail,
)


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
    if isinstance(guide.get("bio_summary"), str) and guide["bio_summary"]:
        return guide["bio_summary"]
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


def _as_filter_options(items: Any) -> list[ExpertFilterOption]:
    if not isinstance(items, list):
        return []
    options: list[ExpertFilterOption] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        option_id = item.get("id")
        name = item.get("name")
        if isinstance(option_id, str) and option_id and isinstance(name, str) and name:
            options.append(ExpertFilterOption(id=option_id, name=name))
    return options


class ExpertsAdapterService:
    """Serves the public experts directory from catalog + search (single source of truth)."""

    def __init__(self, *, catalog_client: LocalCatalog, search_client: LocalSearch) -> None:
        self._catalog = catalog_client
        self._search = search_client

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
        max_rating = guide.get("max_rating")
        total_reviews = guide.get("total_reviews_count")
        review_snapshots: list[ExperienceSnapshot] = []
        if isinstance(total_reviews, int) and total_reviews > 0:
            review_snapshots = [
                ExperienceSnapshot(
                    id="aggregate",
                    title="Reviews",
                    type="summary",
                    rating=max_rating if isinstance(max_rating, (int, float)) else None,
                    reviews_count=total_reviews,
                )
            ]

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
            experience_snapshots=review_snapshots,
            testimonial_snapshots=[],
            experience_rating_max=max_rating if isinstance(max_rating, (int, float)) else None,
            is_bookmarked=guide_id in bookmarked_ids if bookmarked_ids is not None else None,
        )

    async def list_experts(
        self,
        *,
        correlation_id: str | None,
        limit: int,
        cursor: str | None,
        role: str | None,
        q: str | None,
        primary_location_id: str | None = None,
        language_ids: list[str] | None = None,
        expertise_ids: list[str] | None = None,
        min_rating: float | None = None,
        bookmarked_ids: set[str] | None,
        media_base_url: str | None = None,
    ) -> CursorPage:
        offset = _decode_offset_cursor(cursor) if cursor else 0
        catalog_role = role.upper() if role and role not in {"all", ""} else None
        search_term = q.strip() if q and q.strip() else None

        payload = await self._search.search_guides(
            q=search_term,
            primary_location_id=primary_location_id,
            language_ids=language_ids,
            expertise_ids=expertise_ids,
            role=catalog_role,
            min_rating=min_rating,
            sort="rating_desc",
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

    async def get_filter_options(self, *, correlation_id: str | None) -> ExpertFilterOptions:
        references = await self._catalog.list_published_filter_options(correlation_id=correlation_id)
        return ExpertFilterOptions(
            locations=_as_filter_options(references.get("locations")),
            languages=_as_filter_options(references.get("languages")),
            expertise=_as_filter_options(references.get("expertise")),
        )

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

        offering_ratings = [
            o.get("rating") for o in offerings if isinstance(o.get("rating"), (int, float))
        ]
        max_rating = max(offering_ratings) if offering_ratings else None

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
            experience_rating_max=max_rating if isinstance(max_rating, (int, float)) else None,
            experiences_full=[_offering_to_detail(o) for o in offerings] if "experiences_full" in include else None,
            testimonials_full=[] if "testimonials_full" in include else None,
            field_entries_full=[] if "field_entries_full" in include else None,
        )
