from typing import List, Optional

from bson import ObjectId
from fastapi import Query
from datetime import datetime

from api.base import BaseCRUDAPI
from models.base import Base
# from backend.models.base import PyObjectId
from models.models import Device, Record


class RecordsAPI(BaseCRUDAPI[Record]):
    def __init__(self):
        super().__init__(Record, "records")

    def setup_routes(self):
        self.router.get("/data", response_model=List[Record])(self.get_records_within_timeframe)
        super().setup_routes()


    async def get_records_within_timeframe(
            self,
            start_time: Optional[str] = Query(None),
            end_time: Optional[str] = Query(None),
    ):
        query = {}
        if start_time or end_time:
            query["timestamp"] = {}
            if start_time:
                query["timestamp"]["$gte"] = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
            if end_time:
                query["timestamp"]["$lte"] = datetime.fromisoformat(end_time.replace("Z", "+00:00"))
        cursor = self.db.db[self.collection_name].find(query)
        return [self.model(**doc) async for doc in cursor]

    async def get_active_devices(self):
        cursor = self.db.db[self.collection_name].find({"is_active": True})
        return [self.model(**doc) async for doc in cursor]
