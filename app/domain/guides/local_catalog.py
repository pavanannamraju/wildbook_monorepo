from __future__ import annotations

import asyncio
from typing import Any

from app.domain.guides.app_errors import AppError
from app.domain.guides.catalog_service import CatalogService
from app.domain.guides.schema import GuideCreate
from app.errors.http import NotFoundError, UpstreamServiceError


def _raise_from_app_error(exc: AppError) -> None:
    if exc.status_code == 404:
        raise NotFoundError(detail=exc.message) from exc
    raise UpstreamServiceError(detail=f"{exc.code}: {exc.message}") from exc


class LocalCatalog:
    """In-process catalog adapter with the same surface as the former HTTP client."""

    def __init__(self, catalog: CatalogService):
        self._catalog = catalog

    async def list_guides(
        self,
        *,
        correlation_id: str | None,
        status: str | None = None,
        is_active: bool | None = None,
        role: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> dict[str, Any]:
        def _run() -> dict[str, Any]:
            result = self._catalog.list_guides(
                status=status,
                is_active=is_active,
                role=role,
                limit=limit,
                offset=offset,
            )
            return result.model_dump(mode="json")

        return await asyncio.to_thread(_run)

    async def get_guide(self, *, guide_id: str, correlation_id: str | None) -> dict[str, Any]:
        def _run() -> dict[str, Any]:
            try:
                return self._catalog.get_guide_by_id(guide_id).model_dump(mode="json")
            except AppError as exc:
                _raise_from_app_error(exc)
                raise

        return await asyncio.to_thread(_run)

    async def list_offerings(
        self, *, guide_id: str, correlation_id: str | None
    ) -> list[dict[str, Any]]:
        def _run() -> list[dict[str, Any]]:
            try:
                return [
                    item.model_dump(mode="json")
                    for item in self._catalog.list_offerings_by_guide(guide_id)
                ]
            except AppError as exc:
                _raise_from_app_error(exc)
                raise

        return await asyncio.to_thread(_run)

    async def list_references(self, *, correlation_id: str | None) -> dict[str, Any]:
        return await asyncio.to_thread(self._catalog.list_references)

    async def list_published_filter_options(self, *, correlation_id: str | None) -> dict[str, Any]:
        return await asyncio.to_thread(self._catalog.list_published_filter_options)

    async def resolve_references(
        self, *, kind: str, names: list[str], correlation_id: str | None
    ) -> list[dict[str, str]]:
        def _run() -> list[dict[str, str]]:
            try:
                return self._catalog.resolve_references(kind, names)
            except AppError as exc:
                _raise_from_app_error(exc)
                raise

        return await asyncio.to_thread(_run)

    async def create_guide(
        self, *, payload: dict[str, Any], correlation_id: str | None
    ) -> dict[str, Any]:
        def _run() -> dict[str, Any]:
            try:
                guide = GuideCreate.model_validate(payload)
                return self._catalog.create_guide(guide).model_dump(mode="json")
            except AppError as exc:
                _raise_from_app_error(exc)
                raise

        return await asyncio.to_thread(_run)

    async def upload_guide_photo(
        self,
        *,
        guide_id: str,
        content: bytes,
        content_type: str,
        correlation_id: str | None,
    ) -> None:
        def _run() -> None:
            try:
                self._catalog.set_guide_photo(
                    guide_id, photo_bytes=content, content_type=content_type
                )
            except AppError as exc:
                _raise_from_app_error(exc)
                raise

        await asyncio.to_thread(_run)

    async def get_guide_photo(
        self,
        *,
        guide_id: str,
        correlation_id: str | None,
    ) -> tuple[str, bytes]:
        def _run() -> tuple[str, bytes]:
            try:
                return self._catalog.get_guide_photo(guide_id)
            except AppError as exc:
                _raise_from_app_error(exc)
                raise

        return await asyncio.to_thread(_run)
