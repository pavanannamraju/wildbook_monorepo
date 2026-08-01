from __future__ import annotations

from enum import StrEnum


class PublishStatus(StrEnum):
    draft = "draft"
    published = "published"
    archived = "archived"


class Role(StrEnum):
    guide = "guide"
    naturalist = "naturalist"


class ExperienceType(StrEnum):
    walk = "walk"
    safari = "safari"
    retreat = "retreat"
    workshop = "workshop"


class DurationUnit(StrEnum):
    minutes = "minutes"
    hours = "hours"
    days = "days"


class Currency(StrEnum):
    INR = "INR"
    USD = "USD"


class PricingPer(StrEnum):
    person = "person"
    group = "group"


class ContactPlatform(StrEnum):
    Wildbook = "Wildbook"


class ResponseTime(StrEnum):
    within_1_hour = "within_1_hour"
    within_24_hours = "within_24_hours"
    within_48_hours = "within_48_hours"


class InquiryStatus(StrEnum):
    new = "new"
    triaged = "triaged"
    in_progress = "in_progress"
    waiting_customer = "waiting_customer"
    resolved = "resolved"
    closed = "closed"
    spam = "spam"


class InquiryPriority(StrEnum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"


class InquiryDatesPreference(StrEnum):
    fixed = "fixed"
    flexible = "flexible"


class ProviderRefType(StrEnum):
    expert = "expert"
    provider = "provider"


class ProviderType(StrEnum):
    homestay_host = "homestay_host"
    lodge_operator = "lodge_operator"
    community_partner = "community_partner"


class VerificationStatus(StrEnum):
    unverified = "unverified"
    pending = "pending"
    verified = "verified"


class AccommodationPricingPer(StrEnum):
    person = "person"
    room = "room"
    night = "night"


class BookingStatus(StrEnum):
    pending = "pending"
    confirmed = "confirmed"
    declined = "declined"
    cancelled = "cancelled"


class PaymentStatus(StrEnum):
    offline_pending = "offline_pending"
    paid_offline = "paid_offline"
    waived = "waived"

