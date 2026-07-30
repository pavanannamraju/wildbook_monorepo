from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query, Request

from app.api.deps import get_local_search
from app.domain.guides.local_search import LocalSearch

router = APIRouter(tags=["search"])


def _correlation_id(request: Request) -> str | None:
    return getattr(request.state, "request_id", None)


@router.get("/search/guides")
async def search_guides(
    request: Request,
    q: str | None = None,
    primary_location_id: str | None = None,
    expertise_id: str | None = None,
    language_id: str | None = None,
    role: str | None = None,
    experience_type: str | None = None,
    min_price: int | None = None,
    max_price: int | None = None,
    sort: str = Query(default="rating_desc"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    search: LocalSearch = Depends(get_local_search),
) -> dict[str, Any]:
    return await search.search_guides(
        q=q,
        primary_location_id=primary_location_id,
        expertise_id=expertise_id,
        language_id=language_id,
        role=role,
        experience_type=experience_type,
        min_price=min_price,
        max_price=max_price,
        sort=sort,
        limit=limit,
        offset=offset,
    )


@router.get("/search/guides/{guide_id}")
async def search_guide_detail(
    guide_id: str,
    search: LocalSearch = Depends(get_local_search),
) -> dict[str, Any]:
    return await search.get_guide(guide_id=guide_id, correlation_id=None)
