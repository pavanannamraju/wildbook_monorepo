from __future__ import annotations

from app.stores.maps_data_store import MapsDataStore
from app.errors.http import ServiceUnavailableError


class MapsDataService:
    def __init__(self, *, store: MapsDataStore) -> None:
        self._store = store

    async def list_documents(self) -> list[dict[str, object]]:
        try:
            return await self._store.list_documents()
        except RuntimeError as exc:
            raise ServiceUnavailableError(detail=str(exc)) from exc

