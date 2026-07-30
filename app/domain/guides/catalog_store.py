from __future__ import annotations

from typing import Any

from pymongo.database import Database


class CatalogStore:
    def __init__(self, db: Database):
        self._db = db

    @property
    def guides(self):
        return self._db["guides"]

    @property
    def offerings(self):
        return self._db["offerings"]

    @property
    def policies(self):
        return self._db["policy_templates"]

    @property
    def guide_photos(self):
        # Photo binaries live in a dedicated collection so the heavy bytes never
        # bloat (or break the in-memory sort of) guide list/detail queries.
        return self._db["guide_photos"]

    def find_active_references(
        self, collection_name: str, ids: list[str]
    ) -> dict[str, dict[str, Any]]:
        if not ids:
            return {}
        docs = self._db[collection_name].find({"_id": {"$in": ids}, "is_active": True})
        return {doc["_id"]: doc for doc in docs}

    def get_active_reference(
        self, collection_name: str, ref_id: str
    ) -> dict[str, Any] | None:
        return self._db[collection_name].find_one({"_id": ref_id, "is_active": True})

    def list_active_references(self, collection_name: str) -> list[dict[str, Any]]:
        return list(self._db[collection_name].find({"is_active": True}).sort("name", 1))

    def reference_id_exists(self, collection_name: str, ref_id: str) -> bool:
        return self._db[collection_name].count_documents({"_id": ref_id}, limit=1) > 0

    def insert_reference(self, collection_name: str, doc: dict[str, Any]) -> None:
        self._db[collection_name].insert_one(doc)

    def get_guide(self, guide_id: str) -> dict[str, Any] | None:
        return self.guides.find_one({"_id": guide_id, "is_deleted": False})

    def _guide_list_query(
        self,
        *,
        role: str | None = None,
        primary_location_id: str | None = None,
        status: str | None = None,
        is_active: bool | None = None,
    ) -> dict[str, Any]:
        query: dict[str, Any] = {"is_deleted": False}
        if role is not None:
            query["role"] = role
        if primary_location_id is not None:
            query["primary_location_id"] = primary_location_id
        if status is not None:
            query["status"] = status
        if is_active is not None:
            query["is_active"] = is_active
        return query

    def list_guides(
        self,
        *,
        role: str | None = None,
        primary_location_id: str | None = None,
        status: str | None = None,
        is_active: bool | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        query = self._guide_list_query(
            role=role,
            primary_location_id=primary_location_id,
            status=status,
            is_active=is_active,
        )
        return list(
            self.guides.find(query).sort("created_at", -1).skip(offset).limit(limit)
        )

    def count_guides(
        self,
        *,
        role: str | None = None,
        primary_location_id: str | None = None,
        status: str | None = None,
        is_active: bool | None = None,
    ) -> int:
        query = self._guide_list_query(
            role=role,
            primary_location_id=primary_location_id,
            status=status,
            is_active=is_active,
        )
        return self.guides.count_documents(query)

    def insert_guide(self, payload: dict[str, Any]) -> None:
        self.guides.insert_one(payload)

    def get_guide_photo(self, guide_id: str) -> tuple[str, bytes] | None:
        doc = self.guide_photos.find_one({"_id": guide_id})
        if not doc:
            return None
        photo_bytes = doc.get("photo_bytes")
        content_type = doc.get("content_type")
        if not photo_bytes or not isinstance(content_type, str):
            return None
        return content_type, bytes(photo_bytes)

    def set_guide_photo(
        self,
        guide_id: str,
        *,
        photo_bytes: bytes,
        content_type: str,
        updated_at,
    ) -> bool:
        result = self.guides.update_one(
            {"_id": guide_id, "is_deleted": False},
            {
                "$set": {
                    "has_profile_photo": True,
                    "profile_image_url": None,
                    "updated_at": updated_at,
                },
                "$unset": {
                    "profile_photo_bytes": "",
                    "profile_photo_content_type": "",
                },
            },
        )
        if result.matched_count == 0:
            return False
        self.guide_photos.update_one(
            {"_id": guide_id},
            {
                "$set": {
                    "photo_bytes": photo_bytes,
                    "content_type": content_type,
                    "updated_at": updated_at,
                }
            },
            upsert=True,
        )
        return True

    def insert_offering(self, payload: dict[str, Any]) -> None:
        self.offerings.insert_one(payload)

    def count_offerings(self, guide_id: str) -> int:
        return self.offerings.count_documents({"guide_id": guide_id, "is_deleted": False})

    def list_offerings(self, guide_id: str) -> list[dict[str, Any]]:
        return list(
            self.offerings.find({"guide_id": guide_id, "is_deleted": False}).sort(
                "sort_order", 1
            )
        )

    def get_offering(self, guide_id: str, offering_id: str) -> dict[str, Any] | None:
        return self.offerings.find_one(
            {"_id": offering_id, "guide_id": guide_id, "is_deleted": False}
        )

    def update_offering(self, offering_id: str, update_data: dict[str, Any]) -> None:
        self.offerings.update_one({"_id": offering_id}, {"$set": update_data})

    def soft_delete_offering(self, guide_id: str, offering_id: str, updated_at) -> int:
        result = self.offerings.update_one(
            {"_id": offering_id, "guide_id": guide_id, "is_deleted": False},
            {"$set": {"is_deleted": True, "updated_at": updated_at}},
        )
        return result.matched_count

    def latest_policy_by_name(
        self, guide_id: str, policy_name: str
    ) -> dict[str, Any] | None:
        return self.policies.find_one(
            {"guide_id": guide_id, "policy_name": policy_name, "is_deleted": False},
            sort=[("version", -1)],
        )

    def insert_policy(self, payload: dict[str, Any]) -> None:
        self.policies.insert_one(payload)

    def list_policies(self, guide_id: str) -> list[dict[str, Any]]:
        return list(
            self.policies.find({"guide_id": guide_id, "is_deleted": False}).sort(
                [("policy_name", 1), ("version", -1)]
            )
        )

    def get_policy(self, guide_id: str, policy_id: str) -> dict[str, Any] | None:
        return self.policies.find_one(
            {"_id": policy_id, "guide_id": guide_id, "is_deleted": False}
        )

    def update_policy(self, policy_id: str, update_data: dict[str, Any]) -> None:
        self.policies.update_one({"_id": policy_id}, {"$set": update_data})

    def soft_delete_policy(self, guide_id: str, policy_id: str, updated_at) -> int:
        result = self.policies.update_one(
            {"_id": policy_id, "guide_id": guide_id, "is_deleted": False},
            {"$set": {"is_deleted": True, "updated_at": updated_at}},
        )
        return result.matched_count
