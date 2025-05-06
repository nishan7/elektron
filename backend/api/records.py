from typing import List, Optional

from bson import ObjectId
from fastapi import Query, HTTPException
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
            device_id: Optional[str] = Query(None),
    ):
        query = {}
        
        # Always add device_id filter if provided
        if device_id:
            try:
                query["device_id"] = ObjectId(device_id)
            except Exception:
                raise HTTPException(status_code=400, detail=f"Invalid device_id format: {device_id}")

        # Add timestamp filter only if start_time or end_time is provided
        if start_time or end_time:
            query["timestamp"] = {}
            if start_time:
                try:
                    query["timestamp"]["$gte"] = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
                except ValueError:
                     raise HTTPException(status_code=400, detail=f"Invalid start_time format: {start_time}")
            if end_time:
                try:
                    query["timestamp"]["$lte"] = datetime.fromisoformat(end_time.replace("Z", "+00:00"))
                except ValueError:
                    raise HTTPException(status_code=400, detail=f"Invalid end_time format: {end_time}")
        
        # Add sorting by timestamp, descending (newest first)
        # Consider adding limit/skip for pagination if fetching all data becomes too large
        cursor = self.db.db[self.collection_name].find(query).sort("timestamp", -1)
        
        # Check if cursor is empty and return empty list immediately
        # This can avoid unnecessary async iteration if no documents match
        # Note: This requires an initial check, which might add slight overhead.
        # Remove if performance is critical and large empty result sets are rare.
        # Example: 
        # estimated_count = await self.db.db[self.collection_name].count_documents(query)
        # if estimated_count == 0:
        #     return []
            
        return [self.model(**doc) async for doc in cursor]

    async def get_active_devices(self):
        cursor = self.db.db[self.collection_name].find({"is_active": True})
        return [self.model(**doc) async for doc in cursor]
