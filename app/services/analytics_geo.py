from __future__ import annotations

import ipaddress
import logging
from functools import lru_cache
from typing import Any

logger = logging.getLogger("wildbook_v1.analytics.geo")


def client_ip_from_headers(*, forwarded_for: str | None, client_host: str | None) -> str | None:
    """Prefer first hop in X-Forwarded-For; fall back to direct client host."""
    if forwarded_for:
        for part in forwarded_for.split(","):
            candidate = part.strip()
            if candidate:
                return candidate
    if client_host:
        return client_host.strip() or None
    return None


def is_public_ip(ip: str) -> bool:
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return False
    return not (
        addr.is_private
        or addr.is_loopback
        or addr.is_link_local
        or addr.is_reserved
        or addr.is_multicast
    )


@lru_cache(maxsize=1)
def _load_reader(db_path: str) -> Any | None:
    try:
        import geoip2.database
    except ImportError:
        logger.warning("geoip2 is not installed; analytics geo will be null")
        return None
    try:
        return geoip2.database.Reader(db_path)
    except Exception as exc:
        logger.warning("Failed to open GeoIP DB at %s: %s", db_path, exc)
        return None


def lookup_geo(*, ip: str | None, geoip_db_path: str | None) -> dict[str, str | None] | None:
    """Resolve rough location from IP. For India, `state` is the key analytics field."""
    if not ip or not geoip_db_path or not is_public_ip(ip):
        return None
    reader = _load_reader(geoip_db_path)
    if reader is None:
        return None
    try:
        result = reader.city(ip)
    except Exception:
        return None

    country = result.country.iso_code if result.country else None
    state = None
    state_iso = None
    if result.subdivisions:
        # most_specific is usually the state/province (e.g. Karnataka / KA)
        sub = result.subdivisions.most_specific
        state = sub.name or sub.iso_code
        state_iso = sub.iso_code
    city = result.city.name if result.city else None
    if not country and not state and not city:
        return None
    return {
        "country": country,
        "state": state,
        "state_iso": state_iso,
        # region kept as alias of state for older queries / plan wording
        "region": state,
        "city": city,
    }
