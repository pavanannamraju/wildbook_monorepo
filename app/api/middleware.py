from __future__ import annotations

import uuid
from collections.abc import Callable
from typing import Awaitable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


class RequestIDMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, header_name: str) -> None:
        super().__init__(app)
        self._header_name = header_name

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        request_id = request.headers.get(self._header_name) or str(uuid.uuid4())
        request.state.request_id = request_id

        response = await call_next(request)
        response.headers[self._header_name] = request_id
        return response
