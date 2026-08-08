from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.models.analytics import AnalyticsEventCreate
from app.services.analytics_geo import client_ip_from_headers, is_public_ip, lookup_geo


def test_client_ip_prefers_forwarded_for() -> None:
    assert (
        client_ip_from_headers(forwarded_for="203.0.113.10, 10.0.0.1", client_host="127.0.0.1")
        == "203.0.113.10"
    )


def test_public_ip_checks() -> None:
    assert is_public_ip("8.8.8.8")
    assert not is_public_ip("127.0.0.1")
    assert not is_public_ip("10.0.0.5")


def test_lookup_geo_skips_private_and_missing_db() -> None:
    assert lookup_geo(ip="127.0.0.1", geoip_db_path="/tmp/missing.mmdb") is None
    assert lookup_geo(ip="8.8.8.8", geoip_db_path=None) is None


def test_analytics_event_allowlist() -> None:
    ok = AnalyticsEventCreate(event="page_view", anonymous_id="abcd1234")
    assert ok.event == "page_view"
    with pytest.raises(ValidationError):
        AnalyticsEventCreate(event="not_a_real_event", anonymous_id="abcd1234")  # type: ignore[arg-type]
