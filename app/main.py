from __future__ import annotations

from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.middleware import RequestIDMiddleware
from app.api.router import create_bff_router, create_site_router
from app.core.config import get_settings
from app.core.lifespan import lifespan
from app.core.logging import configure_logging
from app.errors.http import register_exception_handlers

load_dotenv()

settings = get_settings()
configure_logging(settings.log_level)

app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestIDMiddleware, header_name=settings.request_id_header)

app.include_router(create_site_router(settings.api_prefix))
app.include_router(create_bff_router(settings.bff_api_prefix))

register_exception_handlers(app)

_STATIC_ROOT = Path(__file__).resolve().parents[1] / settings.static_dir


@app.get("/public-config")
async def public_config() -> JSONResponse:
    config_path = _STATIC_ROOT / "public-config"
    if config_path.is_file():
        return JSONResponse(content=__import__("json").loads(config_path.read_text(encoding="utf-8")))
    return JSONResponse(content={"publicEnv": {}})


def _spa_index() -> FileResponse:
    index = _STATIC_ROOT / "index.html"
    if not index.is_file():
        raise HTTPException(
            status_code=503,
            detail="Frontend is not built. Run: cd frontend && bun run build && copy build to static/",
        )
    return FileResponse(index)


if _STATIC_ROOT.is_dir():
    assets_dir = _STATIC_ROOT / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/")
    async def spa_root() -> FileResponse:
        return _spa_index()

    @app.get("/{full_path:path}")
    async def spa_fallback(full_path: str, request: Request) -> FileResponse:
        # Prefer real static files (js/css/images) over SPA fallback.
        candidate = (_STATIC_ROOT / full_path).resolve()
        try:
            candidate.relative_to(_STATIC_ROOT.resolve())
        except ValueError as exc:
            raise HTTPException(status_code=404, detail="Not found") from exc
        if candidate.is_file():
            return FileResponse(candidate)
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("openapi"):
            raise HTTPException(status_code=404, detail="Not found")
        return _spa_index()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
    )
