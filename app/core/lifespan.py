from __future__ import annotations

import asyncio
import logging
import os
from collections.abc import AsyncIterator
from pathlib import Path

import firebase_admin
from fastapi import FastAPI
from firebase_admin import credentials

from app.core.config import get_settings
from app.domain.guides.catalog_service import CatalogService
from app.domain.guides.catalog_store import CatalogStore
from app.domain.guides.local_catalog import LocalCatalog
from app.domain.guides.local_search import LocalSearch
from app.domain.guides.search_service import GuideSearchService
from app.stores.indexes import (
    ensure_accommodation_bookings_indexes,
    ensure_accommodations_indexes,
    ensure_bookmarks_indexes,
    ensure_feature_notifications_indexes,
    ensure_guide_applications_indexes,
    ensure_inquiries_indexes,
    ensure_users_indexes,
)
from app.stores.mongo_client import create_mongo_client

logger = logging.getLogger("wildbook_v1.lifespan")


def _try_create_index(create_fn, *, label: str) -> None:
    """Indexes speed up queries; they are not required for the monolith to run."""
    try:
        create_fn()
    except Exception as exc:
        logger.warning("Skipping index %s: %s", label, exc)


def _ensure_guide_indexes(store: CatalogStore) -> None:
    # Best-effort only. Existing catalog data may have duplicate null slugs, so a
    # unique (guide_id, slug) index must never block app startup.
    # Sparse so guides without an email (common in field intake) don't collide
    # on the unique index — missing/null emails are allowed more than once.
    _try_create_index(
        lambda: store.guides.create_index(
            [("email", 1)], unique=True, sparse=True, name="uniq_guide_email"
        ),
        label="uniq_guide_email",
    )
    _try_create_index(
        lambda: store.guides.create_index(
            [("status", 1), ("is_active", 1), ("is_deleted", 1), ("max_rating", -1)],
            name="ix_guides_browse",
        ),
        label="ix_guides_browse",
    )
    _try_create_index(
        lambda: store.guides.create_index(
            [("primary_location_id", 1), ("max_rating", -1)],
            name="ix_guides_location",
        ),
        label="ix_guides_location",
    )
    _try_create_index(
        lambda: store.guides.create_index([("language_ids", 1)], name="ix_guides_languages"),
        label="ix_guides_languages",
    )
    _try_create_index(
        lambda: store.guides.create_index([("expertise_ids", 1)], name="ix_guides_expertise"),
        label="ix_guides_expertise",
    )
    _try_create_index(
        lambda: store.guides.create_index([("experience_types", 1)], name="ix_guides_experience_types"),
        label="ix_guides_experience_types",
    )
    _try_create_index(
        lambda: store.guides.create_index([("full_name_normalized", 1)], name="ix_guides_name"),
        label="ix_guides_name",
    )
    _try_create_index(
        lambda: store.offerings.create_index(
            [("guide_id", 1), ("status", 1), ("is_deleted", 1)],
            name="ix_offerings_guide",
        ),
        label="ix_offerings_guide",
    )
    _try_create_index(
        lambda: store.guides.create_index(
            [("search_text", "text")],
            name="tx_guides_search_text",
            default_language="english",
        ),
        label="tx_guides_search_text",
    )


def _init_firebase_admin(*, firebase_project_id: str | None) -> None:
    """Initialize Firebase Admin for ID-token verification.

    Prefer an explicit service-account file (GOOGLE_APPLICATION_CREDENTIALS).
    Docker often creates a *directory* at the mount path when the host file is
    missing — detect that early so auth failures are obvious in logs.
    """
    try:
        firebase_admin.get_app()
        return
    except ValueError:
        pass

    options = {"projectId": firebase_project_id} if firebase_project_id else None
    creds_path = Path(os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "") or "")
    if creds_path.as_posix() and creds_path.is_dir():
        raise RuntimeError(
            f"GOOGLE_APPLICATION_CREDENTIALS points to a directory ({creds_path}). "
            "On Docker this usually means the host file was missing when the volume "
            "was first mounted. Place a service-account JSON at that path and recreate "
            "the container."
        )
    if creds_path.is_file():
        firebase_admin.initialize_app(credentials.Certificate(str(creds_path)), options)
        logger.info("Firebase Admin initialized from %s", creds_path)
        return

    firebase_admin.initialize_app(credentials.ApplicationDefault(), options)
    logger.info("Firebase Admin initialized via Application Default Credentials.")


async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()

    if settings.auth_required:
        if not settings.firebase_project_id:
            logger.warning("AUTH_REQUIRED=true but FIREBASE_PROJECT_ID is not configured.")
        _init_firebase_admin(firebase_project_id=settings.firebase_project_id)

    mongo_client = None
    if settings.mongo_uri:

        def _bootstrap() -> None:
            client = create_mongo_client(mongo_uri=settings.mongo_uri)
            db = client[settings.mongo_database_name]
            # Wire domain services first so reads work even if indexes fail.
            store = CatalogStore(db)
            catalog = CatalogService(store)
            search = GuideSearchService(store)
            app.state.mongo_client = client
            app.state.catalog_store = store
            app.state.catalog_service = catalog
            app.state.search_service = search
            app.state.local_catalog = LocalCatalog(catalog)
            app.state.local_search = LocalSearch(search)

            _try_create_index(
                lambda: ensure_users_indexes(users=db[settings.mongo_users_collection_name]),
                label="users",
            )
            _try_create_index(
                lambda: ensure_guide_applications_indexes(
                    guide_applications=db[settings.mongo_guide_applications_collection_name],
                ),
                label="guide_applications",
            )
            _try_create_index(
                lambda: ensure_bookmarks_indexes(bookmarks=db[settings.mongo_bookmarks_collection_name]),
                label="bookmarks",
            )
            _try_create_index(
                lambda: ensure_accommodations_indexes(
                    accommodations=db[settings.mongo_accommodations_collection_name],
                ),
                label="accommodations",
            )
            _try_create_index(
                lambda: ensure_accommodation_bookings_indexes(
                    accommodation_bookings=db[settings.mongo_accommodation_bookings_collection_name],
                ),
                label="accommodation_bookings",
            )
            _try_create_index(
                lambda: ensure_inquiries_indexes(inquiries=db[settings.mongo_inquiries_collection_name]),
                label="inquiries",
            )
            _try_create_index(
                lambda: ensure_feature_notifications_indexes(
                    feature_notifications=db[settings.mongo_feature_notifications_collection_name],
                ),
                label="feature_notifications",
            )
            _ensure_guide_indexes(store)

        try:
            await asyncio.to_thread(_bootstrap)
            mongo_client = app.state.mongo_client
        except Exception as exc:
            logger.warning("Skipping Mongo bootstrap at startup: %s", exc)

    static_path = Path(__file__).resolve().parents[2] / settings.static_dir
    app.state.static_dir = static_path

    yield

    if mongo_client is not None:
        mongo_client.close()
