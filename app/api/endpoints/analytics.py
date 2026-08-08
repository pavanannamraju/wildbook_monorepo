from __future__ import annotations

from fastapi import APIRouter, Depends, Request

from app.api.deps import get_analytics_service, get_optional_current_user
from app.models.analytics import AnalyticsEventCreate, AnalyticsEventResponse
from app.models.auth import CurrentUserResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter(tags=["analytics"])


@router.post("/analytics/events", response_model=AnalyticsEventResponse)
async def create_analytics_event(
    payload: AnalyticsEventCreate,
    request: Request,
    current_user: CurrentUserResponse | None = Depends(get_optional_current_user),
    service: AnalyticsService = Depends(get_analytics_service),
) -> AnalyticsEventResponse:
    client_host = request.client.host if request.client else None
    return await service.ingest(
        payload=payload,
        current_user=current_user,
        forwarded_for=request.headers.get("X-Forwarded-For"),
        client_host=client_host,
    )
