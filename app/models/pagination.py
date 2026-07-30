from __future__ import annotations

import base64
import json
from dataclasses import dataclass
from typing import Any, Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _b64url_decode(encoded: str) -> bytes:
    padding = "=" * (-len(encoded) % 4)
    return base64.urlsafe_b64decode(encoded + padding)


@dataclass(frozen=True)
class CursorSpec:
    """
    Cursor-based pagination for MongoDB queries.

    Cursors encode the last seen (sort_key, _id) tuple so list queries can remain index-backed.
    """

    sort_field: str
    sort_dir: int  # 1 for ascending, -1 for descending


class CursorParams(BaseModel):
    limit: int = Field(default=20, ge=1, le=100)
    cursor: str | None = None


class CursorPage(BaseModel, Generic[T]):
    items: list[T]
    next_cursor: str | None
    total_count: int | None = None


def encode_cursor(*, sort_value: Any, id_value: str) -> str:
    payload = {"v": sort_value, "id": id_value}
    return _b64url_encode(json.dumps(payload, separators=(",", ":"), default=str).encode("utf-8"))


def decode_cursor(cursor: str) -> dict[str, Any]:
    raw = _b64url_decode(cursor)
    value = json.loads(raw.decode("utf-8"))
    if not isinstance(value, dict) or "v" not in value or "id" not in value:
        raise ValueError("Invalid cursor payload.")
    return value

