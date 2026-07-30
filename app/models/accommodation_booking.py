from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator

from app.models.accommodation import ProviderRef
from app.models.enums import BookingStatus, PaymentStatus


class PriceSnapshot(BaseModel):
    rate_amount: int = Field(ge=0)
    currency: str = Field(default="INR", min_length=1, max_length=10)
    nights: int = Field(ge=1, le=365)
    subtotal_amount: int = Field(ge=0)
    taxes_amount: int = Field(ge=0)
    total_amount: int = Field(ge=0)


class AccommodationBookingBase(BaseModel):
    accommodation_id: str = Field(min_length=1, max_length=100)
    provider_ref: ProviderRef
    check_in: date
    check_out: date
    adults: int = Field(ge=1, le=100)
    customer_name: str = Field(min_length=1, max_length=120)
    customer_email: str = Field(min_length=3, max_length=320)
    customer_phone: str | None = Field(default=None, max_length=50)
    special_requests: str | None = Field(default=None, max_length=2_000)
    price_snapshot: PriceSnapshot
    status: BookingStatus = BookingStatus.pending
    payment_status: PaymentStatus = PaymentStatus.offline_pending
    payment_notes: str | None = Field(default=None, max_length=2_000)
    provider_response_notes: str | None = Field(default=None, max_length=2_000)
    created_at: datetime | None = None
    updated_at: datetime | None = None
    last_status_changed_at: datetime | None = None
    schema_version: int | None = Field(default=None, ge=0)

    @field_validator(
        "accommodation_id",
        "customer_name",
        "customer_email",
        "customer_phone",
        "special_requests",
        "payment_notes",
        "provider_response_notes",
        mode="before",
    )
    @classmethod
    def _strip(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value


class AccommodationBookingCreate(BaseModel):
    accommodation_id: str = Field(min_length=1, max_length=100)
    check_in: date
    check_out: date
    adults: int = Field(ge=1, le=100)
    customer_name: str = Field(min_length=1, max_length=120)
    customer_email: str = Field(min_length=3, max_length=320)
    customer_phone: str | None = Field(default=None, max_length=50)
    special_requests: str | None = Field(default=None, max_length=2_000)

    @field_validator(
        "accommodation_id",
        "customer_name",
        "customer_email",
        "customer_phone",
        "special_requests",
        mode="before",
    )
    @classmethod
    def _strip(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value


class AccommodationBookingAdminUpdate(BaseModel):
    status: BookingStatus | None = None
    payment_status: PaymentStatus | None = None
    payment_notes: str | None = Field(default=None, max_length=2_000)
    provider_response_notes: str | None = Field(default=None, max_length=2_000)

    @field_validator("payment_notes", "provider_response_notes", mode="before")
    @classmethod
    def _strip(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value


class AccommodationBookingResponse(AccommodationBookingBase):
    id: str
