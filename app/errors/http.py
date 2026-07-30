from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette import status

logger = logging.getLogger("wildbook.errors")


class AppError(Exception):
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    error_code: str = "internal_error"
    detail: str = "Internal server error."

    def __init__(self, *, detail: str | None = None) -> None:
        if detail is not None:
            self.detail = detail
        super().__init__(self.detail)

    def to_dict(self) -> dict[str, object]:
        return {"error": {"code": self.error_code, "message": self.detail}}


class BadRequestError(AppError):
    status_code = status.HTTP_400_BAD_REQUEST
    error_code = "bad_request"


class NotFoundError(AppError):
    status_code = status.HTTP_404_NOT_FOUND
    error_code = "not_found"


class ServiceUnavailableError(AppError):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    error_code = "service_unavailable"


class UnauthorizedError(AppError):
    status_code = status.HTTP_401_UNAUTHORIZED
    error_code = "unauthorized"
    detail = "Authentication is required."


class ForbiddenError(AppError):
    status_code = status.HTTP_403_FORBIDDEN
    error_code = "forbidden"
    detail = "You do not have permission to access this resource."


class UpstreamServiceError(AppError):
    status_code = status.HTTP_502_BAD_GATEWAY
    error_code = "upstream_error"


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    request_id = getattr(request.state, "request_id", None)
    logger.warning(
        "app_error request_id=%s code=%s detail=%s path=%s",
        request_id,
        exc.error_code,
        exc.detail,
        request.url.path,
    )
    return JSONResponse(status_code=exc.status_code, content=exc.to_dict())


async def request_validation_error_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    request_id = getattr(request.state, "request_id", None)
    logger.warning("validation_error request_id=%s path=%s errors=%s", request_id, request.url.path, exc.errors())
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"error": {"code": "validation_error", "message": "Request validation failed.", "details": exc.errors()}},
    )


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppError, app_error_handler)
    app.add_exception_handler(RequestValidationError, request_validation_error_handler)
