from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Request

from app.api.deps import get_analytics_service, get_optional_current_user, require_admin_user
from app.models.analytics import (
    AnalyticsEventCreate,
    AnalyticsEventResponse,
    AnalyticsFunnelResponse,
)
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


@router.get("/analytics/funnel", response_model=AnalyticsFunnelResponse)
async def get_analytics_funnel(
    lookback_hours: float = Query(default=24 * 30, ge=1, le=24 * 365),
    step_window_hours: float = Query(default=24, ge=1, le=24 * 30),
    _admin: CurrentUserResponse = Depends(require_admin_user),
    service: AnalyticsService = Depends(get_analytics_service),
) -> AnalyticsFunnelResponse:
    return await service.funnel(
        lookback_hours=lookback_hours,
        step_window_hours=step_window_hours,
    )
