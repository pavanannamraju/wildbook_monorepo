from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_authz_service, require_admin_user
from app.models.auth import (
    CurrentUserResponse,
    GuideApplicationCreate,
    GuideApplicationResponse,
    GuideApplicationReviewRequest,
    GuideApplicationStatus,
)
from app.services.authz_service import AuthzService

router = APIRouter(tags=["guide-applications"])


@router.post("/guide-applications", response_model=GuideApplicationResponse)
async def create_guide_application(
    payload: GuideApplicationCreate,
    authz_service: AuthzService = Depends(get_authz_service),
) -> GuideApplicationResponse:
    return authz_service.create_guide_application(payload=payload)


@router.get("/guide-applications", response_model=list[GuideApplicationResponse])
async def list_guide_applications(
    status: GuideApplicationStatus | None = Query(default=None),
    _admin: CurrentUserResponse = Depends(require_admin_user),
    authz_service: AuthzService = Depends(get_authz_service),
) -> list[GuideApplicationResponse]:
    return authz_service.list_guide_applications(status=status)


@router.patch("/guide-applications/{application_id}", response_model=GuideApplicationResponse)
async def review_guide_application(
    application_id: str,
    payload: GuideApplicationReviewRequest,
    admin_user: CurrentUserResponse = Depends(require_admin_user),
    authz_service: AuthzService = Depends(get_authz_service),
) -> GuideApplicationResponse:
    return authz_service.review_guide_application(
        application_id=application_id,
        review=payload,
        admin_user=admin_user,
    )
