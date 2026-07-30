from __future__ import annotations

import asyncio
from typing import Any

from app.domain.guides.app_errors import AppError
from app.domain.guides.search_service import GuideSearchService
from app.errors.http import NotFoundError, UpstreamServiceError


def _raise_from_app_error(exc: AppError) -> None:
    if exc.status_code == 404:
        raise NotFoundError(detail=exc.message) from exc
    raise UpstreamServiceError(detail=f"{exc.code}: {exc.message}") from exc


class LocalSearch:
    """In-process search adapter used by inquiries and BFF search routes."""

    def __init__(self, search: GuideSearchService):
        self._search = search

    async def get_guide(self, *, guide_id: str, correlation_id: str | None) -> dict[str, Any]:
        def _run() -> dict[str, Any]:
            try:
                return self._search.get_guide_detail(guide_id)
            except AppError as exc:
                _raise_from_app_error(exc)
                raise

        return await asyncio.to_thread(_run)

    async def search_guides(self, **kwargs: Any) -> dict[str, Any]:
        def _run() -> dict[str, Any]:
            try:
                return self._search.search_guides(**kwargs)
            except AppError as exc:
                _raise_from_app_error(exc)
                raise

        return await asyncio.to_thread(_run)
