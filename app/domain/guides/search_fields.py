from __future__ import annotations

from typing import Any


def published_offerings(offerings: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        offering
        for offering in offerings
        if offering.get("status") == "PUBLISHED" and not offering.get("is_deleted")
    ]


def build_search_text(guide: dict[str, Any], offerings: list[dict[str, Any]]) -> str:
    parts: list[str] = []
    full_name = (guide.get("full_name") or "").lower()
    if full_name:
        parts.extend([full_name, full_name, full_name])
    bio = guide.get("bio") or {}
    if isinstance(bio, dict) and bio.get("summary"):
        parts.append(str(bio["summary"]).lower())
    location = guide.get("location") or {}
    if isinstance(location, dict):
        for key in ("city", "name"):
            if location.get(key):
                parts.append(str(location[key]).lower())
    for language in guide.get("languages") or []:
        if isinstance(language, dict) and language.get("name"):
            parts.append(str(language["name"]).lower())
    for expertise in guide.get("expertise") or []:
        if isinstance(expertise, dict):
            for key in ("name", "slug"):
                if expertise.get(key):
                    parts.append(str(expertise[key]).lower())
    for offering in offerings:
        title = (offering.get("title") or "").lower()
        if title:
            parts.extend([title, title])
        description = offering.get("description") or ""
        parts.append(str(description)[:500].lower())
    deduped: list[str] = []
    seen: set[str] = set()
    for part in parts:
        token = part.strip()
        if token and token not in seen:
            seen.add(token)
            deduped.append(token)
    return " ".join(deduped)


def offering_summary(offering: dict[str, Any]) -> dict[str, Any]:
    return {
        "offering_id": offering.get("offering_id") or offering.get("_id"),
        "title": offering["title"],
        "type": offering["type"],
        "pricing": offering["pricing"],
        "duration": offering["duration"],
        "group_size": offering["group_size"],
        "rating": offering.get("rating"),
        "reviews_count": offering.get("reviews_count"),
        "image_url": offering.get("image_url"),
        "sort_order": offering.get("sort_order", 0),
    }


def from_price(offerings: list[dict[str, Any]]) -> dict[str, Any] | None:
    if not offerings:
        return None
    person = [o for o in offerings if (o.get("pricing") or {}).get("per") == "PERSON"]
    pool = person if person else offerings
    chosen = min(pool, key=lambda item: item["pricing"]["amount"])
    return {
        "amount": chosen["pricing"]["amount"],
        "currency": chosen["pricing"]["currency"],
        "per": chosen["pricing"]["per"],
    }


def compute_search_fields(
    guide: dict[str, Any],
    offerings: list[dict[str, Any]],
    *,
    hydrated_guide: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Derived search fields stored on the guide document (no separate index collection)."""
    published = sorted(
        published_offerings(offerings),
        key=lambda item: (item.get("sort_order", 0), item.get("title", "")),
    )
    source = hydrated_guide or guide
    amounts = [
        offering["pricing"]["amount"]
        for offering in published
        if isinstance(offering.get("pricing"), dict)
    ]
    ratings = [
        offering["rating"] for offering in published if offering.get("rating") is not None
    ]
    reviews = sum(int(offering.get("reviews_count") or 0) for offering in published)
    full_name = str(source.get("full_name") or guide.get("full_name") or "")
    return {
        "full_name_normalized": full_name.strip().lower(),
        "search_text": build_search_text(source, published),
        "min_price_amount": min(amounts) if amounts else None,
        "max_price_amount": max(amounts) if amounts else None,
        "currency": published[0]["pricing"]["currency"] if published else None,
        "experience_types": sorted({offering["type"] for offering in published}),
        "max_rating": max(ratings) if ratings else None,
        "total_reviews_count": reviews,
        "from_price": from_price(published),
    }
