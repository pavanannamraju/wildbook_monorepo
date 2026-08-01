from fastapi import APIRouter

from app.api.endpoints.accommodation_bookings import router as accommodation_bookings_router
from app.api.endpoints.accommodations import router as accommodations_router
from app.api.endpoints.auth import router as auth_router
from app.api.endpoints.bookmarks import router as bookmarks_router
from app.api.endpoints.experts import router as experts_router
from app.api.endpoints.feature_notifications import router as feature_notifications_router
from app.api.endpoints.guide_applications import router as guide_applications_router
from app.api.endpoints.guide_profiles import router as guide_profiles_router
from app.api.endpoints.health import router as health_router
from app.api.endpoints.inquiries import router as inquiries_router
from app.api.endpoints.maps_data import router as maps_data_router
from app.api.endpoints.search import router as search_router


def create_site_router(api_prefix: str) -> APIRouter:
    router = APIRouter()
    router.include_router(health_router, prefix=api_prefix)
    router.include_router(maps_data_router, prefix=api_prefix)
    router.include_router(accommodations_router, prefix=api_prefix)
    router.include_router(accommodation_bookings_router, prefix=api_prefix)
    router.include_router(inquiries_router, prefix=api_prefix)
    router.include_router(auth_router, prefix=api_prefix)
    router.include_router(guide_applications_router, prefix=api_prefix)
    router.include_router(guide_profiles_router, prefix=api_prefix)
    router.include_router(bookmarks_router, prefix=api_prefix)
    router.include_router(experts_router, prefix=api_prefix)
    router.include_router(feature_notifications_router, prefix=api_prefix)
    return router


def create_bff_router(bff_prefix: str) -> APIRouter:
    router = APIRouter()
    router.include_router(health_router, prefix=bff_prefix)
    router.include_router(search_router, prefix=bff_prefix)
    return router
