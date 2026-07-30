from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import get_authz_service, get_current_user, require_admin_user
from app.models.auth import (
    AdminCreateUserRequest,
    CurrentUserResponse,
    EmailSignupProfileUpsertRequest,
)
from app.services.authz_service import AuthzService

router = APIRouter(tags=["auth"])


@router.get("/auth/me", response_model=CurrentUserResponse)
async def get_me(
    current_user: CurrentUserResponse = Depends(get_current_user),
) -> CurrentUserResponse:
    return current_user


@router.post("/auth/admin-users", response_model=CurrentUserResponse)
async def create_admin_user(
    payload: AdminCreateUserRequest,
    _admin: CurrentUserResponse = Depends(require_admin_user),
    authz_service: AuthzService = Depends(get_authz_service),
) -> CurrentUserResponse:
    return authz_service.create_admin_user(payload=payload)


@router.post("/auth/email-signup-profile", response_model=CurrentUserResponse)
async def upsert_email_signup_profile(
    payload: EmailSignupProfileUpsertRequest,
    current_user: CurrentUserResponse = Depends(get_current_user),
    authz_service: AuthzService = Depends(get_authz_service),
) -> CurrentUserResponse:
    return authz_service.upsert_email_signup_profile(current_user=current_user, payload=payload)
