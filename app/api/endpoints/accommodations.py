from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_accommodations_service, require_admin_user
from app.models.accommodation import (
    AccommodationCreate,
    AccommodationListItem,
    AccommodationResponse,
    AccommodationUpdate,
)
from app.models.auth import CurrentUserResponse
from app.models.pagination import CursorPage, CursorParams
from app.services.accommodations_service import AccommodationsService

router = APIRouter(tags=["accommodations"])


@router.post("/accommodations", response_model=AccommodationResponse)
async def create_accommodation(
    payload: AccommodationCreate,
    _principal: CurrentUserResponse = Depends(require_admin_user),
    service: AccommodationsService = Depends(get_accommodations_service),
) -> AccommodationResponse:
    return await service.create(payload)


@router.get("/accommodations", response_model=CursorPage[AccommodationListItem])
async def list_accommodations(
    params: CursorParams = Depends(),
    status: str | None = Query(default="published"),
    location_id: str | None = Query(default=None),
    provider_type: str | None = Query(default=None),
    provider_id: str | None = Query(default=None),
    q: str | None = Query(default=None),
    service: AccommodationsService = Depends(get_accommodations_service),
) -> CursorPage[AccommodationListItem]:
    return await service.list(
        params=params,
        status=status,
        location_id=location_id,
        provider_type=provider_type,
        provider_id=provider_id,
        q=q,
    )


@router.get("/accommodations/{slug_or_id}", response_model=AccommodationResponse)
async def get_accommodation(
    slug_or_id: str,
    service: AccommodationsService = Depends(get_accommodations_service),
) -> AccommodationResponse:
    return await service.get(slug_or_id=slug_or_id)


@router.patch("/accommodations/{accommodation_id}", response_model=AccommodationResponse)
async def patch_accommodation(
    accommodation_id: str,
    patch: AccommodationUpdate,
    _principal: CurrentUserResponse = Depends(require_admin_user),
    service: AccommodationsService = Depends(get_accommodations_service),
) -> AccommodationResponse:
    return await service.patch(accommodation_id=accommodation_id, patch=patch)


@router.delete("/accommodations/{accommodation_id}", status_code=204)
async def delete_accommodation(
    accommodation_id: str,
    _principal: CurrentUserResponse = Depends(require_admin_user),
    service: AccommodationsService = Depends(get_accommodations_service),
) -> None:
    await service.delete(accommodation_id=accommodation_id)
