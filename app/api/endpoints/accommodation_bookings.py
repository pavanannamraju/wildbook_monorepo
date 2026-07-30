from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.api.deps import (
    disallow_guide_booking,
    get_accommodation_bookings_service,
    require_admin_user,
)
from app.models.accommodation_booking import (
    AccommodationBookingAdminUpdate,
    AccommodationBookingCreate,
    AccommodationBookingResponse,
)
from app.models.auth import CurrentUserResponse
from app.models.enums import BookingStatus
from app.models.pagination import CursorPage, CursorParams
from app.services.accommodation_bookings_service import AccommodationBookingsService

router = APIRouter(tags=["accommodation_bookings"])


@router.post("/accommodation-bookings", response_model=AccommodationBookingResponse)
async def create_accommodation_booking(
    payload: AccommodationBookingCreate,
    _principal: CurrentUserResponse = Depends(disallow_guide_booking),
    service: AccommodationBookingsService = Depends(get_accommodation_bookings_service),
) -> AccommodationBookingResponse:
    return await service.create(payload)


@router.get("/accommodation-bookings", response_model=CursorPage[AccommodationBookingResponse])
async def list_accommodation_bookings(
    params: CursorParams = Depends(),
    accommodation_id: str | None = Query(default=None),
    status: BookingStatus | None = Query(default=None),
    provider_type: str | None = Query(default=None),
    provider_id: str | None = Query(default=None),
    _principal: CurrentUserResponse = Depends(require_admin_user),
    service: AccommodationBookingsService = Depends(get_accommodation_bookings_service),
) -> CursorPage[AccommodationBookingResponse]:
    return await service.list(
        params=params,
        accommodation_id=accommodation_id,
        status=status,
        provider_type=provider_type,
        provider_id=provider_id,
    )


@router.get("/accommodation-bookings/{booking_id}", response_model=AccommodationBookingResponse)
async def get_accommodation_booking(
    booking_id: str,
    _principal: CurrentUserResponse = Depends(require_admin_user),
    service: AccommodationBookingsService = Depends(get_accommodation_bookings_service),
) -> AccommodationBookingResponse:
    return await service.get(booking_id=booking_id)


@router.patch("/accommodation-bookings/{booking_id}", response_model=AccommodationBookingResponse)
async def patch_accommodation_booking(
    booking_id: str,
    patch: AccommodationBookingAdminUpdate,
    _principal: CurrentUserResponse = Depends(require_admin_user),
    service: AccommodationBookingsService = Depends(get_accommodation_bookings_service),
) -> AccommodationBookingResponse:
    return await service.patch_admin(booking_id=booking_id, patch=patch)
