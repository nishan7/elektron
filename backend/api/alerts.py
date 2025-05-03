from datetime import datetime
from typing import List, Optional

from bson import ObjectId
from fastapi import Query

from api.base import BaseCRUDAPI
from models.models import Device, Alert


class AlertsAPI(BaseCRUDAPI[Alert]):
    def __init__(self):
        super().__init__(Alert, "alerts")

    def setup_routes(self):
        self.router.get("/", response_model=List[Alert])(self.get_records_within_timeframe)
        super().setup_routes()


    async def get_records_within_timeframe(
            self,
            start_time: Optional[str] = Query(None),
            end_time: Optional[str] = Query(None),
            device_id: Optional[str] = Query(None),
    ):
        query = {}
        if start_time or end_time:
            query["start_time"] = {}
            if start_time:
                query["start_time"]["$gte"] = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
            if end_time:
                query["start_time"]["$lte"] = datetime.fromisoformat(end_time.replace("Z", "+00:00"))
            if device_id:
                query["device_id"] = ObjectId(device_id)
        cursor = self.db.db[self.collection_name].find(query)
        return [self.model(**doc) async for doc in cursor]