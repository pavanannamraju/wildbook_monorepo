from __future__ import annotations

from datetime import UTC, datetime, time
from typing import Any

from bson import ObjectId
from pymongo.collection import Collection

from app.errors.http import BadRequestError, ForbiddenError, NotFoundError
from app.models.auth import (
    ALLOWED_PRESET_AVATAR_KEYS,
    AdminCreateUserRequest,
    AuthPrincipal,
    AuthProvider,
    AvatarType,
    AvatarUpdateRequest,
    CurrentUserResponse,
    EmailSignupProfileUpsertRequest,
    GuideApplicationCreate,
    GuideApplicationResponse,
    GuideApplicationReviewRequest,
    GuideApplicationStatus,
    ProfileDetailsUpdateRequest,
    TravelExperienceLevel,
    UserRole,
)


def _utcnow() -> datetime:
    return datetime.now(UTC)


class AuthzService:
    def __init__(
        self,
        *,
        users: Collection[dict[str, Any]],
        guide_applications: Collection[dict[str, Any]],
        admin_google_emails: set[str],
    ) -> None:
        self._users = users
        self._guide_applications = guide_applications
        self._admin_google_emails = {value.strip().lower() for value in admin_google_emails if value.strip()}

    def _provider_from_claims(self, claims: dict[str, object]) -> AuthProvider:
        firebase_claim = claims.get("firebase")
        if isinstance(firebase_claim, dict):
            sign_in_provider = firebase_claim.get("sign_in_provider")
            if sign_in_provider == "google.com":
                return AuthProvider.GOOGLE
        return AuthProvider.EMAIL

    def _normalize_email(self, email: str) -> str:
        return email.strip().lower()

    def _serialize_user(self, doc: dict[str, Any], *, principal: AuthPrincipal) -> CurrentUserResponse:
        date_of_birth = doc.get("date_of_birth")
        raw_avatar_type = doc.get("avatar_type")
        avatar_type: AvatarType | None = None
        if raw_avatar_type in {AvatarType.preset.value, AvatarType.custom.value}:
            avatar_type = AvatarType(str(raw_avatar_type))
        return CurrentUserResponse(
            id=str(doc["_id"]),
            uid=principal.uid,
            email=str(doc["email"]),
            full_name=str(doc["full_name"]) if doc.get("full_name") else None,
            phone_number=str(doc["phone_number"]) if doc.get("phone_number") else None,
            role=UserRole(str(doc["role"])),
            is_active=bool(doc["is_active"]),
            profile_completed=bool(doc.get("profile_completed", False)),
            auth_provider=AuthProvider(str(doc["auth_provider"])),
            bio=str(doc["bio"]) if doc.get("bio") else None,
            date_of_birth=date_of_birth.date() if isinstance(date_of_birth, datetime) else None,
            gender=str(doc["gender"]) if doc.get("gender") else None,
            location_city=str(doc["location_city"]) if doc.get("location_city") else None,
            location_country=str(doc["location_country"]) if doc.get("location_country") else None,
            interests=[str(item) for item in doc.get("interests") or []],
            preferred_languages=[str(item) for item in doc.get("preferred_languages") or []],
            experience_level=(
                TravelExperienceLevel(str(doc["experience_level"])) if doc.get("experience_level") else None
            ),
            emergency_contact_name=str(doc["emergency_contact_name"]) if doc.get("emergency_contact_name") else None,
            emergency_contact_phone=(
                str(doc["emergency_contact_phone"]) if doc.get("emergency_contact_phone") else None
            ),
            avatar_type=avatar_type,
            avatar_key=str(doc["avatar_key"]) if doc.get("avatar_key") else None,
            avatar_url=str(doc["avatar_url"]) if doc.get("avatar_url") else None,
            avatar_source_url=str(doc["avatar_source_url"]) if doc.get("avatar_source_url") else None,
        )

    def get_or_provision_user(self, *, principal: AuthPrincipal) -> CurrentUserResponse:
        if principal.email is None:
            raise ForbiddenError(detail="Token is missing email. Email is required for login.")

        email = self._normalize_email(principal.email)
        provider = self._provider_from_claims(principal.claims)
        now = _utcnow()

        user = self._users.find_one({"email": email})
        if user is None:
            role = UserRole.USER
            claim_name = principal.claims.get("name")
            full_name = claim_name.strip() if isinstance(claim_name, str) and claim_name.strip() else None
            if provider == AuthProvider.GOOGLE and email in self._admin_google_emails:
                role = UserRole.ADMIN
            user_doc: dict[str, Any] = {
                "firebase_uid": principal.uid,
                "email": email,
                "full_name": full_name,
                "phone_number": None,
                "auth_provider": provider.value,
                "password_hash": None if provider == AuthProvider.GOOGLE else "",
                "role": role.value,
                "is_active": True,
                "profile_completed": full_name is not None,
                "created_at": now,
                "updated_at": now,
            }
            inserted = self._users.insert_one(user_doc)
            user_doc["_id"] = inserted.inserted_id
            return self._serialize_user(user_doc, principal=principal)

        updates: dict[str, Any] = {"updated_at": now}
        if user.get("firebase_uid") != principal.uid:
            updates["firebase_uid"] = principal.uid
        if user.get("auth_provider") != provider.value:
            updates["auth_provider"] = provider.value
        if (
            provider == AuthProvider.GOOGLE
            and email in self._admin_google_emails
            and user.get("role") != UserRole.ADMIN.value
        ):
            updates["role"] = UserRole.ADMIN.value
        if updates:
            self._users.update_one({"_id": user["_id"]}, {"$set": updates})
            user.update(updates)

        if not bool(user.get("is_active", False)):
            raise ForbiddenError(detail="Your account is inactive. Contact an administrator.")

        return self._serialize_user(user, principal=principal)

    def ensure_role(self, user: CurrentUserResponse, allowed_roles: set[UserRole]) -> None:
        if user.role not in allowed_roles:
            readable_roles = ", ".join(sorted(role.value for role in allowed_roles))
            raise ForbiddenError(detail=f"Access denied. Allowed roles: {readable_roles}.")

    def create_guide_application(self, *, payload: GuideApplicationCreate) -> GuideApplicationResponse:
        email = self._normalize_email(payload.email)
        existing = self._guide_applications.find_one({"email": email, "status": GuideApplicationStatus.PENDING.value})
        if existing is not None:
            raise BadRequestError(detail="A pending guide application already exists for this email.")

        now = _utcnow()
        doc = {
            "fullname": payload.fullname.strip(),
            "location": payload.location.strip(),
            "profession": payload.profession.strip(),
            "contact_number": payload.contact_number.strip(),
            "email": email,
            "status": GuideApplicationStatus.PENDING.value,
            "reviewed_by": None,
            "created_at": now,
            "reviewed_at": None,
        }
        inserted = self._guide_applications.insert_one(doc)
        doc["_id"] = inserted.inserted_id
        return self._serialize_guide_application(doc)

    def list_guide_applications(self, *, status: GuideApplicationStatus | None) -> list[GuideApplicationResponse]:
        query: dict[str, Any] = {}
        if status is not None:
            query["status"] = status.value
        cursor = self._guide_applications.find(query).sort("created_at", -1)
        return [self._serialize_guide_application(item) for item in cursor]

    def review_guide_application(
        self,
        *,
        application_id: str,
        review: GuideApplicationReviewRequest,
        admin_user: CurrentUserResponse,
    ) -> GuideApplicationResponse:
        if not ObjectId.is_valid(application_id):
            raise NotFoundError(detail="Guide application not found.")

        existing = self._guide_applications.find_one({"_id": ObjectId(application_id)})
        if existing is None:
            raise NotFoundError(detail="Guide application not found.")

        now = _utcnow()
        update_doc: dict[str, Any] = {
            "status": review.status.value,
            "reviewed_by": admin_user.id,
            "reviewed_at": now,
        }
        self._guide_applications.update_one({"_id": existing["_id"]}, {"$set": update_doc})
        existing.update(update_doc)

        if review.status == GuideApplicationStatus.APPROVED:
            email = self._normalize_email(review.email or str(existing["email"]))
            provider = review.auth_provider or AuthProvider.EMAIL
            self._users.update_one(
                {"email": email},
                {
                    "$set": {
                        "email": email,
                        "auth_provider": provider.value,
                        "role": UserRole.GUIDE.value,
                        "is_active": True,
                        "updated_at": now,
                    },
                    "$setOnInsert": {
                        "password_hash": "",
                        "created_at": now,
                    },
                },
                upsert=True,
            )

        return self._serialize_guide_application(existing)

    def create_admin_user(self, *, payload: AdminCreateUserRequest) -> CurrentUserResponse:
        if payload.role != UserRole.ADMIN:
            raise BadRequestError(detail="Admin creation endpoint can only create ADMIN users.")
        now = _utcnow()
        email = self._normalize_email(payload.email)
        self._users.update_one(
            {"email": email},
            {
                "$set": {
                    "email": email,
                    "full_name": None,
                    "phone_number": None,
                    "auth_provider": payload.auth_provider.value,
                    "role": UserRole.ADMIN.value,
                    "is_active": payload.is_active,
                    "profile_completed": False,
                    "updated_at": now,
                },
                "$setOnInsert": {
                    "password_hash": "",
                    "created_at": now,
                },
            },
            upsert=True,
        )
        principal = AuthPrincipal(uid=f"admin-bootstrap:{email}", email=email, claims={})
        user = self._users.find_one({"email": email})
        if user is None:
            raise NotFoundError(detail="Failed to upsert admin user.")
        return self._serialize_user(user, principal=principal)

    def upsert_email_signup_profile(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: EmailSignupProfileUpsertRequest,
    ) -> CurrentUserResponse:
        if current_user.auth_provider != AuthProvider.EMAIL:
            raise BadRequestError(detail="Email signup profile can only be updated for EMAIL accounts.")

        now = _utcnow()
        phone_number = payload.phone_number.strip() if payload.phone_number else None
        self._users.update_one(
            {"_id": ObjectId(current_user.id)},
            {
                "$set": {
                    "full_name": payload.full_name.strip(),
                    "phone_number": phone_number,
                    "profile_completed": True,
                    "updated_at": now,
                }
            },
        )
        updated = self._users.find_one({"_id": ObjectId(current_user.id)})
        if updated is None:
            raise NotFoundError(detail="User not found after profile update.")
        principal = AuthPrincipal(uid=current_user.uid, email=current_user.email, claims={})
        return self._serialize_user(updated, principal=principal)

    def update_profile_details(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: ProfileDetailsUpdateRequest,
    ) -> CurrentUserResponse:
        now = _utcnow()
        provided = payload.model_dump(exclude_unset=True)
        date_of_birth = (
            datetime.combine(payload.date_of_birth, time.min, tzinfo=UTC) if payload.date_of_birth else None
        )
        updates: dict[str, Any] = {
            "bio": payload.bio.strip() if payload.bio else None,
            "date_of_birth": date_of_birth,
            "gender": payload.gender.strip() if payload.gender else None,
            "location_city": payload.location_city.strip() if payload.location_city else None,
            "location_country": payload.location_country.strip() if payload.location_country else None,
            "interests": payload.interests,
            "preferred_languages": payload.preferred_languages,
            "experience_level": payload.experience_level.value if payload.experience_level else None,
            "emergency_contact_name": (
                payload.emergency_contact_name.strip() if payload.emergency_contact_name else None
            ),
            "emergency_contact_phone": (
                payload.emergency_contact_phone.strip() if payload.emergency_contact_phone else None
            ),
            "updated_at": now,
        }
        if "phone_number" in provided:
            updates["phone_number"] = payload.phone_number.strip() if payload.phone_number else None
        self._users.update_one(
            {"_id": ObjectId(current_user.id)},
            {"$set": updates},
        )
        updated = self._users.find_one({"_id": ObjectId(current_user.id)})
        if updated is None:
            raise NotFoundError(detail="User not found after profile update.")
        principal = AuthPrincipal(uid=current_user.uid, email=current_user.email, claims={})
        return self._serialize_user(updated, principal=principal)

    def update_avatar(
        self,
        *,
        current_user: CurrentUserResponse,
        payload: AvatarUpdateRequest,
    ) -> CurrentUserResponse:
        if payload.avatar_type == AvatarType.preset:
            key = (payload.avatar_key or "").strip()
            if key not in ALLOWED_PRESET_AVATAR_KEYS:
                raise BadRequestError(detail="Unknown preset avatar key.")
            avatar_fields: dict[str, Any] = {
                "avatar_type": AvatarType.preset.value,
                "avatar_key": key,
                "avatar_url": None,
                "avatar_source_url": None,
            }
        else:
            url = (payload.avatar_url or "").strip()
            if not url:
                raise BadRequestError(detail="Custom avatar requires an avatar_url.")
            if not url.startswith("data:image/"):
                raise BadRequestError(detail="Custom avatar must be a base64 data URI (data:image/...).")
            if ";base64," not in url:
                raise BadRequestError(detail="Custom avatar must include base64-encoded image data.")
            source = (payload.avatar_source_url or "").strip() or None
            if source is not None:
                if not source.startswith("data:image/") or ";base64," not in source:
                    raise BadRequestError(
                        detail="Custom avatar source must be a base64 data URI (data:image/...)."
                    )
            avatar_fields = {
                "avatar_type": AvatarType.custom.value,
                "avatar_key": None,
                "avatar_url": url,
                "avatar_source_url": source,
            }

        now = _utcnow()
        self._users.update_one(
            {"_id": ObjectId(current_user.id)},
            {"$set": {**avatar_fields, "updated_at": now}},
        )
        updated = self._users.find_one({"_id": ObjectId(current_user.id)})
        if updated is None:
            raise NotFoundError(detail="User not found after avatar update.")
        principal = AuthPrincipal(uid=current_user.uid, email=current_user.email, claims={})
        return self._serialize_user(updated, principal=principal)

    def _serialize_guide_application(self, doc: dict[str, Any]) -> GuideApplicationResponse:
        return GuideApplicationResponse(
            id=str(doc["_id"]),
            fullname=str(doc["fullname"]),
            location=str(doc["location"]),
            profession=str(doc["profession"]),
            contact_number=str(doc["contact_number"]),
            email=str(doc["email"]),
            status=GuideApplicationStatus(str(doc["status"])),
            reviewed_by=str(doc["reviewed_by"]) if doc.get("reviewed_by") else None,
            created_at=doc["created_at"],
            reviewed_at=doc.get("reviewed_at"),
        )
