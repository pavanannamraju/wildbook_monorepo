from __future__ import annotations

from datetime import datetime
from typing import Any, Literal, get_args

from pydantic import BaseModel, Field, field_validator

AnalyticsEventName = Literal[
    "page_view",
    "notify_me_submit",
    "home_cta_click",
    "home_section_view",
    "experts_role_filter",
    "experts_search",
    "experts_filter_open",
    "experts_filter_apply",
    "experts_filter_clear",
    "experts_page_change",
    "expert_card_click",
    "expert_bookmark_toggle",
    "expert_share_open",
    "expert_detail_view",
    "expert_enquiry_focus",
    "expert_enquiry_submit",
    "about_wildlife_open",
    "about_cta_experts",
    "auth_modal_open",
    "auth_google",
    "auth_email_submit",
    "auth_logout",
    "nav_click",
    "footer_nav_click",
    "footer_email_copy",
    "footer_whatsapp",
    "footer_instagram",
    "share_copy",
    "not_found_view",
]

ANALYTICS_EVENT_NAMES: frozenset[str] = frozenset(get_args(AnalyticsEventName))

_MAX_PROPS_KEYS = 24
_MAX_PROP_STRING_LEN = 200
_MAX_PROP_LIST_LEN = 20


def _sanitize_prop_value(value: object) -> str | int | bool | list[str] | None:
    if value is None or isinstance(value, bool):
        return value
    if isinstance(value, int) and not isinstance(value, bool):
        return value
    if isinstance(value, float):
        return int(value) if value.is_integer() else str(value)[:_MAX_PROP_STRING_LEN]
    if isinstance(value, str):
        return value[:_MAX_PROP_STRING_LEN]
    if isinstance(value, list):
        out: list[str] = []
        for item in value[:_MAX_PROP_LIST_LEN]:
            if item is None:
                continue
            out.append(str(item)[:_MAX_PROP_STRING_LEN])
        return out
    return str(value)[:_MAX_PROP_STRING_LEN]


class AnalyticsEventCreate(BaseModel):
    event: AnalyticsEventName
    anonymous_id: str = Field(min_length=8, max_length=80)
    session_id: str | None = Field(default=None, max_length=80)
    path: str | None = Field(default=None, max_length=500)
    source: str | None = Field(default=None, max_length=80)
    props: dict[str, Any] = Field(default_factory=dict)

    @field_validator("anonymous_id", "session_id", "path", "source", mode="before")
    @classmethod
    def _strip(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value

    @field_validator("source")
    @classmethod
    def _empty_source_none(cls, value: str | None) -> str | None:
        return value or None

    @field_validator("props")
    @classmethod
    def _sanitize_props(cls, value: dict[str, Any]) -> dict[str, str | int | bool | list[str] | None]:
        if len(value) > _MAX_PROPS_KEYS:
            raise ValueError(f"props may have at most {_MAX_PROPS_KEYS} keys")
        cleaned: dict[str, str | int | bool | list[str] | None] = {}
        for raw_key, raw_val in value.items():
            key = str(raw_key).strip()[:64]
            if not key:
                continue
            cleaned[key] = _sanitize_prop_value(raw_val)
        return cleaned


class AnalyticsGeo(BaseModel):
    country: str | None = None
    state: str | None = None
    state_iso: str | None = None
    region: str | None = None  # alias of state (kept for query compat)
    city: str | None = None


class AnalyticsEventResponse(BaseModel):
    id: str
    accepted: bool = True
    ts: datetime


class AnalyticsFunnelStep(BaseModel):
    step: str
    uniques: int
    drop_from_prev: float | None = None  # 0–1; None for first step or when prev==0


class AnalyticsFunnelResponse(BaseModel):
    lookback_hours: float
    step_window_hours: float
    events: int
    visitors: int
    steps: list[AnalyticsFunnelStep]
