from __future__ import annotations

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator


class GuideRole(StrEnum):
    GUIDE = "GUIDE"
    NATURALIST = "NATURALIST"


class GuideProfileStatus(StrEnum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"
    REJECTED = "REJECTED"


class GuideVerificationStatus(StrEnum):
    UNVERIFIED = "UNVERIFIED"
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"


class PublishStatus(StrEnum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"


class ExperienceType(StrEnum):
    WALK = "WALK"
    SAFARI = "SAFARI"
    RETREAT = "RETREAT"
    WORKSHOP = "WORKSHOP"


class DurationUnit(StrEnum):
    MINUTES = "MINUTES"
    HOURS = "HOURS"
    DAYS = "DAYS"


class PricingPer(StrEnum):
    PERSON = "PERSON"
    GROUP = "GROUP"


class CancellationActor(StrEnum):
    CUSTOMER = "CUSTOMER"
    GUIDE = "GUIDE"
    ADMIN = "ADMIN"


class LanguageRef(BaseModel):
    id: str
    code: str
    name: str


class ExpertiseRef(BaseModel):
    id: str
    slug: str
    name: str


class LocationRef(BaseModel):
    id: str
    name: str
    city: str
    state: str | None = None
    country: str | None = None
    base_description: str | None = None


class FocusAreaRef(BaseModel):
    id: str
    name: str


class CertificationRef(BaseModel):
    id: str
    name: str
    issuer: str | None = None


class NaturalistProfileCreate(BaseModel):
    focus_area_ids: list[str] = Field(min_length=1)
    certification_ids: list[str] = Field(default_factory=list)
    years_field_experience: int | None = Field(default=None, ge=0, le=80)
    summary: str | None = Field(default=None, max_length=2000)


class NaturalistProfileResponse(BaseModel):
    focus_areas: list[FocusAreaRef]
    certifications: list[CertificationRef] = Field(default_factory=list)
    years_field_experience: int | None = Field(default=None, ge=0, le=80)
    summary: str | None = Field(default=None, max_length=2000)


class GuideBio(BaseModel):
    summary: str = Field(min_length=1, max_length=2000)
    education: str | None = Field(default=None, max_length=2000)
    career_transition: str | None = Field(default=None, max_length=2000)
    philosophy: str | None = Field(default=None, max_length=2000)


class GuideContact(BaseModel):
    platform: str = Field(default="Wildbook", min_length=1, max_length=50)
    response_time: str | None = Field(default=None, max_length=50)
    type: str | None = Field(default=None, max_length=50)


class GuideCreate(BaseModel):
    full_name: str = Field(min_length=1)
    email: EmailStr
    phone_number: str | None = None
    profile_image_url: str | None = Field(default=None, max_length=2048)
    primary_location_id: str = Field(min_length=1, max_length=100)
    location_base_description: str | None = Field(default=None, max_length=500)
    language_ids: list[str] = Field(min_length=1)
    expertise_ids: list[str] = Field(default_factory=list)
    role: GuideRole
    years_of_experience: int = Field(default=0, ge=0, le=80)
    naturalist_profile: NaturalistProfileCreate | None = None
    bio: GuideBio | None = None
    contact: GuideContact | None = None
    status: GuideProfileStatus = GuideProfileStatus.DRAFT
    verification_status: GuideVerificationStatus = GuideVerificationStatus.UNVERIFIED
    is_active: bool = True
    is_deleted: bool = False
    schema_version: int = Field(default=1, ge=0)

    @model_validator(mode="after")
    def validate_role_naturalist_profile(self) -> "GuideCreate":
        if self.role == GuideRole.NATURALIST and self.naturalist_profile is None:
            raise ValueError("naturalist_profile is required when role is NATURALIST")
        if self.role == GuideRole.GUIDE and self.naturalist_profile is not None:
            raise ValueError("naturalist_profile must be absent when role is GUIDE")
        return self


class GuideUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1)
    email: EmailStr | None = None
    phone_number: str | None = None
    profile_image_url: str | None = Field(default=None, max_length=2048)
    primary_location_id: str | None = Field(default=None, min_length=1, max_length=100)
    location_base_description: str | None = Field(default=None, max_length=500)
    language_ids: list[str] | None = Field(default=None, min_length=1)
    expertise_ids: list[str] | None = None
    role: GuideRole | None = None
    years_of_experience: int | None = Field(default=None, ge=0, le=80)
    naturalist_profile: NaturalistProfileCreate | None = None
    bio: GuideBio | None = None
    contact: GuideContact | None = None

    status: GuideProfileStatus | None = None
    verification_status: GuideVerificationStatus | None = None
    is_active: bool | None = None
    is_deleted: bool | None = None
    schema_version: int | None = Field(default=None, ge=0)

    @model_validator(mode="after")
    def validate_role_naturalist_profile(self) -> "GuideUpdate":
        if self.role == GuideRole.NATURALIST and self.naturalist_profile is None:
            raise ValueError("naturalist_profile is required when role is NATURALIST")
        if self.role == GuideRole.GUIDE and self.naturalist_profile is not None:
            raise ValueError("naturalist_profile must be absent when role is GUIDE")
        return self


class GuideResponse(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    guide_id: str
    full_name: str
    email: EmailStr
    phone_number: str | None = None
    profile_image_url: str | None = Field(default=None, max_length=2048)
    has_profile_photo: bool = False
    primary_location_id: str
    location: LocationRef
    languages: list[LanguageRef]
    expertise: list[ExpertiseRef]
    role: GuideRole
    years_of_experience: int = Field(default=0, ge=0, le=80)
    naturalist_profile: NaturalistProfileResponse | None = None
    bio: GuideBio | None = None
    contact: GuideContact | None = None
    status: GuideProfileStatus
    verification_status: GuideVerificationStatus
    is_active: bool
    is_deleted: bool
    schema_version: int = Field(ge=0)
    created_at: datetime
    updated_at: datetime
    is_naturalist: bool


class GuideListResponse(BaseModel):
    items: list[GuideResponse]
    total: int = Field(ge=0)
    limit: int = Field(ge=1)
    offset: int = Field(ge=0)


class ResolveReferencesRequest(BaseModel):
    names: list[str] = Field(default_factory=list, max_length=50)


class ResolvedReference(BaseModel):
    id: str
    name: str


class Duration(BaseModel):
    value: int = Field(ge=0, le=3650)
    unit: DurationUnit
    flexible: bool = False


class GroupSize(BaseModel):
    min: int = Field(ge=1, le=10000)
    max: int = Field(ge=1, le=10000)

    @model_validator(mode="after")
    def validate_capacity_bounds(self) -> "GroupSize":
        if self.min > self.max:
            raise ValueError("group_size.min must be less than or equal to group_size.max")
        return self


class OfferingPricing(BaseModel):
    amount: int = Field(ge=0)
    currency: str = Field(min_length=1, max_length=10, default="INR")
    per: PricingPer = PricingPer.PERSON


class OfferingBase(BaseModel):
    slug: str | None = Field(default=None, min_length=1, max_length=120)
    title: str = Field(min_length=1, max_length=120)
    type: ExperienceType
    status: PublishStatus = PublishStatus.DRAFT
    sort_order: int = 0
    description: str | None = Field(default=None, max_length=10000)
    duration: Duration
    group_size: GroupSize
    pricing: OfferingPricing
    rating: float | None = Field(default=None, ge=0, le=5)
    reviews_count: int | None = Field(default=None, ge=0)
    image_url: str | None = Field(default=None, max_length=2048)
    schema_version: int = Field(default=1, ge=0)


class CreateOfferingRequest(OfferingBase):
    pass


class UpdateOfferingRequest(BaseModel):
    slug: str | None = Field(default=None, min_length=1, max_length=120)
    title: str | None = Field(default=None, min_length=1, max_length=120)
    type: ExperienceType | None = None
    status: PublishStatus | None = None
    sort_order: int | None = None
    description: str | None = Field(default=None, max_length=10000)
    duration: Duration | None = None
    group_size: GroupSize | None = None
    pricing: OfferingPricing | None = None
    rating: float | None = Field(default=None, ge=0, le=5)
    reviews_count: int | None = Field(default=None, ge=0)
    image_url: str | None = Field(default=None, max_length=2048)
    schema_version: int | None = Field(default=None, ge=0)


class OfferingResponse(OfferingBase):
    model_config = ConfigDict(use_enum_values=True)

    offering_id: str
    guide_id: str
    created_at: datetime
    updated_at: datetime


class CancellationRule(BaseModel):
    window_hours_before_start: int = Field(ge=0)
    refund_percent: int = Field(ge=0, le=100)


class PolicyBase(BaseModel):
    policy_name: str = Field(min_length=1)
    user_cancellation_rules: list[CancellationRule] = Field(min_length=1)
    guide_cancellation_rules: list[CancellationRule] = Field(min_length=1)


class CreatePolicyRequest(PolicyBase):
    pass


class UpdatePolicyRequest(BaseModel):
    policy_name: str | None = Field(default=None, min_length=1)
    user_cancellation_rules: list[CancellationRule] | None = Field(default=None, min_length=1)
    guide_cancellation_rules: list[CancellationRule] | None = Field(default=None, min_length=1)


class CancellationPolicyTemplateResponse(PolicyBase):
    policy_id: str
    guide_id: str
    version: int = Field(ge=1)
    created_at: datetime
    updated_at: datetime


class ErrorResponse(BaseModel):
    code: str
    message: str
    correlation_id: str
