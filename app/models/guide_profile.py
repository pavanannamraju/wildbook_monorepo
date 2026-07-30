from __future__ import annotations

import base64
import binascii
from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

ALLOWED_PROFILE_PHOTO_CONTENT_TYPES: frozenset[str] = frozenset(
    {"image/jpeg", "image/png", "image/webp"}
)
MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024

# Suggested chips shown in the tag selectors. These are hints only: a guide may
# type any value, and unknown names are turned into real catalog references on
# submit (dedupe by normalized name).
LANGUAGE_PRESETS: tuple[str, ...] = (
    "English",
    "Hindi",
    "Tamil",
    "Telugu",
    "Kannada",
    "Bengali",
    "Marathi",
)

SPECIALIZATION_PRESETS: tuple[str, ...] = (
    "Birding",
    "Herping",
    "Mammals",
    "Botany",
    "Entomology",
    "Photography",
    "Trekking",
    "Night Safari",
    "Marine Life",
    "Big Cats",
)


class GuideRole(StrEnum):
    GUIDE = "GUIDE"
    NATURALIST = "NATURALIST"


class ReferenceItem(BaseModel):
    id: str
    name: str
    description: str | None = None


class GuideProfileOptionsResponse(BaseModel):
    roles: list[str] = [GuideRole.GUIDE, GuideRole.NATURALIST]
    language_presets: list[str] = list(LANGUAGE_PRESETS)
    specialization_presets: list[str] = list(SPECIALIZATION_PRESETS)
    focus_areas: list[ReferenceItem] = Field(default_factory=list)
    certifications: list[ReferenceItem] = Field(default_factory=list)
    max_profile_photo_bytes: int = MAX_PROFILE_PHOTO_BYTES
    allowed_profile_photo_content_types: list[str] = sorted(ALLOWED_PROFILE_PHOTO_CONTENT_TYPES)


def _normalize_name_list(value: object) -> object:
    if not isinstance(value, list):
        return value
    seen: set[str] = set()
    result: list[str] = []
    for item in value:
        if not isinstance(item, str):
            continue
        cleaned = " ".join(item.split())
        if not cleaned:
            continue
        key = cleaned.casefold()
        if key in seen:
            continue
        seen.add(key)
        result.append(cleaned)
    return result


def _dedupe_id_list(value: object) -> object:
    if not isinstance(value, list):
        return value
    seen: set[str] = set()
    result: list[str] = []
    for item in value:
        if not isinstance(item, str):
            continue
        cleaned = item.strip()
        if not cleaned or cleaned in seen:
            continue
        seen.add(cleaned)
        result.append(cleaned)
    return result


class NaturalistProfileInput(BaseModel):
    focus_area_ids: list[str] = Field(min_length=1, max_length=30)
    certification_ids: list[str] = Field(default_factory=list, max_length=30)
    summary: str | None = Field(default=None, max_length=2000)

    @field_validator("summary", mode="before")
    @classmethod
    def _strip_summary(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip() or None
        return value

    @field_validator("focus_area_ids", "certification_ids", mode="before")
    @classmethod
    def _dedupe_ids(cls, value: object) -> object:
        return _dedupe_id_list(value)


class GuideProfileCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    role: GuideRole
    base_location: str = Field(min_length=1, max_length=120)
    years_of_experience: int = Field(default=0, ge=0, le=80)
    bio: str | None = Field(default=None, max_length=5_000)
    languages: list[str] = Field(min_length=1, max_length=20)
    specializations: list[str] = Field(default_factory=list, max_length=30)
    naturalist_profile: NaturalistProfileInput | None = None
    profile_photo_content_type: str | None = Field(default=None, max_length=40)
    profile_photo_base64: str | None = None

    @field_validator("full_name", "base_location", "bio", "profile_photo_content_type", mode="before")
    @classmethod
    def _strip_optional_strings(cls, value: object) -> object:
        if isinstance(value, str):
            stripped = value.strip()
            return stripped or None
        return value

    @field_validator("languages", "specializations", mode="before")
    @classmethod
    def _normalize_names(cls, value: object) -> object:
        return _normalize_name_list(value)

    @model_validator(mode="after")
    def _validate_role_naturalist(self) -> GuideProfileCreate:
        if self.role == GuideRole.NATURALIST and self.naturalist_profile is None:
            raise ValueError("naturalist_profile is required when role is NATURALIST.")
        if self.role == GuideRole.GUIDE and self.naturalist_profile is not None:
            raise ValueError("naturalist_profile must be absent when role is GUIDE.")
        return self

    @model_validator(mode="after")
    def _validate_profile_photo(self) -> GuideProfileCreate:
        has_content_type = self.profile_photo_content_type is not None
        has_payload = self.profile_photo_base64 is not None

        if has_content_type != has_payload:
            raise ValueError(
                "profile_photo_content_type and profile_photo_base64 must be provided together."
            )

        if not has_payload:
            return self

        if self.profile_photo_content_type not in ALLOWED_PROFILE_PHOTO_CONTENT_TYPES:
            allowed = ", ".join(sorted(ALLOWED_PROFILE_PHOTO_CONTENT_TYPES))
            raise ValueError(f"profile_photo_content_type must be one of: {allowed}.")

        payload = self.profile_photo_base64
        if payload is None:
            return self
        if payload.startswith("data:"):
            _, _, payload = payload.partition(",")

        try:
            decoded = base64.b64decode(payload, validate=True)
        except (binascii.Error, ValueError) as exc:
            raise ValueError("profile_photo_base64 must be valid base64 content.") from exc

        if len(decoded) > MAX_PROFILE_PHOTO_BYTES:
            raise ValueError("profile_photo_base64 exceeds the 5 MB size limit.")

        return self


class GuideProfileResponse(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    id: str
    full_name: str
    email: EmailStr
    role: GuideRole
    has_profile_photo: bool
    created_at: datetime
    updated_at: datetime
