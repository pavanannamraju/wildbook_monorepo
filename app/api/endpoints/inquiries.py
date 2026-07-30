from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Request

from app.api.deps import get_inquiries_service, require_admin_user, require_user_or_admin
from app.models.auth import CurrentUserResponse
from app.models.enums import InquiryStatus
from app.models.inquiry import InquiryAdminUpdate, InquiryCreate, InquiryResponse
from app.models.pagination import CursorPage, CursorParams
from app.services.inquiries_service import InquiriesService

router = APIRouter(tags=["inquiries"])


@router.post("/inquiries", response_model=InquiryResponse)
async def create_inquiry(
    payload: InquiryCreate,
    request: Request,
    _principal: CurrentUserResponse = Depends(require_user_or_admin),
    service: InquiriesService = Depends(get_inquiries_service),
) -> InquiryResponse:
    correlation_id = request.headers.get("X-Correlation-Id") or request.headers.get("X-Request-ID")
    return await service.create(payload, correlation_id=correlation_id)


@router.get("/inquiries", response_model=CursorPage[InquiryResponse])
async def list_inquiries(
    params: CursorParams = Depends(),
    expert_id: str | None = Query(default=None),
    status: InquiryStatus | None = Query(default=None),
    email: str | None = Query(default=None),
    _admin: CurrentUserResponse = Depends(require_admin_user),
    service: InquiriesService = Depends(get_inquiries_service),
) -> CursorPage[InquiryResponse]:
    return await service.list(params=params, expert_id=expert_id, status=status, email=email)


@router.get("/inquiries/{inquiry_id}", response_model=InquiryResponse)
async def get_inquiry(
    inquiry_id: str,
    _admin: CurrentUserResponse = Depends(require_admin_user),
    service: InquiriesService = Depends(get_inquiries_service),
) -> InquiryResponse:
    return await service.get(inquiry_id=inquiry_id)


@router.patch("/inquiries/{inquiry_id}", response_model=InquiryResponse)
async def patch_inquiry(
    inquiry_id: str,
    patch: InquiryAdminUpdate,
    _principal: CurrentUserResponse = Depends(require_admin_user),
    service: InquiriesService = Depends(get_inquiries_service),
) -> InquiryResponse:
    return await service.patch_admin(inquiry_id=inquiry_id, patch=patch)

