from __future__ import annotations

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class AuthPrincipal(BaseModel):
    uid: str
    email: str | None = None
    claims: dict[str, object] = Field(default_factory=dict)


class AuthProvider(StrEnum):
    EMAIL = "EMAIL"
    GOOGLE = "GOOGLE"


class UserRole(StrEnum):
    USER = "USER"
    ADMIN = "ADMIN"
    GUIDE = "GUIDE"


class GuideApplicationStatus(StrEnum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class CurrentUserResponse(BaseModel):
    id: str
    uid: str
    email: str
    full_name: str | None = None
    phone_number: str | None = None
    role: UserRole
    is_active: bool
    profile_completed: bool
    auth_provider: AuthProvider


class GuideApplicationCreate(BaseModel):
    fullname: str = Field(min_length=2, max_length=150)
    location: str = Field(min_length=2, max_length=120)
    profession: str = Field(min_length=2, max_length=120)
    contact_number: str = Field(min_length=5, max_length=30)
    email: str


class GuideApplicationReviewRequest(BaseModel):
    status: GuideApplicationStatus
    email: str | None = None
    auth_provider: AuthProvider | None = None


class GuideApplicationResponse(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    id: str
    fullname: str
    location: str
    profession: str
    contact_number: str
    email: str
    status: GuideApplicationStatus
    reviewed_by: str | None = None
    created_at: datetime
    reviewed_at: datetime | None = None


class AdminCreateUserRequest(BaseModel):
    email: str
    role: UserRole = UserRole.ADMIN
    auth_provider: AuthProvider = AuthProvider.EMAIL
    is_active: bool = True


class EmailSignupProfileUpsertRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    phone_number: str | None = Field(default=None, min_length=5, max_length=30)
