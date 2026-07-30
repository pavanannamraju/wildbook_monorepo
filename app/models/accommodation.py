from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.models.enums import AccommodationPricingPer, ProviderRefType, PublishStatus


class ProviderRef(BaseModel):
    type: ProviderRefType
    id: str = Field(min_length=1, max_length=100)

    @field_validator("id", mode="before")
    @classmethod
    def _strip_id(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value


class GeoPoint(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)


class GalleryMedia(BaseModel):
    media_url: str = Field(min_length=1, max_length=1_000)
    media_type: str = Field(default="image", pattern="^(image|video)$")
    caption: str | None = Field(default=None, max_length=500)
    sort_order: int = 0

    @field_validator("media_url", "caption", mode="before")
    @classmethod
    def _strip(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value


class RoomConfig(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    room_count: int = Field(ge=1, le=1_000)
    max_adults: int = Field(ge=1, le=100)

    @field_validator("name", mode="before")
    @classmethod
    def _strip_name(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value


class RatingDetailed(BaseModel):
    overall: float | None = Field(default=None, ge=0, le=5)
    cleanliness: float | None = Field(default=None, ge=0, le=5)
    amenities: float | None = Field(default=None, ge=0, le=5)
    check_in: float | None = Field(default=None, ge=0, le=5)
    access: float | None = Field(default=None, ge=0, le=5)
    location: float | None = Field(default=None, ge=0, le=5)
    value: float | None = Field(default=None, ge=0, le=5)


class Rating(BaseModel):
    average: float | None = Field(default=None, ge=0, le=5)
    reviews_count: int | None = Field(default=None, ge=0)
    detailed: RatingDetailed | None = None


class AccommodationLocation(BaseModel):
    name: str | None = Field(default=None, max_length=200)
    state: str | None = Field(default=None, max_length=120)
    country: str | None = Field(default=None, max_length=120)
    description: str | None = Field(default=None, max_length=500)

    @field_validator("name", "state", "country", "description", mode="before")
    @classmethod
    def _strip(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value


class AccommodationHost(BaseModel):
    name: str | None = Field(default=None, max_length=200)
    role: str | None = Field(default=None, max_length=120)
    experience_years: int | None = Field(default=None, ge=0, le=80)

    @field_validator("name", "role", mode="before")
    @classmethod
    def _strip(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value


class AccommodationDescription(BaseModel):
    summary: str | None = Field(default=None, max_length=300)
    details: str | None = Field(default=None, max_length=10_000)
    experience_type: str | None = Field(default=None, max_length=600)

    @field_validator("summary", "details", "experience_type", mode="before")
    @classmethod
    def _strip(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value


class RoomDetails(BaseModel):
    room_type: str | None = Field(default=None, max_length=120)
    bathroom: str | None = Field(default=None, max_length=120)
    features: list[str] = Field(default_factory=list, max_length=30)

    @field_validator("room_type", "bathroom", mode="before")
    @classmethod
    def _strip(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value


class Capacity(BaseModel):
    group_size: int | None = Field(default=None, ge=1, le=100)
    age_restriction: str | None = Field(default=None, max_length=120)

    @field_validator("age_restriction", mode="before")
    @classmethod
    def _strip(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value


class Pricing(BaseModel):
    price_per_person_per_night: int | None = Field(default=None, ge=0)
    duration_nights: int | None = Field(default=None, ge=0)
    base_cost: int | None = Field(default=None, ge=0)
    taxes: int | None = Field(default=None, ge=0)
    total_cost: int | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, max_length=10)

    @field_validator("currency", mode="before")
    @classmethod
    def _strip(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value


class CancellationPolicy(BaseModel):
    free_cancellation: str | None = Field(default=None, max_length=200)
    partial_refund: str | None = Field(default=None, max_length=200)

    @field_validator("free_cancellation", "partial_refund", mode="before")
    @classmethod
    def _strip(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value


class Policies(BaseModel):
    cancellation: CancellationPolicy | None = None
    check_in: str | None = Field(default=None, max_length=80)
    check_out: str | None = Field(default=None, max_length=80)
    house_rules: list[str] = Field(default_factory=list, max_length=30)
    safety: list[str] = Field(default_factory=list, max_length=30)

    @field_validator("check_in", "check_out", mode="before")
    @classmethod
    def _strip(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value


class Booking(BaseModel):
    confirmation: str | None = Field(default=None, max_length=200)
    cancellation_window_hours: int | None = Field(default=None, ge=0, le=24 * 30)

    @field_validator("confirmation", mode="before")
    @classmethod
    def _strip(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value


class AccommodationImage(BaseModel):
    id: str = Field(min_length=1, max_length=100)
    url: str = Field(min_length=1, max_length=1_000)
    type: str | None = Field(default=None, max_length=80)
    category: str | None = Field(default=None, max_length=80)
    caption: str | None = Field(default=None, max_length=500)
    is_primary: bool = False
    order: int = 0

    @field_validator("id", "url", "type", "category", "caption", mode="before")
    @classmethod
    def _strip(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value


class AccommodationBase(BaseModel):
    slug: str = Field(min_length=1, max_length=120)
    name: str = Field(min_length=1, max_length=200)
    provider_ref: ProviderRef
    expert_id: str | None = Field(default=None, max_length=100)
    expert_slug: str | None = Field(default=None, max_length=120)
    type: str | None = Field(default=None, max_length=80)
    status: PublishStatus = PublishStatus.draft
    is_active: bool = True
    is_deleted: bool = False

    primary_location_id: str = Field(min_length=1, max_length=100)
    address_line: str | None = Field(default=None, max_length=500)
    geo: GeoPoint | None = None
    map_url: str | None = Field(default=None, max_length=1_000)

    about: str | None = Field(default=None, max_length=10_000)
    what_to_expect: list[str] = Field(default_factory=list, max_length=20)
    amenity_ids: list[str] = Field(default_factory=list, max_length=100)
    amenity_names: list[str] = Field(default_factory=list, max_length=100)
    gallery_media: list[GalleryMedia] = Field(default_factory=list, max_length=50)

    max_adults: int | None = Field(default=None, ge=1, le=100)
    room_configs: list[RoomConfig] = Field(default_factory=list, max_length=50)

    cancellation_policy: str | None = Field(default=None, max_length=2_000)
    house_rules: list[str] = Field(default_factory=list, max_length=30)
    safety_notes: list[str] = Field(default_factory=list, max_length=30)
    checkin_time: str | None = Field(default=None, max_length=40)
    checkout_time: str | None = Field(default=None, max_length=40)

    base_rate_amount: int | None = Field(default=None, ge=0)
    currency: str = Field(default="INR", min_length=1, max_length=10)
    pricing_per: AccommodationPricingPer = AccommodationPricingPer.person
    default_tax_rate_pct: float | None = Field(default=None, ge=0, le=100)

    rating_avg: float | None = Field(default=None, ge=0, le=5)
    reviews_count: int | None = Field(default=None, ge=0)
    rating: Rating | None = None
    location: AccommodationLocation | None = None
    host: AccommodationHost | None = None
    description: AccommodationDescription | None = None
    room_details: RoomDetails | None = None
    capacity: Capacity | None = None
    amenities: list[str] = Field(default_factory=list, max_length=100)
    experiences: list[str] = Field(default_factory=list, max_length=100)
    pricing: Pricing | None = None
    policies: Policies | None = None
    highlights: list[str] = Field(default_factory=list, max_length=50)
    booking: Booking | None = None
    images: list[AccommodationImage] = Field(default_factory=list, max_length=100)

    schema_version: int | None = Field(default=None, ge=0)
    created_at: datetime | None = None
    updated_at: datetime | None = None

    @field_validator(
        "slug",
        "name",
        "expert_id",
        "expert_slug",
        "type",
        "primary_location_id",
        "address_line",
        "map_url",
        "about",
        "cancellation_policy",
        "checkin_time",
        "checkout_time",
        "currency",
        mode="before",
    )
    @classmethod
    def _strip(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value


class AccommodationCreate(AccommodationBase):
    pass


class AccommodationUpdate(BaseModel):
    slug: str | None = Field(default=None, min_length=1, max_length=120)
    name: str | None = Field(default=None, min_length=1, max_length=200)
    provider_ref: ProviderRef | None = None
    expert_id: str | None = Field(default=None, max_length=100)
    expert_slug: str | None = Field(default=None, max_length=120)
    type: str | None = Field(default=None, max_length=80)
    status: PublishStatus | None = None
    is_active: bool | None = None
    is_deleted: bool | None = None
    primary_location_id: str | None = Field(default=None, min_length=1, max_length=100)
    address_line: str | None = Field(default=None, max_length=500)
    geo: GeoPoint | None = None
    map_url: str | None = Field(default=None, max_length=1_000)
    about: str | None = Field(default=None, max_length=10_000)
    what_to_expect: list[str] | None = None
    amenity_ids: list[str] | None = None
    amenity_names: list[str] | None = None
    gallery_media: list[GalleryMedia] | None = None
    max_adults: int | None = Field(default=None, ge=1, le=100)
    room_configs: list[RoomConfig] | None = None
    cancellation_policy: str | None = Field(default=None, max_length=2_000)
    house_rules: list[str] | None = None
    safety_notes: list[str] | None = None
    checkin_time: str | None = Field(default=None, max_length=40)
    checkout_time: str | None = Field(default=None, max_length=40)
    base_rate_amount: int | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, min_length=1, max_length=10)
    pricing_per: AccommodationPricingPer | None = None
    default_tax_rate_pct: float | None = Field(default=None, ge=0, le=100)
    rating_avg: float | None = Field(default=None, ge=0, le=5)
    reviews_count: int | None = Field(default=None, ge=0)
    rating: Rating | None = None
    location: AccommodationLocation | None = None
    host: AccommodationHost | None = None
    description: AccommodationDescription | None = None
    room_details: RoomDetails | None = None
    capacity: Capacity | None = None
    amenities: list[str] | None = None
    experiences: list[str] | None = None
    pricing: Pricing | None = None
    policies: Policies | None = None
    highlights: list[str] | None = None
    booking: Booking | None = None
    images: list[AccommodationImage] | None = None
    schema_version: int | None = Field(default=None, ge=0)

    @field_validator(
        "slug",
        "name",
        "expert_id",
        "expert_slug",
        "type",
        "primary_location_id",
        "address_line",
        "map_url",
        "about",
        "cancellation_policy",
        "checkin_time",
        "checkout_time",
        "currency",
        mode="before",
    )
    @classmethod
    def _strip(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value


class AccommodationListItem(BaseModel):
    id: str
    slug: str
    name: str
    provider_ref: ProviderRef
    primary_location_id: str
    map_url: str | None = None
    base_rate_amount: int | None = None
    currency: str = "INR"
    pricing_per: AccommodationPricingPer = AccommodationPricingPer.person
    rating_avg: float | None = None
    reviews_count: int | None = None
    amenity_names: list[str] = Field(default_factory=list)
    gallery_media: list[GalleryMedia] = Field(default_factory=list)


class AccommodationResponse(AccommodationBase):
    id: str
