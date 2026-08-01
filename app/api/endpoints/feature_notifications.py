from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_feature_notify_service, require_admin_user
from app.models.auth import CurrentUserResponse
from app.models.feature_notify import FeatureNotifyCreate, FeatureNotifyListItem, FeatureNotifyResponse
from app.models.pagination import CursorPage, CursorParams
from app.services.feature_notify_service import FeatureNotifyService

router = APIRouter(tags=["feature-notify"])


@router.post("/feature-notifications", response_model=FeatureNotifyResponse)
async def subscribe_feature_notification(
    payload: FeatureNotifyCreate,
    service: FeatureNotifyService = Depends(get_feature_notify_service),
) -> FeatureNotifyResponse:
    return await service.subscribe(payload)


@router.get("/feature-notifications", response_model=CursorPage[FeatureNotifyListItem])
async def list_feature_notifications(
    params: CursorParams = Depends(),
    feature: str | None = Query(default=None),
    email: str | None = Query(default=None),
    _admin: CurrentUserResponse = Depends(require_admin_user),
    service: FeatureNotifyService = Depends(get_feature_notify_service),
) -> CursorPage[FeatureNotifyListItem]:
    return await service.list(params=params, feature=feature, email=email)
