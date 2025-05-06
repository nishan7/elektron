from typing import List

from bson import ObjectId

from api.base import BaseCRUDAPI
from models.base  import Base
# from backend.models.base import PyObjectId
from models.models import Device


class DeviceAPI(BaseCRUDAPI[Device]):
    def __init__(self):
        super().__init__(Device, "devices")

        # Now you can even ADD custom routes here
        self.router.get("/active", response_model=List[Device])(self.get_active_devices)

    async def get_active_devices(self):
        cursor = self.db.db[self.collection_name].find({"is_active": True})
        return [self.model(**doc) async for doc in cursor]

