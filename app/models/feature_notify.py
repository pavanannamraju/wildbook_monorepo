from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class FeatureNotifyCreate(BaseModel):
    email: str = Field(min_length=5, max_length=254)
    feature: str = Field(min_length=2, max_length=120)

    @field_validator("email", "feature", mode="before")
    @classmethod
    def _strip(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value

    @field_validator("email")
    @classmethod
    def _normalize_email(cls, value: str) -> str:
        email = value.strip().lower()
        if "@" not in email or "." not in email.split("@")[-1]:
            raise ValueError("Enter a valid email address.")
        return email


class FeatureNotifyResponse(BaseModel):
    id: str
    email: str
    feature: str
    created_at: datetime
    already_subscribed: bool = False


class FeatureNotifyListItem(BaseModel):
    id: str
    email: str
    feature: str
    created_at: datetime | None = None
