from __future__ import annotations

from bson import json_util
from fastapi import APIRouter, Depends
from fastapi.responses import Response

from app.api.deps import get_maps_data_service
from app.services.maps_data_service import MapsDataService


router = APIRouter(tags=["maps-data"])


@router.get("/maps-data")
async def get_maps_data(
    service: MapsDataService = Depends(get_maps_data_service),
) -> Response:
    documents = await service.list_documents()
    return Response(content=json_util.dumps(documents), media_type="application/json")

