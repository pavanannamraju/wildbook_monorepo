from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.models.enums import InquiryPriority, InquiryStatus


class InquiryBase(BaseModel):
    expert_id: str = Field(min_length=1, max_length=100)
    expert_name: str = Field(min_length=1, max_length=200)

    customer_name: str = Field(min_length=1, max_length=150)
    customer_email: str = Field(min_length=5, max_length=254)
    travel_dates: str | None = Field(default=None, max_length=120)
    group_size: str | None = Field(default=None, max_length=80)
    enquiry_message: str = Field(min_length=10, max_length=5_000)

    source: str = Field(default="expert_detail_form", max_length=50)

    status: InquiryStatus = InquiryStatus.new
    priority: InquiryPriority = InquiryPriority.medium
    assigned_to: str | None = Field(default=None, max_length=120)
    admin_notes: str | None = Field(default=None, max_length=5_000)

    created_at: datetime | None = None
    updated_at: datetime | None = None
    last_status_changed_at: datetime | None = None

    @field_validator(
        "expert_id",
        "expert_name",
        "customer_name",
        "customer_email",
        "travel_dates",
        "group_size",
        "enquiry_message",
        "source",
        "assigned_to",
        "admin_notes",
        mode="before",
    )
    @classmethod
    def _strip(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value


class InquiryCreate(BaseModel):
    expert_id: str = Field(min_length=1, max_length=100)
    expert_name: str = Field(min_length=1, max_length=200)
    customer_name: str = Field(min_length=1, max_length=150)
    customer_email: str = Field(min_length=5, max_length=254)
    travel_dates: str | None = Field(default=None, max_length=120)
    group_size: str | None = Field(default=None, max_length=80)
    enquiry_message: str = Field(min_length=10, max_length=5_000)
    source: str = Field(default="expert_detail_form", max_length=50)

    @field_validator(
        "expert_id",
        "expert_name",
        "customer_name",
        "customer_email",
        "travel_dates",
        "group_size",
        "enquiry_message",
        "source",
        mode="before",
    )
    @classmethod
    def _strip(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value


class InquiryAdminUpdate(BaseModel):
    status: InquiryStatus | None = None
    priority: InquiryPriority | None = None
    assigned_to: str | None = Field(default=None, max_length=120)
    admin_notes: str | None = Field(default=None, max_length=5_000)

    @field_validator("assigned_to", "admin_notes", mode="before")
    @classmethod
    def _strip(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value


class InquiryResponse(InquiryBase):
    id: str

