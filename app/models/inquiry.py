from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator, model_validator

from app.models.enums import InquiryDatesPreference, InquiryPriority, InquiryStatus


class InquiryBase(BaseModel):
    expert_id: str = Field(min_length=1, max_length=100)
    expert_name: str = Field(min_length=1, max_length=200)

    customer_name: str = Field(min_length=1, max_length=150)
    customer_email: str = Field(min_length=5, max_length=254)
    dates_preference: InquiryDatesPreference | None = None
    travel_start_date: date | None = None
    travel_end_date: date | None = None
    # Legacy freeform field; still returned for older documents.
    travel_dates: str | None = Field(default=None, max_length=120)
    group_size: str | None = Field(default=None, max_length=80)
    enquiry_message: str = Field(min_length=1, max_length=5_000)

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
    dates_preference: InquiryDatesPreference
    travel_start_date: date | None = None
    travel_end_date: date | None = None
    group_size: str | None = Field(default=None, max_length=80)
    enquiry_message: str = Field(min_length=1, max_length=5_000)
    source: str = Field(default="expert_detail_form", max_length=50)

    @field_validator(
        "expert_id",
        "expert_name",
        "customer_name",
        "customer_email",
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

    @model_validator(mode="after")
    def _validate_dates_preference(self) -> InquiryCreate:
        if self.dates_preference == InquiryDatesPreference.flexible:
            if self.travel_start_date is not None or self.travel_end_date is not None:
                raise ValueError("travel_start_date and travel_end_date must be omitted when dates are flexible.")
            return self

        if self.travel_start_date is None or self.travel_end_date is None:
            raise ValueError("travel_start_date and travel_end_date are required when dates are fixed.")
        if self.travel_end_date <= self.travel_start_date:
            raise ValueError("travel_end_date must be after travel_start_date.")
        return self


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
