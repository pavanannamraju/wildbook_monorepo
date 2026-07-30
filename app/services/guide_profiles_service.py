from __future__ import annotations

import base64
from datetime import UTC, datetime
from typing import Any

from app.errors.http import UpstreamServiceError
from app.domain.guides.local_catalog import LocalCatalog
from app.models.guide_profile import (
    GuideProfileCreate,
    GuideProfileOptionsResponse,
    GuideProfileResponse,
    GuideRole,
    ReferenceItem,
)

# Self-onboarded guides are published and verified immediately so they appear in
# the experts directory right away. These are platform lifecycle flags, not
# values the guide enters, so they are set here rather than in the form.
_CATALOG_STATUS_PUBLISHED = "PUBLISHED"
_CATALOG_VERIFICATION_VERIFIED = "VERIFIED"


class GuideProfilesService:
    """Creates guides in the catalog service from the onboarding form.

    The form collects free-text languages, specializations, and a base location.
    Those names are resolved to catalog reference ids (creating new references for
    unknown names) before the guide is created, so the catalog stays the single
    source of truth and the sole validator of references.
    """

    def __init__(self, *, catalog_client: LocalCatalog) -> None:
        self._catalog = catalog_client

    async def get_options(self) -> GuideProfileOptionsResponse:
        references = await self._catalog.list_references(correlation_id=None)
        return GuideProfileOptionsResponse(
            focus_areas=self._to_reference_items(references.get("focus_areas")),
            certifications=self._to_reference_items(references.get("certifications")),
        )

    async def create(self, payload: GuideProfileCreate) -> GuideProfileResponse:
        primary_location_id = await self._resolve_single("locations", payload.base_location)
        language_ids = await self._resolve_ids("languages", payload.languages)
        expertise_ids = await self._resolve_ids("expertise", payload.specializations)

        guide_payload: dict[str, Any] = {
            "full_name": payload.full_name,
            "email": payload.email,
            "profile_image_url": None,
            "primary_location_id": primary_location_id,
            "location_base_description": payload.base_location,
            "language_ids": language_ids,
            "expertise_ids": expertise_ids,
            "role": payload.role.value,
            "years_of_experience": payload.years_of_experience,
            "status": _CATALOG_STATUS_PUBLISHED,
            "verification_status": _CATALOG_VERIFICATION_VERIFIED,
            "is_active": True,
        }
        if payload.bio:
            guide_payload["bio"] = {"summary": payload.bio}
        if payload.naturalist_profile is not None:
            guide_payload["naturalist_profile"] = {
                "focus_area_ids": payload.naturalist_profile.focus_area_ids,
                "certification_ids": payload.naturalist_profile.certification_ids,
                "summary": payload.naturalist_profile.summary,
            }

        created = await self._catalog.create_guide(payload=guide_payload, correlation_id=None)
        guide_id = str(created["guide_id"])

        has_photo = await self._maybe_upload_photo(guide_id, payload)

        return self._to_response(created, payload, guide_id=guide_id, has_photo=has_photo)

    async def _resolve_ids(self, kind: str, names: list[str]) -> list[str]:
        if not names:
            return []
        resolved = await self._catalog.resolve_references(
            kind=kind, names=names, correlation_id=None
        )
        return [item["id"] for item in resolved if isinstance(item, dict) and "id" in item]

    async def _resolve_single(self, kind: str, name: str) -> str:
        resolved = await self._resolve_ids(kind, [name])
        if not resolved:
            raise UpstreamServiceError(detail=f"Could not resolve {kind} reference: {name!r}.")
        return resolved[0]

    async def _maybe_upload_photo(self, guide_id: str, payload: GuideProfileCreate) -> bool:
        if payload.profile_photo_base64 is None or payload.profile_photo_content_type is None:
            return False

        raw = payload.profile_photo_base64
        if raw.startswith("data:"):
            _, _, raw = raw.partition(",")
        photo_bytes = base64.b64decode(raw, validate=True)

        await self._catalog.upload_guide_photo(
            guide_id=guide_id,
            content=photo_bytes,
            content_type=payload.profile_photo_content_type,
            correlation_id=None,
        )
        return True

    @staticmethod
    def _to_reference_items(raw: Any) -> list[ReferenceItem]:
        if not isinstance(raw, list):
            return []
        items: list[ReferenceItem] = []
        for entry in raw:
            if not isinstance(entry, dict):
                continue
            ref_id = entry.get("id")
            name = entry.get("name")
            if isinstance(ref_id, str) and isinstance(name, str):
                items.append(ReferenceItem(id=ref_id, name=name))
        return items

    @staticmethod
    def _to_response(
        created: dict[str, Any],
        payload: GuideProfileCreate,
        *,
        guide_id: str,
        has_photo: bool,
    ) -> GuideProfileResponse:
        now = datetime.now(UTC)
        return GuideProfileResponse(
            id=guide_id,
            full_name=payload.full_name,
            email=payload.email,
            role=GuideRole(payload.role),
            has_profile_photo=has_photo,
            created_at=created.get("created_at") or now,
            updated_at=created.get("updated_at") or now,
        )
