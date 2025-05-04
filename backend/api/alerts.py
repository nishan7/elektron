from calendar import month_abbr
from datetime import datetime
from typing import List, Optional

from bson import ObjectId
from fastapi import Query

from api.base import BaseCRUDAPI
from models.models import Device, Alert, AlertResponse

from fastapi import Query


class AlertsAPI(BaseCRUDAPI[Alert]):
    def __init__(self):
        super().__init__(Alert, "alerts")

    def setup_routes(self):
        super().setup_routes()
        self.router.get("/", response_model=List[AlertResponse])(self.get_records_within_timeframe)



    async def get_enriched_alerts(self, doc):
        device: Device = await self.db.db["devices"].find_one({"_id": doc["device_id"]})
        # Always set device_name, even if device is not found
        doc["device_name"] = device.get("name") if device else None
        # Always set timestamp, fallback to None if start_time missing
        doc["timestamp"] = doc.get("start_time")
        doc["id"] = doc.get("_id")
        return doc

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
        return [AlertResponse(**await self.get_enriched_alerts(doc)) async for doc in cursor]


