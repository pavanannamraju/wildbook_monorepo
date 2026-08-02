from __future__ import annotations

from datetime import date, datetime
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


class TravelExperienceLevel(StrEnum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"


class AvatarType(StrEnum):
    """Differentiator for how a user avatar should be resolved."""

    preset = "preset"
    custom = "custom"


# Stable keys matching frontend/src/assets/avatar_icons (spaces normalized to hyphens).
ALLOWED_PRESET_AVATAR_KEYS: frozenset[str] = frozenset(
    {
        "002-giraffe",
        "003-monkey",
        "004-rabbit",
        "007-panda-bear",
        "008-cheetah",
        "011-deer",
        "014-wolf",
        "015-fox",
        "016-lion",
        "019-tiger",
        "020-zebra",
        "025-bear",
        "030-rhinoceros",
        "033-eagle",
        "034-elephant",
        "042-gorilla",
        "043-kangaroo",
        "044-polar-bear",
        "045-owl",
        "046-beaver",
        "048-squirrel",
        "050-koala",
    }
)


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
    bio: str | None = None
    date_of_birth: date | None = None
    gender: str | None = None
    location_city: str | None = None
    location_country: str | None = None
    interests: list[str] = Field(default_factory=list)
    preferred_languages: list[str] = Field(default_factory=list)
    experience_level: TravelExperienceLevel | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    avatar_type: AvatarType | None = None
    avatar_key: str | None = None
    avatar_url: str | None = None


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


class ProfileDetailsUpdateRequest(BaseModel):
    bio: str | None = Field(default=None, max_length=500)
    date_of_birth: date | None = None
    gender: str | None = Field(default=None, max_length=40)
    location_city: str | None = Field(default=None, max_length=100)
    location_country: str | None = Field(default=None, max_length=100)
    interests: list[str] = Field(default_factory=list, max_length=20)
    preferred_languages: list[str] = Field(default_factory=list, max_length=20)
    experience_level: TravelExperienceLevel | None = None
    emergency_contact_name: str | None = Field(default=None, max_length=120)
    emergency_contact_phone: str | None = Field(default=None, max_length=30)
    phone_number: str | None = Field(default=None, min_length=5, max_length=30)


class AvatarUpdateRequest(BaseModel):
    """
    Persist the user's avatar with an explicit type differentiator:
    - preset: avatar_key refers to a bundled wildlife icon (e.g. "019-tiger")
    - custom: avatar_url is a data-URI base64 image (data:image/...;base64,...)
    """

    avatar_type: AvatarType
    avatar_key: str | None = Field(default=None, max_length=64)
    # Base64 data URIs are large; keep under MongoDB's 16MB doc limit with headroom.
    avatar_url: str | None = Field(default=None, max_length=1_500_000)
