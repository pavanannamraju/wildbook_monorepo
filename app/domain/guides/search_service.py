from __future__ import annotations

import re
from typing import Any

from fastapi import status

from app.domain.guides.app_errors import AppError
from app.domain.guides.catalog_store import CatalogStore
from app.domain.guides.search_fields import offering_summary, published_offerings


def _escape_regex(value: str) -> str:
    return re.escape(value.strip())


def _reference_matches_term(doc: dict[str, Any], term: str, fields: tuple[str, ...]) -> bool:
    needle = term.casefold()
    for field in fields:
        value = doc.get(field)
        if isinstance(value, str) and needle in value.casefold():
            return True
    return False


class GuideSearchService:
    """Browse/search over the shared guides collection (no denormalized index)."""

    def __init__(self, store: CatalogStore):
        self._store = store

    def search_guides(
        self,
        *,
        q: str | None = None,
        primary_location_id: str | None = None,
        expertise_id: str | None = None,
        expertise_ids: list[str] | None = None,
        language_id: str | None = None,
        language_ids: list[str] | None = None,
        role: str | None = None,
        experience_type: str | None = None,
        min_price: int | None = None,
        max_price: int | None = None,
        min_rating: float | None = None,
        sort: str = "rating_desc",
        limit: int = 20,
        offset: int = 0,
    ) -> dict[str, Any]:
        self._validate(
            sort=sort,
            min_price=min_price,
            max_price=max_price,
            min_rating=min_rating,
        )
        mongo_filter = self._build_filter(
            q=q,
            primary_location_id=primary_location_id,
            expertise_id=expertise_id,
            expertise_ids=expertise_ids,
            language_id=language_id,
            language_ids=language_ids,
            role=role,
            experience_type=experience_type,
            min_price=min_price,
            max_price=max_price,
            min_rating=min_rating,
        )
        sort_spec = self._build_sort(sort=sort, has_q=bool(q and q.strip()))
        total = self._store.guides.count_documents(mongo_filter)
        cursor = self._store.guides.find(mongo_filter).sort(sort_spec).skip(offset).limit(limit)
        items = [self._to_card(doc, experience_type=experience_type) for doc in cursor]
        return {
            "items": items,
            "total": total,
            "limit": limit,
            "offset": offset,
            "meta": {"availability_mode": "disabled", "text_search_engine": "regex"},
        }

    def get_guide_detail(self, guide_id: str) -> dict[str, Any]:
        doc = self._store.get_guide(guide_id)
        if doc is None or doc.get("status") != "PUBLISHED" or not doc.get("is_active"):
            raise AppError(status.HTTP_404_NOT_FOUND, "GUIDE_NOT_FOUND", f"Guide {guide_id} not found")
        card = self._to_card(doc, experience_type=None, max_highlights=100)
        offerings = published_offerings(self._store.list_offerings(guide_id))
        card["offerings"] = [offering_summary({**o, "offering_id": o["_id"]}) for o in offerings]
        card["naturalist_profile"] = self._naturalist_summary(doc)
        return card

    def _validate(
        self,
        *,
        sort: str,
        min_price: int | None,
        max_price: int | None,
        min_rating: float | None = None,
    ) -> None:
        allowed = {"relevance", "rating_desc", "price_asc", "price_desc", "name_asc"}
        if sort not in allowed:
            raise AppError(status.HTTP_400_BAD_REQUEST, "INVALID_QUERY", f"Unsupported sort: {sort}")
        if min_price is not None and min_price < 0:
            raise AppError(status.HTTP_400_BAD_REQUEST, "INVALID_QUERY", "min_price must be >= 0")
        if max_price is not None and max_price < 0:
            raise AppError(status.HTTP_400_BAD_REQUEST, "INVALID_QUERY", "max_price must be >= 0")
        if min_price is not None and max_price is not None and min_price > max_price:
            raise AppError(status.HTTP_400_BAD_REQUEST, "INVALID_QUERY", "min_price must be <= max_price")
        if min_rating is not None and (min_rating < 0 or min_rating > 5):
            raise AppError(status.HTTP_400_BAD_REQUEST, "INVALID_QUERY", "min_rating must be between 0 and 5")

    @staticmethod
    def _merge_id_filters(single: str | None, many: list[str] | None) -> list[str]:
        values: list[str] = []
        seen: set[str] = set()
        for raw in [*(many or []), *([single] if single else [])]:
            cleaned = raw.strip()
            if not cleaned or cleaned in seen:
                continue
            seen.add(cleaned)
            values.append(cleaned)
        return values

    def _build_filter(
        self,
        *,
        q: str | None,
        primary_location_id: str | None,
        expertise_id: str | None,
        expertise_ids: list[str] | None,
        language_id: str | None,
        language_ids: list[str] | None,
        role: str | None,
        experience_type: str | None,
        min_price: int | None,
        max_price: int | None,
        min_rating: float | None,
    ) -> dict[str, Any]:
        mongo_filter: dict[str, Any] = {
            "is_deleted": False,
            "is_active": True,
            "status": "PUBLISHED",
        }
        if primary_location_id:
            mongo_filter["primary_location_id"] = primary_location_id
        if role:
            mongo_filter["role"] = role.upper()
        resolved_languages = self._merge_id_filters(language_id, language_ids)
        if len(resolved_languages) == 1:
            mongo_filter["language_ids"] = resolved_languages[0]
        elif resolved_languages:
            mongo_filter["language_ids"] = {"$in": resolved_languages}
        resolved_expertise = self._merge_id_filters(expertise_id, expertise_ids)
        if len(resolved_expertise) == 1:
            mongo_filter["expertise_ids"] = resolved_expertise[0]
        elif resolved_expertise:
            mongo_filter["expertise_ids"] = {"$in": resolved_expertise}
        if experience_type:
            mongo_filter["experience_types"] = experience_type.upper()
        if min_price is not None or max_price is not None:
            price: dict[str, Any] = {}
            if min_price is not None:
                price["$gte"] = min_price
            if max_price is not None:
                price["$lte"] = max_price
            mongo_filter["min_price_amount"] = price
        if min_rating is not None:
            mongo_filter["max_rating"] = {"$gte": min_rating}
        if q and q.strip():
            mongo_filter["$or"] = self._text_search_clauses(q.strip())
        return mongo_filter

    def _text_search_clauses(self, term: str) -> list[dict[str, Any]]:
        """Match only name, location, and expertise (not bios/offerings)."""
        regex = {"$regex": _escape_regex(term), "$options": "i"}
        clauses: list[dict[str, Any]] = [
            {"full_name": regex},
            {"full_name_normalized": regex},
        ]

        location_ids = [
            doc["_id"]
            for doc in self._store.list_active_references("reference_locations")
            if _reference_matches_term(doc, term, ("name", "city", "state"))
        ]
        if location_ids:
            clauses.append({"primary_location_id": {"$in": location_ids}})

        expertise_ids = [
            doc["_id"]
            for doc in self._store.list_active_references("reference_expertise")
            if _reference_matches_term(doc, term, ("name", "slug"))
        ]
        if expertise_ids:
            clauses.append({"expertise_ids": {"$in": expertise_ids}})

        return clauses

    def _build_sort(self, *, sort: str, has_q: bool) -> list[tuple[str, int]]:
        if sort == "price_asc":
            return [("min_price_amount", 1), ("_id", 1)]
        if sort == "price_desc":
            return [("max_price_amount", -1), ("_id", 1)]
        if sort == "name_asc":
            return [("full_name_normalized", 1), ("_id", 1)]
        # rating_desc / relevance default
        return [("max_rating", -1), ("total_reviews_count", -1), ("_id", 1)]

    def _to_card(
        self,
        doc: dict[str, Any],
        *,
        experience_type: str | None,
        max_highlights: int = 3,
    ) -> dict[str, Any]:
        guide_id = doc["_id"]
        location_doc = self._store.get_active_reference(
            "reference_locations", doc.get("primary_location_id", "")
        )
        language_docs = self._store.find_active_references(
            "reference_languages", doc.get("language_ids", [])
        )
        expertise_docs = self._store.find_active_references(
            "reference_expertise", doc.get("expertise_ids", [])
        )
        location = {}
        if location_doc:
            location = {
                "id": location_doc["_id"],
                "name": location_doc["name"],
                "city": location_doc["city"],
                "state": location_doc.get("state"),
                "country": location_doc.get("country"),
            }
        offerings = published_offerings(self._store.list_offerings(guide_id))
        summaries = [offering_summary({**o, "offering_id": o["_id"]}) for o in offerings]
        if experience_type:
            summaries = [o for o in summaries if o.get("type") == experience_type.upper()]
        summaries = sorted(
            summaries,
            key=lambda item: (item.get("sort_order", 0), -(item.get("rating") or 0)),
        )
        bio = doc.get("bio") if isinstance(doc.get("bio"), dict) else {}
        return {
            "guide_id": guide_id,
            "full_name": doc.get("full_name"),
            "profile_image_url": doc.get("profile_image_url"),
            "has_profile_photo": bool(doc.get("has_profile_photo")),
            "role": doc.get("role"),
            "is_naturalist": bool(doc.get("is_naturalist")),
            "location": location,
            "languages": [
                {"id": d["_id"], "code": d["code"], "name": d["name"]}
                for d in language_docs.values()
            ],
            "expertise": [
                {"id": d["_id"], "slug": d["slug"], "name": d["name"]}
                for d in expertise_docs.values()
            ],
            "bio_summary": bio.get("summary") if bio else None,
            "from_price": doc.get("from_price"),
            "max_rating": doc.get("max_rating"),
            "total_reviews_count": doc.get("total_reviews_count", 0),
            "highlight_offerings": summaries[:max_highlights],
        }

    @staticmethod
    def _naturalist_summary(doc: dict[str, Any]) -> dict[str, Any] | None:
        if doc.get("role") != "NATURALIST":
            return None
        profile = doc.get("naturalist_profile") or {}
        return {
            "years_field_experience": profile.get("years_field_experience"),
            "summary": profile.get("summary"),
        }
