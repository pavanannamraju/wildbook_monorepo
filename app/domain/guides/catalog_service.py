from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import status
from pymongo.errors import DuplicateKeyError

from app.domain.guides.app_errors import AppError
from app.domain.guides.catalog_store import CatalogStore
from app.domain.guides.location_aliases import (
    canonicalize_location_id,
    canonical_location_display_name,
    resolve_canonical_location_from_name,
)
from app.domain.guides.schema import (
    CancellationPolicyTemplateResponse,
    CertificationRef,
    CreateOfferingRequest,
    CreatePolicyRequest,
    ExpertiseRef,
    FocusAreaRef,
    GuideCreate,
    GuideListResponse,
    GuideResponse,
    LanguageRef,
    LocationRef,
    NaturalistProfileResponse,
    OfferingResponse,
    UpdateOfferingRequest,
    UpdatePolicyRequest,
)
from app.domain.guides.search_fields import compute_search_fields

MIN_OFFERINGS_PER_GUIDE = 0
MAX_OFFERINGS_PER_GUIDE = 4


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _normalize_reference_name(name: str) -> str:
    return " ".join(name.split()).casefold()


def _slugify_reference_name(name: str) -> str:
    return "-".join(re.findall(r"[a-z0-9]+", name.casefold()))


# Reference kinds the BFF may resolve from free-text on guide creation. Each entry
# maps to its collection, the id prefix for new docs, and a builder for the
# kind-specific required fields (e.g. languages need a code, expertise a slug).
_RESOLVABLE_REFERENCES: dict[str, tuple[str, str, Any]] = {
    "languages": (
        "reference_languages",
        "lang",
        lambda name, slug: {"code": slug or name.casefold()},
    ),
    "expertise": (
        "reference_expertise",
        "exp",
        lambda name, slug: {"slug": slug or name.casefold(), "category": "custom"},
    ),
    "locations": (
        "reference_locations",
        "loc",
        lambda name, slug: {"city": name, "state": None, "country": None},
    ),
}


