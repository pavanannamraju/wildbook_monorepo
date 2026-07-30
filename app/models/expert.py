from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

# Where an expert record originates. "local" guides are self-published via the
# BFF guide-profile flow; "catalog" guides come from the search/catalog services.
ExpertSource = Literal["local", "catalog"]


class ExperienceSnapshot(BaseModel):
    id: str
    title: str
    type: str
    status: str = "published"
    pricing_amount: int | None = None
    pricing_currency: str | None = None
    pricing_per: str | None = None
    rating: float | None = None
    reviews_count: int | None = None


class TestimonialSnapshot(BaseModel):
    id: str
    author_name: str
    author_location: str | None = None
    content_excerpt: str
    status: str = "published"


class ExpertListItem(BaseModel):
    id: str
    slug: str
    name: str
    bio_summary: str | None = None
    location_primary_location_id: str | None = None
    location_name: str | None = None
    profile_image_url: str | None = None
    source: ExpertSource = "catalog"
    roles: list[str] = Field(default_factory=list)
    expertise_ids: list[str] = Field(default_factory=list)
    expertise_names: list[str] = Field(default_factory=list)
    language_ids: list[str] = Field(default_factory=list)
    language_names: list[str] = Field(default_factory=list)
    experience_snapshots: list[ExperienceSnapshot] = Field(default_factory=list)
    testimonial_snapshots: list[TestimonialSnapshot] = Field(default_factory=list)
    experience_rating_max: float | None = None
    is_bookmarked: bool | None = None


class ExpertBio(BaseModel):
    summary: str
    education: str | None = None
    career_transition: str | None = None
    philosophy: str | None = None


class ExpertLocation(BaseModel):
    primary_location_id: str
    base_description: str | None = None


class ExpertHomestay(BaseModel):
    accommodation_id: str
    slug: str
    title: str
    tagline: str | None = None


class ExperienceDetail(BaseModel):
    id: str
    title: str
    description: str | None = None
    image_url: str | None = None
    duration: dict[str, object] | None = None
    group_size: dict[str, object] | None = None
    pricing: dict[str, object] | None = None
    reviews_count: int | None = None
    rating: float | None = None


class TestimonialDetail(BaseModel):
    id: str
    author_name: str
    author_location: str | None = None
    content: str


class FieldEntryDetail(BaseModel):
    id: str
    title: str
    caption: str | None = None
    media_url: str
    media_type: str
    sort_order: int = 0
    status: str = "published"
    location_label: str | None = None


class ExpertPublicDetail(BaseModel):
    id: str
    slug: str
    name: str
    roles: list[str] = Field(default_factory=list)
    profile_image_url: str | None = None
    source: ExpertSource = "catalog"
    experience_years: int | None = None
    bio: ExpertBio | None = None
    location: ExpertLocation | None = None
    location_name: str | None = None
    homestay: ExpertHomestay | None = None
    expertise_ids: list[str] = Field(default_factory=list)
    expertise_names: list[str] = Field(default_factory=list)
    language_ids: list[str] = Field(default_factory=list)
    language_names: list[str] = Field(default_factory=list)
    experience_rating_max: float | None = None
    experiences_full: list[ExperienceDetail] | None = None
    testimonials_full: list[TestimonialDetail] | None = None
    field_entries_full: list[FieldEntryDetail] | None = None


class CursorPage(BaseModel):
    items: list[ExpertListItem]
    next_cursor: str | None
    total_count: int | None = None
