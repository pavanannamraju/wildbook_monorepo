from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_bookmarks_service, require_user_or_admin
from app.models.auth import CurrentUserResponse
from app.models.bookmark import BookmarkCreateRequest, BookmarkResponse, BookmarkStatusResponse, BookmarkType
from app.services.bookmarks_service import BookmarksService

router = APIRouter(tags=["bookmarks"])


@router.get("/bookmarks", response_model=list[BookmarkResponse])
async def list_bookmarks(
    type: BookmarkType = Query(...),
    current_user: CurrentUserResponse = Depends(require_user_or_admin),
    service: BookmarksService = Depends(get_bookmarks_service),
) -> list[BookmarkResponse]:
    return await service.list(user_id=current_user.id, bookmark_type=type)


@router.get("/bookmarks/status", response_model=BookmarkStatusResponse)
async def get_bookmark_status(
    type: BookmarkType = Query(...),
    target_ids: list[str] = Query(default_factory=list),
    current_user: CurrentUserResponse = Depends(require_user_or_admin),
    service: BookmarksService = Depends(get_bookmarks_service),
) -> BookmarkStatusResponse:
    return await service.status(user_id=current_user.id, bookmark_type=type, target_ids=target_ids)


@router.post("/bookmarks", response_model=BookmarkResponse)
async def create_bookmark(
    payload: BookmarkCreateRequest,
    current_user: CurrentUserResponse = Depends(require_user_or_admin),
    service: BookmarksService = Depends(get_bookmarks_service),
) -> BookmarkResponse:
    return await service.create_or_update(user_id=current_user.id, payload=payload)


@router.delete("/bookmarks/{bookmark_type}/{target_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bookmark(
    bookmark_type: BookmarkType,
    target_id: str,
    current_user: CurrentUserResponse = Depends(require_user_or_admin),
    service: BookmarksService = Depends(get_bookmarks_service),
) -> None:
    await service.delete(user_id=current_user.id, bookmark_type=bookmark_type, target_id=target_id)
