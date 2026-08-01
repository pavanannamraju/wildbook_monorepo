from __future__ import annotations

import logging
from typing import cast

from fastapi import Depends, Request
from firebase_admin import auth as firebase_auth
from firebase_admin._auth_utils import InvalidIdTokenError
from pymongo import MongoClient

from app.core.config import get_settings
from app.domain.guides.local_catalog import LocalCatalog
from app.domain.guides.local_search import LocalSearch
from app.errors.http import AppError, ForbiddenError, ServiceUnavailableError, UnauthorizedError
from app.models.auth import AuthPrincipal, CurrentUserResponse, UserRole
from app.services.accommodation_bookings_service import AccommodationBookingsService
from app.services.accommodations_service import AccommodationsService
from app.services.authz_service import AuthzService
from app.services.bookmarks_service import BookmarksService
from app.services.experts_adapter_service import ExpertsAdapterService
from app.services.feature_notify_service import FeatureNotifyService
from app.services.guide_profiles_service import GuideProfilesService
from app.services.inquiries_service import InquiriesService
from app.services.maps_data_service import MapsDataService
from app.stores.maps_data_store import MongoMapsDataStore
from app.stores.mongo_client import create_mongo_client

logger = logging.getLogger("wildbook_v1.auth")


def _get_mongo_client(request: Request) -> MongoClient:
    client = getattr(request.app.state, "mongo_client", None)
    if client is None:
        settings = get_settings()
        if not settings.mongo_uri:
            raise AppError(detail="MongoDB connection is not configured.")
        try:
            client = create_mongo_client(mongo_uri=settings.mongo_uri)
        except Exception as exc:
            raise ServiceUnavailableError(detail=f"MongoDB client init failed: {exc}") from exc
        request.app.state.mongo_client = client
    return cast(MongoClient, client)


def get_local_catalog(request: Request) -> LocalCatalog:
    catalog = getattr(request.app.state, "local_catalog", None)
    if catalog is None:
        raise ServiceUnavailableError(detail="Guide catalog is not initialized.")
    return cast(LocalCatalog, catalog)


def get_local_search(request: Request) -> LocalSearch:
    search = getattr(request.app.state, "local_search", None)
    if search is None:
        raise ServiceUnavailableError(detail="Guide search is not initialized.")
    return cast(LocalSearch, search)


def get_maps_data_service(request: Request) -> MapsDataService:
    service = getattr(request.app.state, "maps_data_service", None)
    if service is None:
        settings = get_settings()
        if (
            not settings.mongo_uri
            or not settings.mongo_maps_data_database_name
            or not settings.mongo_maps_data_collection_name
        ):
            raise AppError(detail="MongoDB settings are missing for maps-data endpoint.")

        client = _get_mongo_client(request)
        db = client[settings.mongo_maps_data_database_name]
        collection = db[settings.mongo_maps_data_collection_name]
        store = MongoMapsDataStore(collection=collection)
        service = MapsDataService(store=store)
        request.app.state.maps_data_service = service

    return cast(MapsDataService, service)


def get_accommodations_service(request: Request) -> AccommodationsService:
    service = getattr(request.app.state, "accommodations_service", None)
    if service is None:
        settings = get_settings()
        client = _get_mongo_client(request)
        db = client[settings.mongo_database_name]
        service = AccommodationsService(accommodations=db[settings.mongo_accommodations_collection_name])
        request.app.state.accommodations_service = service
    return cast(AccommodationsService, service)


def get_accommodation_bookings_service(request: Request) -> AccommodationBookingsService:
    service = getattr(request.app.state, "accommodation_bookings_service", None)
    if service is None:
        settings = get_settings()
        client = _get_mongo_client(request)
        db = client[settings.mongo_database_name]
        service = AccommodationBookingsService(
            accommodations=db[settings.mongo_accommodations_collection_name],
            accommodation_bookings=db[settings.mongo_accommodation_bookings_collection_name],
        )
        request.app.state.accommodation_bookings_service = service
    return cast(AccommodationBookingsService, service)


def get_inquiries_service(request: Request) -> InquiriesService:
    service = getattr(request.app.state, "inquiries_service", None)
    if service is None:
        settings = get_settings()
        client = _get_mongo_client(request)
        db = client[settings.mongo_database_name]
        service = InquiriesService(
            inquiries=db[settings.mongo_inquiries_collection_name],
            search_client=get_local_search(request),
        )
        request.app.state.inquiries_service = service
    return cast(InquiriesService, service)


def get_feature_notify_service(request: Request) -> FeatureNotifyService:
    service = getattr(request.app.state, "feature_notify_service", None)
    if service is None:
        settings = get_settings()
        client = _get_mongo_client(request)
        db = client[settings.mongo_database_name]
        service = FeatureNotifyService(
            notifications=db[settings.mongo_feature_notifications_collection_name],
        )
        request.app.state.feature_notify_service = service
    return cast(FeatureNotifyService, service)


