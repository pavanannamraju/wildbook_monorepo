from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import get_guide_profiles_service
from app.models.guide_profile import GuideProfileCreate, GuideProfileOptionsResponse, GuideProfileResponse
from app.services.guide_profiles_service import GuideProfilesService

router = APIRouter(tags=["guide-profiles"])


@router.get("/guide-profiles/options", response_model=GuideProfileOptionsResponse)
async def get_guide_profile_options(
    service: GuideProfilesService = Depends(get_guide_profiles_service),
) -> GuideProfileOptionsResponse:
    return await service.get_options()


@router.post("/guide-profiles", response_model=GuideProfileResponse, status_code=201)
async def create_guide_profile(
    payload: GuideProfileCreate,
    service: GuideProfilesService = Depends(get_guide_profiles_service),
) -> GuideProfileResponse:
    return await service.create(payload)
