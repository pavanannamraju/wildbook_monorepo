from __future__ import annotations

from typing import Any

from pymongo.collection import Collection


def ensure_users_indexes(*, users: Collection[dict[str, Any]]) -> None:
    users.create_index([("email", 1)], unique=True, name="uniq_email")


def ensure_guide_applications_indexes(*, guide_applications: Collection[dict[str, Any]]) -> None:
    guide_applications.create_index(
        [("email", 1), ("status", 1)],
        name="by_email_status",
    )


def ensure_bookmarks_indexes(*, bookmarks: Collection[dict[str, Any]]) -> None:
    bookmarks.create_index(
        [("user_id", 1), ("type", 1), ("target_id", 1)],
        unique=True,
        name="uniq_user_type_target",
    )


def ensure_accommodations_indexes(*, accommodations: Collection[dict[str, Any]]) -> None:
    accommodations.create_index([("slug", 1)], unique=True, name="uniq_slug")
    accommodations.create_index(
        [("status", 1), ("is_active", 1), ("primary_location_id", 1), ("rating_avg", -1), ("_id", 1)],
        name="list_by_location_sort_rating",
    )
    accommodations.create_index([("provider_ref.type", 1), ("provider_ref.id", 1)], name="by_provider_ref")
    accommodations.create_index([("expert_id", 1)], sparse=True, name="by_expert_id")


def ensure_accommodation_bookings_indexes(*, accommodation_bookings: Collection[dict[str, Any]]) -> None:
    accommodation_bookings.create_index(
        [("accommodation_id", 1), ("check_in", 1), ("check_out", 1)],
        name="by_accommodation_dates",
    )
    accommodation_bookings.create_index([("status", 1), ("created_at", -1)], name="ops_queue")
    accommodation_bookings.create_index(
        [("provider_ref.type", 1), ("provider_ref.id", 1), ("status", 1)],
        name="provider_dashboard",
    )


def ensure_inquiries_indexes(*, inquiries: Collection[dict[str, Any]]) -> None:
    inquiries.create_index(
        [("expert_id", 1), ("status", 1), ("created_at", -1), ("_id", -1)],
        name="by_expert_status_created",
    )
    inquiries.create_index([("customer_email", 1), ("created_at", -1)], name="by_email_created")
    inquiries.create_index([("status", 1), ("priority", 1), ("created_at", -1)], name="support_queue")


def ensure_feature_notifications_indexes(*, feature_notifications: Collection[dict[str, Any]]) -> None:
    feature_notifications.create_index(
        [("email", 1), ("feature", 1)],
        unique=True,
        name="uniq_email_feature",
    )
    feature_notifications.create_index([("feature", 1), ("created_at", -1)], name="by_feature_created")


def ensure_guide_profiles_indexes(*, guide_profiles: Collection[dict[str, Any]]) -> None:
    guide_profiles.create_index([("status", 1), ("created_at", -1)], name="by_status_created")
    guide_profiles.create_index([("full_name", 1)], name="by_full_name")


def ensure_analytics_events_indexes(*, analytics_events: Collection[dict[str, Any]]) -> None:
    analytics_events.create_index([("ts", -1)], name="by_ts")
    analytics_events.create_index([("anonymous_id", 1), ("ts", -1)], name="by_anonymous_ts")
    analytics_events.create_index([("user_id", 1), ("ts", -1)], name="by_user_ts")
    analytics_events.create_index([("event", 1), ("ts", -1)], name="by_event_ts")
    analytics_events.create_index([("geo.country", 1), ("ts", -1)], name="by_country_ts")
    analytics_events.create_index([("geo.state", 1), ("ts", -1)], name="by_state_ts")


def ensure_analytics_identities_indexes(*, analytics_identities: Collection[dict[str, Any]]) -> None:
    analytics_identities.create_index([("anonymous_id", 1)], unique=True, name="uniq_anonymous_id")
    analytics_identities.create_index([("user_id", 1), ("last_seen_at", -1)], name="by_user_last_seen")