def get_authz_service(request: Request) -> AuthzService:
    service = getattr(request.app.state, "authz_service", None)
    if service is None:
        settings = get_settings()
        client = _get_mongo_client(request)
        db = client[settings.mongo_database_name]
        service = AuthzService(
            users=db[settings.mongo_users_collection_name],
            guide_applications=db[settings.mongo_guide_applications_collection_name],
            admin_google_emails=set(settings.auth_admin_google_emails),
        )
        request.app.state.authz_service = service
    return cast(AuthzService, service)


def get_bookmarks_service(request: Request) -> BookmarksService:
    service = getattr(request.app.state, "bookmarks_service", None)
    if service is None:
        settings = get_settings()
        client = _get_mongo_client(request)
        db = client[settings.mongo_database_name]
        service = BookmarksService(bookmarks=db[settings.mongo_bookmarks_collection_name])
        request.app.state.bookmarks_service = service
    return cast(BookmarksService, service)


def get_guide_profiles_service(request: Request) -> GuideProfilesService:
    service = getattr(request.app.state, "guide_profiles_service", None)
    if service is None:
        service = GuideProfilesService(catalog_client=get_local_catalog(request))
        request.app.state.guide_profiles_service = service
    return cast(GuideProfilesService, service)


def get_experts_adapter_service(request: Request) -> ExpertsAdapterService:
    service = getattr(request.app.state, "experts_adapter_service", None)
    if service is None:
        service = ExpertsAdapterService(
            catalog_client=get_local_catalog(request),
            search_client=get_local_search(request),
        )
        request.app.state.experts_adapter_service = service
    return cast(ExpertsAdapterService, service)


def _extract_bearer_token(request: Request) -> str:
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        logger.info("auth_denied reason=missing_authorization_header path=%s", request.url.path)
        raise UnauthorizedError(detail="Missing Authorization header.")

    scheme, _, token = auth_header.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        logger.info("auth_denied reason=invalid_authorization_header path=%s", request.url.path)
        raise UnauthorizedError(detail="Authorization header must be Bearer token.")
    return token.strip()


async def get_current_principal(request: Request) -> AuthPrincipal:
    settings = get_settings()

    debug_principal = getattr(request.app.state, "auth_debug_principal", None)
    if debug_principal is not None:
        return cast(AuthPrincipal, debug_principal)

    if not settings.auth_required:
        return AuthPrincipal(uid="anonymous-local", email=None, claims={})

    token = _extract_bearer_token(request)
    try:
        decoded_token = firebase_auth.verify_id_token(token, check_revoked=True, clock_skew_seconds=30)
    except InvalidIdTokenError as exc:
        logger.info("auth_denied reason=invalid_token path=%s", request.url.path)
        raise UnauthorizedError(detail="Invalid Firebase ID token.") from exc
    except Exception as exc:
        logger.warning(
            "auth_denied reason=token_verification_error path=%s error=%s",
            request.url.path,
            exc,
        )
        raise UnauthorizedError(detail=f"Failed to verify Firebase token: {exc}") from exc

    token_project = decoded_token.get("aud")
    if settings.firebase_project_id and token_project != settings.firebase_project_id:
        logger.info("auth_denied reason=audience_mismatch path=%s", request.url.path)
        raise UnauthorizedError(detail="Token audience does not match Firebase project.")

    uid = decoded_token.get("uid")
    if not isinstance(uid, str) or not uid:
        logger.info("auth_denied reason=missing_uid path=%s", request.url.path)
        raise UnauthorizedError(detail="Token is missing uid.")

    email = decoded_token.get("email")
    return AuthPrincipal(
        uid=uid,
        email=email if isinstance(email, str) else None,
        claims={k: v for k, v in decoded_token.items()},
    )


async def get_current_user(
    principal: AuthPrincipal = Depends(get_current_principal),
    authz_service: AuthzService = Depends(get_authz_service),
) -> CurrentUserResponse:
    return authz_service.get_or_provision_user(principal=principal)


async def get_optional_current_user(
    request: Request,
    authz_service: AuthzService = Depends(get_authz_service),
) -> CurrentUserResponse | None:
    settings = get_settings()
    if not settings.auth_required:
        return None
    try:
        principal = await get_current_principal(request)
    except UnauthorizedError:
        return None
    return authz_service.get_or_provision_user(principal=principal)


def _role_guard(allowed_roles: set[UserRole]):
    async def _guard(
        current_user: CurrentUserResponse = Depends(get_current_user),
        authz_service: AuthzService = Depends(get_authz_service),
    ) -> CurrentUserResponse:
        authz_service.ensure_role(current_user, allowed_roles=allowed_roles)
        return current_user

    return _guard


require_admin_user = _role_guard({UserRole.ADMIN})
require_user_or_admin = _role_guard({UserRole.USER, UserRole.ADMIN})


async def disallow_guide_booking(
    current_user: CurrentUserResponse = Depends(get_current_user),
) -> CurrentUserResponse:
    if current_user.role == UserRole.GUIDE:
        raise ForbiddenError(detail="GUIDE users cannot book services.")
    return current_user
