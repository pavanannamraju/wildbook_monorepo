from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import Response

from app.api.deps import (
    get_bookmarks_service,
    get_experts_adapter_service,
    get_local_catalog,
    get_optional_current_user,
)
from app.domain.guides.local_catalog import LocalCatalog
from app.errors.http import BadRequestError, NotFoundError
from app.models.auth import CurrentUserResponse
from app.models.bookmark import BookmarkType
from app.models.expert import CursorPage, ExpertPublicDetail
from app.services.bookmarks_service import BookmarksService
from app.services.experts_adapter_service import ExpertsAdapterService

router = APIRouter(tags=["experts"])


def _correlation_id(request: Request) -> str | None:
    return getattr(request.state, "request_id", None)


@router.get("/experts", response_model=CursorPage)
async def list_experts(
    request: Request,
    limit: int = Query(default=20, ge=1, le=100),
    cursor: str | None = Query(default=None),
    status: str | None = Query(default="published"),
    role: str | None = Query(default=None),
    q: str | None = Query(default=None),
    include_bookmark: bool = Query(default=False),
    current_user: CurrentUserResponse | None = Depends(get_optional_current_user),
    service: ExpertsAdapterService = Depends(get_experts_adapter_service),
    bookmarks_service: BookmarksService = Depends(get_bookmarks_service),
) -> CursorPage:
    if status and status.lower() != "published":
        raise BadRequestError(detail="Only published experts are available.")

    page = await service.list_experts(
        correlation_id=_correlation_id(request),
        limit=limit,
        cursor=cursor,
        role=role,
        q=q,
        bookmarked_ids=None,
        media_base_url=str(request.base_url).rstrip("/"),
    )

    if include_bookmark and current_user is not None and page.items:
        status_response = await bookmarks_service.status(
            user_id=current_user.id,
            bookmark_type=BookmarkType.EXPERT,
            target_ids=[item.id for item in page.items],
        )
        bookmarked = set(status_response.bookmarked_target_ids)
        for item in page.items:
            item.is_bookmarked = item.id in bookmarked

    return page


@router.get("/experts/{slug_or_id}", response_model=ExpertPublicDetail)
async def get_expert(
    request: Request,
    slug_or_id: str,
    include: list[str] = Query(default_factory=list),
    service: ExpertsAdapterService = Depends(get_experts_adapter_service),
) -> ExpertPublicDetail:
    return await service.get_expert(
        slug_or_id=slug_or_id,
        correlation_id=_correlation_id(request),
        include=include,
        media_base_url=str(request.base_url).rstrip("/"),
    )


@router.get("/experts/{slug_or_id}/photo")
async def get_expert_photo(
    request: Request,
    slug_or_id: str,
    catalog: LocalCatalog = Depends(get_local_catalog),
) -> Response:
    try:
        content_type, content = await catalog.get_guide_photo(
            guide_id=slug_or_id,
            correlation_id=_correlation_id(request),
        )
    except NotFoundError:
        raise NotFoundError(detail="Expert profile photo not found.") from None

    return Response(content=content, media_type=content_type)
