from typing import List, Optional
from bson import ObjectId
from fastapi import Request, Query

from api.base import BaseCRUDAPI
from models.base  import Base
# from backend.models.base import PyObjectId
from models.models import Device
from core.database import db


class DeviceAPI(BaseCRUDAPI[Device]):
    def __init__(self):
        super().__init__(Device, "devices")

        # Now you can even ADD custom routes here
        self.router.get("/active", response_model=List[Device])(self.get_active_devices)

    async def get_active_devices(self):
        cursor = self.db.db[self.collection_name].find({"is_active": True})
        return [self.model(**doc) async for doc in cursor]

    async def get_all(
        self,
        request: Request,
        skip: int = Query(0, ge=0, description="Number of items to skip"),
        limit: int = Query(10, ge=1, le=100, description="Maximum number of items to return"),
    ):
        devices: List[Device] = await super().get_all(request=request, skip=skip, limit=limit)

        enriched_devices = []
        for device in devices:
            critical_alert_cursor = db.db["alerts"].find({
                "device_id": device.id,
                "resolved": False,
                "type": "critical"
            })
            active_critical_alerts_count = await db.db["alerts"].count_documents({
                "device_id": ObjectId(str(device.id)),
                "resolved": False,
                "type": "critical"
            })

            if active_critical_alerts_count > 0:
                device.health = "critical"
            else:
                active_warning_alerts_count = await db.db["alerts"].count_documents({
                    "device_id": ObjectId(str(device.id)),
                    "resolved": False,
                    "type": "warning"
                })
                if active_warning_alerts_count > 0:
                    device.health = "warning"
            
            enriched_devices.append(device)
        
        return enriched_devices

