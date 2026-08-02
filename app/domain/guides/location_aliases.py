"""Canonical city aliases for expert primary locations.

Groups alternate spellings / legacy ids (e.g. Bangalore ↔ Bengaluru) under one
canonical reference so filters and guide documents stay consistent.
"""

from __future__ import annotations


def _norm(value: str) -> str:
    return " ".join(value.split()).casefold()


# (canonical_id, display_name, alias_ids, alias_names)
_LOCATION_ALIAS_GROUPS: tuple[tuple[str, str, tuple[str, ...], tuple[str, ...]], ...] = (
    (
        "loc-bengaluru",
        "Bengaluru",
        ("loc-bengaluru", "loc-bangalore", "loc-bangalore-ka"),
        ("bengaluru", "bangalore", "bangalore, ka", "bangalore ka", "bengaluru, karnataka"),
    ),
    (
        "loc-mumbai",
        "Mumbai",
        ("loc-mumbai", "loc-bombay"),
        ("mumbai", "bombay"),
    ),
    (
        "loc-chennai",
        "Chennai",
        ("loc-chennai", "loc-madras"),
        ("chennai", "madras"),
    ),
    (
        "loc-kolkata",
        "Kolkata",
        ("loc-kolkata", "loc-calcutta"),
        ("kolkata", "calcutta"),
    ),
    (
        "loc-pune",
        "Pune",
        ("loc-pune", "loc-poona"),
        ("pune", "poona"),
    ),
    (
        "loc-hyderabad",
        "Hyderabad",
        ("loc-hyderabad", "loc-hyd"),
        ("hyderabad", "hyd"),
    ),
    (
        "loc-varanasi",
        "Varanasi",
        ("loc-varanasi", "loc-banaras", "loc-benares"),
        ("varanasi", "banaras", "benares"),
    ),
    (
        "loc-vadodara",
        "Vadodara",
        ("loc-vadodara", "loc-baroda"),
        ("vadodara", "baroda"),
    ),
    (
        "loc-thiruvananthapuram",
        "Thiruvananthapuram",
        ("loc-thiruvananthapuram", "loc-trivandrum"),
        ("thiruvananthapuram", "trivandrum"),
    ),
)

_CANONICAL_BY_ID: dict[str, str] = {}
_ALIAS_IDS_BY_CANONICAL: dict[str, tuple[str, ...]] = {}
_DISPLAY_NAME_BY_CANONICAL: dict[str, str] = {}
_CANONICAL_BY_NAME: dict[str, str] = {}

for _canonical_id, _display_name, _alias_ids, _alias_names in _LOCATION_ALIAS_GROUPS:
    _DISPLAY_NAME_BY_CANONICAL[_canonical_id] = _display_name
    _ALIAS_IDS_BY_CANONICAL[_canonical_id] = _alias_ids
    for _alias_id in _alias_ids:
        _CANONICAL_BY_ID[_alias_id] = _canonical_id
    for _alias_name in _alias_names:
        _CANONICAL_BY_NAME[_norm(_alias_name)] = _canonical_id
    _CANONICAL_BY_NAME[_norm(_display_name)] = _canonical_id


def canonicalize_location_id(location_id: str | None) -> str | None:
    if not location_id:
        return None
    return _CANONICAL_BY_ID.get(location_id, location_id)


def expand_location_filter_ids(location_id: str | None) -> list[str]:
    """Return all location ids that should match a filter selection."""
    if not location_id:
        return []
    canonical = canonicalize_location_id(location_id) or location_id
    aliases = _ALIAS_IDS_BY_CANONICAL.get(canonical)
    if aliases:
        return list(dict.fromkeys(aliases))
    return [canonical]


def canonical_location_display_name(location_id: str | None, fallback_name: str | None = None) -> str | None:
    if not location_id:
        return fallback_name
    canonical = canonicalize_location_id(location_id) or location_id
    return _DISPLAY_NAME_BY_CANONICAL.get(canonical, fallback_name)


def resolve_canonical_location_from_name(name: str) -> tuple[str, str] | None:
    """If name is a known alias, return (canonical_id, display_name)."""
    canonical = _CANONICAL_BY_NAME.get(_norm(name))
    if not canonical:
        return None
    return canonical, _DISPLAY_NAME_BY_CANONICAL[canonical]


def iter_alias_location_ids() -> list[str]:
    """Non-canonical alias ids that should be remapped / deactivated."""
    alias_ids: list[str] = []
    for canonical_id, alias_ids_for_group in _ALIAS_IDS_BY_CANONICAL.items():
        for alias_id in alias_ids_for_group:
            if alias_id != canonical_id:
                alias_ids.append(alias_id)
    return alias_ids