class CatalogService:
    def __init__(self, store: CatalogStore):
        self._store = store

    def refresh_search_fields(self, guide_id: str) -> None:
        guide = self._store.get_guide(guide_id)
        if not guide:
            return
        offerings = self._store.list_offerings(guide_id)
        try:
            hydrated = self._to_guide_response(guide).model_dump(mode="json")
        except AppError:
            hydrated = None
        fields = compute_search_fields(guide, offerings, hydrated_guide=hydrated)
        self._store.guides.update_one({"_id": guide_id}, {"$set": fields})

    def _require_guide(self, guide_id: str) -> dict[str, Any]:
        guide = self._store.get_guide(guide_id)
        if not guide:
            raise AppError(status.HTTP_404_NOT_FOUND, "GUIDE_NOT_FOUND", "Guide not found")
        return guide

    def _validate_reference_ids(
        self,
        collection_name: str,
        ids: list[str],
        error_code: str,
        label: str,
    ) -> dict[str, dict[str, Any]]:
        found = self._store.find_active_references(collection_name, ids)
        missing = sorted(set(ids) - set(found.keys()))
        if missing:
            raise AppError(
                status.HTTP_400_BAD_REQUEST,
                error_code,
                f"Invalid {label} id(s): {', '.join(missing)}",
            )
        return found

    def _validate_guide_references(self, guide: GuideCreate) -> None:
        self._validate_reference_ids(
            "reference_locations",
            [guide.primary_location_id],
            "INVALID_LOCATION_ID",
            "location",
        )
        self._validate_reference_ids(
            "reference_languages",
            guide.language_ids,
            "INVALID_LANGUAGE_ID",
            "language",
        )
        if guide.expertise_ids:
            self._validate_reference_ids(
                "reference_expertise",
                guide.expertise_ids,
                "INVALID_EXPERTISE_ID",
                "expertise",
            )
        if guide.naturalist_profile:
            self._validate_reference_ids(
                "reference_focus_areas",
                guide.naturalist_profile.focus_area_ids,
                "INVALID_FOCUS_AREA_ID",
                "focus area",
            )
            if guide.naturalist_profile.certification_ids:
                self._validate_reference_ids(
                    "reference_certifications",
                    guide.naturalist_profile.certification_ids,
                    "INVALID_CERTIFICATION_ID",
                    "certification",
                )

    def _build_guide_storage_payload(self, guide: GuideCreate, guide_id: str, now: datetime) -> dict[str, Any]:
        payload = guide.model_dump()
        if guide.naturalist_profile:
            payload["naturalist_profile"] = guide.naturalist_profile.model_dump()
        payload.update(
            {
                "_id": guide_id,
                "is_naturalist": guide.role == "NATURALIST",
                "created_at": now,
                "updated_at": now,
            }
        )
        return payload

    def _to_guide_response(self, doc: dict[str, Any]) -> GuideResponse:
        location_doc = self._store.get_active_reference(
            "reference_locations", doc["primary_location_id"]
        )
        if not location_doc:
            raise AppError(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                "BROKEN_REFERENCE",
                f"Location reference missing for guide {doc['_id']}",
            )

        language_docs = self._store.find_active_references(
            "reference_languages", doc.get("language_ids", [])
        )
        expertise_docs = self._store.find_active_references(
            "reference_expertise", doc.get("expertise_ids", [])
        )

        naturalist_response: NaturalistProfileResponse | None = None
        raw_naturalist = doc.get("naturalist_profile")
        if raw_naturalist:
            focus_docs = self._store.find_active_references(
                "reference_focus_areas", raw_naturalist.get("focus_area_ids", [])
            )
            cert_docs = self._store.find_active_references(
                "reference_certifications", raw_naturalist.get("certification_ids", [])
            )
            naturalist_response = NaturalistProfileResponse(
                focus_areas=[
                    FocusAreaRef(id=f["_id"], name=f["name"])
                    for f in focus_docs.values()
                ],
                certifications=[
                    CertificationRef(
                        id=c["_id"],
                        name=c["name"],
                        issuer=c.get("issuer"),
                    )
                    for c in cert_docs.values()
                ],
                years_field_experience=raw_naturalist.get("years_field_experience"),
                summary=raw_naturalist.get("summary"),
            )

        return GuideResponse(
            guide_id=doc["_id"],
            full_name=doc["full_name"],
            email=doc.get("email"),
            phone_number=doc.get("phone_number"),
            profile_image_url=doc.get("profile_image_url"),
            has_profile_photo=bool(doc.get("has_profile_photo")),
            primary_location_id=doc["primary_location_id"],
            location=LocationRef(
                id=location_doc["_id"],
                name=location_doc["name"],
                city=location_doc["city"],
                state=location_doc.get("state"),
                country=location_doc.get("country"),
                base_description=doc.get("location_base_description"),
            ),
            languages=[
                LanguageRef(id=l["_id"], code=l["code"], name=l["name"])
                for l in language_docs.values()
            ],
            expertise=[
                ExpertiseRef(id=e["_id"], slug=e["slug"], name=e["name"])
                for e in expertise_docs.values()
            ],
            role=doc["role"],
            years_of_experience=doc.get("years_of_experience", 0),
            naturalist_profile=naturalist_response,
            bio=doc.get("bio"),
            contact=doc.get("contact"),
            status=doc["status"],
            verification_status=doc["verification_status"],
            is_active=doc["is_active"],
            is_deleted=doc["is_deleted"],
            schema_version=doc["schema_version"],
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
            is_naturalist=doc.get("is_naturalist", doc["role"] == "NATURALIST"),
        )

    @staticmethod
    def _to_offering_response(doc: dict[str, Any]) -> OfferingResponse:
        return OfferingResponse(
            offering_id=doc["_id"],
            guide_id=doc["guide_id"],
            slug=doc.get("slug"),
            title=doc["title"],
            type=doc["type"],
            status=doc["status"],
            sort_order=doc.get("sort_order", 0),
            description=doc.get("description"),
            duration=doc["duration"],
            group_size=doc["group_size"],
            pricing=doc["pricing"],
            rating=doc.get("rating"),
            reviews_count=doc.get("reviews_count"),
            image_url=doc.get("image_url"),
            schema_version=doc.get("schema_version", 1),
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
        )

    @staticmethod
    def _to_policy_response(doc: dict[str, Any]) -> CancellationPolicyTemplateResponse:
        return CancellationPolicyTemplateResponse(
            policy_id=doc["_id"],
            guide_id=doc["guide_id"],
            policy_name=doc["policy_name"],
            version=doc["version"],
            user_cancellation_rules=doc["user_cancellation_rules"],
            guide_cancellation_rules=doc["guide_cancellation_rules"],
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
        )

    def create_guide(self, guide: GuideCreate) -> GuideResponse:
        self._validate_guide_references(guide)
        guide_id = str(uuid4())
        now = _now()
        payload = self._build_guide_storage_payload(guide, guide_id, now)
        try:
            self._store.insert_guide(payload)
        except DuplicateKeyError as exc:
            raise AppError(
                status.HTTP_409_CONFLICT,
                "GUIDE_EMAIL_CONFLICT",
                "Guide with the same email already exists",
            ) from exc
        self.refresh_search_fields(guide_id)
        return self._to_guide_response(self._store.get_guide(guide_id) or payload)

    def list_guides(
        self,
        *,
        role: str | None = None,
        primary_location_id: str | None = None,
        status: str | None = None,
        is_active: bool | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> GuideListResponse:
        docs = self._store.list_guides(
            role=role,
            primary_location_id=primary_location_id,
            status=status,
            is_active=is_active,
            limit=limit,
            offset=offset,
        )
        total = self._store.count_guides(
            role=role,
            primary_location_id=primary_location_id,
            status=status,
            is_active=is_active,
        )
        return GuideListResponse(
            items=[self._to_guide_response(doc) for doc in docs],
            total=total,
            limit=limit,
            offset=offset,
        )

    def get_guide_by_id(self, guide_id: str) -> GuideResponse:
        return self._to_guide_response(self._require_guide(guide_id))

    def get_guide_photo(self, guide_id: str) -> tuple[str, bytes]:
        self._require_guide(guide_id)
        photo = self._store.get_guide_photo(guide_id)
        if photo is None:
            raise AppError(
                status.HTTP_404_NOT_FOUND,
                "GUIDE_PHOTO_NOT_FOUND",
                "Guide profile photo not found.",
            )
        return photo

    def set_guide_photo(self, guide_id: str, *, photo_bytes: bytes, content_type: str) -> None:
        self._require_guide(guide_id)
        updated = self._store.set_guide_photo(
            guide_id,
            photo_bytes=photo_bytes,
            content_type=content_type,
            updated_at=_now(),
        )
        if not updated:
            raise AppError(status.HTTP_404_NOT_FOUND, "GUIDE_NOT_FOUND", "Guide not found")

    def list_references(self) -> dict[str, list[dict[str, Any]]]:
        collections = {
            "locations": "reference_locations",
            "languages": "reference_languages",
            "expertise": "reference_expertise",
            "focus_areas": "reference_focus_areas",
            "certifications": "reference_certifications",
        }
        result: dict[str, list[dict[str, Any]]] = {}
        for key, collection_name in collections.items():
            docs = self._store.list_active_references(collection_name)
            result[key] = [{**{k: v for k, v in doc.items() if k != "_id"}, "id": doc["_id"]} for doc in docs]
        return result

    def list_published_filter_options(self) -> dict[str, list[dict[str, str]]]:
        """Filter choices derived from published guides only (full catalog, not filtered subset)."""
        raw_location_ids = [
            value
            for value in self._store.distinct_published_guide_values("primary_location_id")
            if isinstance(value, str) and value
        ]
        language_ids = [
            value
            for value in self._store.distinct_published_guide_values("language_ids")
            if isinstance(value, str) and value
        ]
        expertise_ids = [
            value
            for value in self._store.distinct_published_guide_values("expertise_ids")
            if isinstance(value, str) and value
        ]

        location_docs = self._store.find_references_by_ids("reference_locations", raw_location_ids)
        language_docs = self._store.find_references_by_ids("reference_languages", language_ids)
        expertise_docs = self._store.find_references_by_ids("reference_expertise", expertise_ids)

        locations_by_canonical: dict[str, dict[str, str]] = {}
        for location_id in raw_location_ids:
            canonical_id = canonicalize_location_id(location_id) or location_id
            if canonical_id in locations_by_canonical:
                continue
            source = location_docs.get(canonical_id) or location_docs.get(location_id) or {}
            display_name = canonical_location_display_name(
                canonical_id,
                fallback_name=str(source.get("name", "")) if source else None,
            )
            if not display_name:
                continue
            locations_by_canonical[canonical_id] = {"id": canonical_id, "name": display_name}

        languages = [
            {"id": doc_id, "name": str(doc["name"])}
            for doc_id, doc in language_docs.items()
            if isinstance(doc.get("name"), str) and doc["name"]
        ]
        expertise = [
            {"id": doc_id, "name": str(doc["name"])}
            for doc_id, doc in expertise_docs.items()
            if isinstance(doc.get("name"), str) and doc["name"]
        ]

        return {
            "locations": sorted(locations_by_canonical.values(), key=lambda item: item["name"].casefold()),
            "languages": sorted(languages, key=lambda item: item["name"].casefold()),
            "expertise": sorted(expertise, key=lambda item: item["name"].casefold()),
        }

    def resolve_references(self, kind: str, names: list[str]) -> list[dict[str, str]]:
        """Map free-text names to reference ids, creating any that don't exist.

        Matching is case- and whitespace-insensitive so "Birding" and "birding "
        resolve to the same reference instead of creating duplicates.
        Location aliases (e.g. Bangalore → Bengaluru) resolve to the canonical id.
        """
        spec = _RESOLVABLE_REFERENCES.get(kind)
        if spec is None:
            raise AppError(
                status.HTTP_400_BAD_REQUEST,
                "INVALID_REFERENCE_KIND",
                f"Cannot resolve references of kind '{kind}'.",
            )
        collection_name, id_prefix, extra_fields_builder = spec

        existing = self._store.list_active_references(collection_name)
        by_normalized: dict[str, dict[str, Any]] = {
            _normalize_reference_name(doc.get("name", "")): doc for doc in existing
        }

        resolved: list[dict[str, str]] = []
        seen_normalized: set[str] = set()
        for raw_name in names:
            display_name = " ".join(str(raw_name).split())
            if not display_name:
                continue
            normalized = _normalize_reference_name(display_name)
            if normalized in seen_normalized:
                continue
            seen_normalized.add(normalized)

            if kind == "locations":
                alias_match = resolve_canonical_location_from_name(display_name)
                if alias_match is not None:
                    canonical_id, canonical_name = alias_match
                    existing_canonical = self._store.find_references_by_ids(
                        collection_name, [canonical_id]
                    ).get(canonical_id)
                    if existing_canonical is not None:
                        resolved.append({"id": canonical_id, "name": str(existing_canonical.get("name", canonical_name))})
                    else:
                        resolved.append({"id": canonical_id, "name": canonical_name})
                    continue

            match = by_normalized.get(normalized)
            if match is not None:
                resolved.append({"id": match["_id"], "name": match["name"]})
                continue

            new_doc = self._build_reference_doc(
                collection_name, id_prefix, display_name, normalized, extra_fields_builder
            )
            self._store.insert_reference(collection_name, new_doc)
            by_normalized[normalized] = new_doc
            resolved.append({"id": new_doc["_id"], "name": new_doc["name"]})

        return resolved

    def _build_reference_doc(
        self,
        collection_name: str,
        id_prefix: str,
        display_name: str,
        normalized: str,
        extra_fields_builder: Any,
    ) -> dict[str, Any]:
        slug = _slugify_reference_name(display_name)
        candidate_id = f"{id_prefix}-{slug}" if slug else f"{id_prefix}-{uuid4().hex[:8]}"
        if self._store.reference_id_exists(collection_name, candidate_id):
            candidate_id = f"{candidate_id}-{uuid4().hex[:6]}"
        now = _now()
        return {
            "_id": candidate_id,
            "name": display_name,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
            **extra_fields_builder(display_name, slug),
        }

    def _offering_count(self, guide_id: str) -> int:
        return self._store.count_offerings(guide_id)

    def create_offering(self, guide_id: str, request: CreateOfferingRequest) -> OfferingResponse:
        self._require_guide(guide_id)
        if self._offering_count(guide_id) >= MAX_OFFERINGS_PER_GUIDE:
            raise AppError(
                status.HTTP_409_CONFLICT,
                "OFFERING_LIMIT_EXCEEDED",
                f"A guide may have at most {MAX_OFFERINGS_PER_GUIDE} offerings",
            )
        offering_id = str(uuid4())
        now = _now()
        payload = request.model_dump()
        payload.update(
            {
                "_id": offering_id,
                "guide_id": guide_id,
                "is_deleted": False,
                "created_at": now,
                "updated_at": now,
            }
        )
        try:
            self._store.insert_offering(payload)
        except DuplicateKeyError as exc:
            raise AppError(
                status.HTTP_409_CONFLICT,
                "OFFERING_CONFLICT",
                "Offering conflict detected for this guide",
            ) from exc
        self.refresh_search_fields(guide_id)
        return self._to_offering_response(payload)

    def list_offerings_by_guide(self, guide_id: str) -> list[OfferingResponse]:
        self._require_guide(guide_id)
        return [self._to_offering_response(doc) for doc in self._store.list_offerings(guide_id)]

    def get_offering_by_id(self, guide_id: str, offering_id: str) -> OfferingResponse:
        self._require_guide(guide_id)
        doc = self._store.get_offering(guide_id, offering_id)
        if not doc:
            raise AppError(status.HTTP_404_NOT_FOUND, "OFFERING_NOT_FOUND", "Offering not found")
        return self._to_offering_response(doc)

    def update_offering(
        self, guide_id: str, offering_id: str, request: UpdateOfferingRequest
    ) -> OfferingResponse:
        self._require_guide(guide_id)
        existing = self._store.get_offering(guide_id, offering_id)
        if not existing:
            raise AppError(status.HTTP_404_NOT_FOUND, "OFFERING_NOT_FOUND", "Offering not found")

        update_data = request.model_dump(exclude_unset=True, exclude_none=True)
        if not update_data:
            raise AppError(
                status.HTTP_400_BAD_REQUEST,
                "EMPTY_UPDATE",
                "At least one field must be provided for update",
            )
        update_data["updated_at"] = _now()
        try:
            self._store.update_offering(offering_id, update_data)
        except DuplicateKeyError as exc:
            raise AppError(
                status.HTTP_409_CONFLICT,
                "OFFERING_CONFLICT",
                "Offering update conflicts with existing data",
            ) from exc
        updated = self._store.get_offering(guide_id, offering_id)
        self.refresh_search_fields(guide_id)
        return self._to_offering_response(updated)

    def delete_offering(self, guide_id: str, offering_id: str) -> None:
        self._require_guide(guide_id)
        if MIN_OFFERINGS_PER_GUIDE > 0 and self._offering_count(guide_id) <= MIN_OFFERINGS_PER_GUIDE:
            raise AppError(
                status.HTTP_409_CONFLICT,
                "OFFERING_MINIMUM_REQUIRED",
                f"A guide must keep at least {MIN_OFFERINGS_PER_GUIDE} offerings",
            )
        matched = self._store.soft_delete_offering(guide_id, offering_id, _now())
        if matched == 0:
            raise AppError(status.HTTP_404_NOT_FOUND, "OFFERING_NOT_FOUND", "Offering not found")
        self.refresh_search_fields(guide_id)

    def create_policy_template(
        self, guide_id: str, request: CreatePolicyRequest
    ) -> CancellationPolicyTemplateResponse:
        self._require_guide(guide_id)
        now = _now()
        policy_id = str(uuid4())
        latest = self._store.latest_policy_by_name(guide_id, request.policy_name)
        version = (latest["version"] + 1) if latest else 1
        payload = request.model_dump()
        payload.update(
            {
                "_id": policy_id,
                "guide_id": guide_id,
                "version": version,
                "is_deleted": False,
                "schema_version": 1,
                "created_at": now,
                "updated_at": now,
            }
        )
        try:
            self._store.insert_policy(payload)
        except DuplicateKeyError as exc:
            raise AppError(
                status.HTTP_409_CONFLICT,
                "POLICY_CONFLICT",
                "Policy conflict detected for this guide",
            ) from exc
        return self._to_policy_response(payload)

    def list_policies_by_guide(self, guide_id: str) -> list[CancellationPolicyTemplateResponse]:
        self._require_guide(guide_id)
        return [self._to_policy_response(doc) for doc in self._store.list_policies(guide_id)]

    def get_policy_by_id(self, guide_id: str, policy_id: str) -> CancellationPolicyTemplateResponse:
        self._require_guide(guide_id)
        doc = self._store.get_policy(guide_id, policy_id)
        if not doc:
            raise AppError(status.HTTP_404_NOT_FOUND, "POLICY_NOT_FOUND", "Policy not found")
        return self._to_policy_response(doc)

    def update_policy(
        self, guide_id: str, policy_id: str, request: UpdatePolicyRequest
    ) -> CancellationPolicyTemplateResponse:
        self._require_guide(guide_id)
        existing = self._store.get_policy(guide_id, policy_id)
        if not existing:
            raise AppError(status.HTTP_404_NOT_FOUND, "POLICY_NOT_FOUND", "Policy not found")

        update_data = request.model_dump(exclude_unset=True, exclude_none=True)
        if not update_data:
            raise AppError(
                status.HTTP_400_BAD_REQUEST,
                "EMPTY_UPDATE",
                "At least one field must be provided for update",
            )
        update_data["updated_at"] = _now()
        try:
            self._store.update_policy(policy_id, update_data)
        except DuplicateKeyError as exc:
            raise AppError(
                status.HTTP_409_CONFLICT,
                "POLICY_CONFLICT",
                "Policy update conflicts with existing data",
            ) from exc
        updated = self._store.get_policy(guide_id, policy_id)
        return self._to_policy_response(updated)

    def delete_policy(self, guide_id: str, policy_id: str) -> None:
        self._require_guide(guide_id)
        matched = self._store.soft_delete_policy(guide_id, policy_id, _now())
        if matched == 0:
            raise AppError(status.HTTP_404_NOT_FOUND, "POLICY_NOT_FOUND", "Policy not found")
