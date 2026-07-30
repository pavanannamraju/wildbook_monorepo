from __future__ import annotations

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class BookmarkType(StrEnum):
    EXPERT = "expert"
    HOMESTAY = "homestay"


class BookmarkCreateRequest(BaseModel):
    type: BookmarkType
    target_id: str = Field(min_length=1, max_length=120)


class BookmarkResponse(BaseModel):
    id: str
    user_id: str
    type: BookmarkType
    target_id: str
    created_at: datetime
    updated_at: datetime


class BookmarkStatusResponse(BaseModel):
    type: BookmarkType
    bookmarked_target_ids: list[str]
