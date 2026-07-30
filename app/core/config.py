from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parents[2] / ".env"),
        extra="ignore",
    )

    app_name: str = "Wildbook v1"
    app_env: str = "local"
    api_prefix: str = "/api/v1"
    bff_api_prefix: str = "/api"
    log_level: str = "INFO"
    request_id_header: str = "X-Request-ID"
    host: str = "127.0.0.1"
    port: int = 8000

    mongo_uri: str | None = None
    mongo_database_name: str = "wildbook_v1"
    mongo_maps_data_database_name: str | None = None
    mongo_maps_data_collection_name: str | None = None
    mongo_accommodations_collection_name: str = "accommodations"
    mongo_accomodation_providers_collection_name: str = "accomodation_providers"
    mongo_accommodation_bookings_collection_name: str = "accommodation_bookings"
    mongo_users_collection_name: str = "users"
    mongo_guide_applications_collection_name: str = "guide_applications"
    mongo_bookmarks_collection_name: str = "bookmarks"
    mongo_inquiries_collection_name: str = "inquiries"

    firebase_project_id: str | None = None
    auth_required: bool = True
    auth_admin_google_emails: list[str] = []

    # Built SPA directory relative to wildbook_v1 root
    static_dir: str = "static"

    min_offerings_per_guide: int = 0
    max_offerings_per_guide: int = 4


def get_settings() -> Settings:
    return Settings()
