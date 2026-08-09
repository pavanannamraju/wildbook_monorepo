from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest
from pydantic import ValidationError

from app.models.analytics import AnalyticsEventCreate
from app.services.analytics_geo import client_ip_from_headers, is_public_ip, lookup_geo
from app.services.analytics_service import compute_funnel


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


def test_analytics_event_source_optional() -> None:
    with_source = AnalyticsEventCreate(
        event="page_view",
        anonymous_id="abcd1234",
        source="facebook",
    )
    assert with_source.source == "facebook"
    blank = AnalyticsEventCreate(event="page_view", anonymous_id="abcd1234", source="  ")
    assert blank.source is None


def test_compute_funnel_ordered_drop() -> None:
    base = datetime(2026, 1, 1, tzinfo=UTC)
    docs = [
        {"anonymous_id": "a", "ts": base, "event": "page_view", "path": "/", "props": {}},
        {
            "anonymous_id": "a",
            "ts": base + timedelta(minutes=1),
            "event": "home_section_view",
            "props": {"section": "about"},
        },
        {
            "anonymous_id": "a",
            "ts": base + timedelta(minutes=2),
            "event": "page_view",
            "path": "/experts",
            "props": {},
        },
        {
            "anonymous_id": "a",
            "ts": base + timedelta(minutes=3),
            "event": "expert_detail_view",
            "props": {},
        },
        {"anonymous_id": "b", "ts": base, "event": "page_view", "path": "/", "props": {}},
        {
            "anonymous_id": "b",
            "ts": base + timedelta(minutes=1),
            "event": "home_section_view",
            "props": {"section": "hero"},
        },
    ]
    rows = {s.step: s for s in compute_funnel(docs, window_hours=24)}
    assert rows["land_home"].uniques == 2
    assert rows["home_engaged"].uniques == 1
    assert rows["explore"].uniques == 1
    assert rows["expert_detail"].uniques == 1
    assert rows["enquiry_focus"].uniques == 0
    assert rows["explore"].drop_from_prev == 0.0
    assert abs((rows["home_engaged"].drop_from_prev or 0) - 0.5) < 1e-9
