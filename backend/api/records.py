import random
from typing import List, Optional

from bson import ObjectId
from fastapi import Query
from datetime import datetime
from calendar import month_abbr
from datetime import datetime
from typing import List, Optional

from bson import ObjectId
from fastapi import Query
from api.base import BaseCRUDAPI
from models.base import Base
# from backend.models.base import PyObjectId
from models.models import Device, Record


class RecordsAPI(BaseCRUDAPI[Record]):
    def __init__(self):
        super().__init__(Record, "records")

    def setup_routes(self):
        self.router.get("/data", response_model=List[Record])(self.get_records_within_timeframe)
        self.router.get("/monthly-summary")(self.get_monthly_summary)
        self.router.get("/hourly-summary")(self.get_hourly_summary)
        self.router.get("/daily-summary")(self.get_daily_summary)
        self.router.get("/last-month-summary")(self.get_last_month_summary_by_type)
        super().setup_routes()


    async def get_records_within_timeframe(
            self,
            start_time: Optional[str] = Query(None),
            end_time: Optional[str] = Query(None),
            device_id: Optional[str] = Query(None),
    ):
        query = {}
        if start_time or end_time:
            query["timestamp"] = {}
            if start_time:
                query["timestamp"]["$gte"] = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
            if end_time:
                query["timestamp"]["$lte"] = datetime.fromisoformat(end_time.replace("Z", "+00:00"))
            if device_id:
                query["device_id"] = ObjectId(device_id)
        cursor = self.db.db[self.collection_name].find(query)
        return [self.model(**doc) async for doc in cursor]

    async def get_active_devices(self):
        cursor = self.db.db[self.collection_name].find({"is_active": True})
        return [self.model(**doc) async for doc in cursor]


    async def get_monthly_summary(
            self,
            year: Optional[int] = Query(None),
            device_id: Optional[str] = Query(None),
            start_time: Optional[str] = Query(None),
            end_time: Optional[str] = Query(None)
    ):
        match_stage = {}

        if year:
            match_stage["$expr"] = {
                "$eq": [{"$year": "$timestamp"}, year]
            }

        if start_time or end_time:
            match_stage["timestamp"] = {}
            if start_time:
                match_stage["timestamp"]["$gte"] = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
            if end_time:
                match_stage["timestamp"]["$lte"] = datetime.fromisoformat(end_time.replace("Z", "+00:00"))

        if device_id:
            match_stage["device_id"] = ObjectId(device_id)

        pipeline = []
        if match_stage:
            pipeline.append({"$match": match_stage})

        pipeline.extend([
            {
                "$group": {
                    "_id": {"$month": "$timestamp"},
                    "power": {"$sum": "$power"}
                }
            },
            {"$sort": {"_id": 1}}
        ])

        cursor = self.db.db[self.collection_name].aggregate(pipeline)

        agg_result = {doc["_id"]: {"power": doc["power"]} async for doc in cursor}

        result = []
        for month_index in range(1, 13):
            data = agg_result.get(month_index, {"power": 0})
            result.append({
                "month": month_abbr[month_index],
                "power": int(data["power"]),
                "cost": int(data["power"] * 0.30),  # Assuming a cost of $0.30 per kWh
            })
        return result

    from fastapi import Query
    from typing import Optional
    from datetime import datetime

    async def get_hourly_summary(
            self,
            start_time: Optional[str] = Query(None),
            end_time: Optional[str] = Query(None),
            device_id: Optional[str] = Query(None)
    ):
        match_stage = {}
        if start_time or end_time:
            match_stage["timestamp"] = {}
            if start_time:
                match_stage["timestamp"]["$gte"] = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
            if end_time:
                match_stage["timestamp"]["$lte"] = datetime.fromisoformat(end_time.replace("Z", "+00:00"))

        if device_id:
            match_stage["device_id"] = ObjectId(device_id)

        pipeline = []
        if match_stage:
            pipeline.append({"$match": match_stage})
        pipeline += [
            {
                "$group": {
                    "_id": {"$hour": "$timestamp"},
                    "consumption": {"$sum": "$power"},
                    "cost": {"$sum": {"$literal": 0}}
                }
            },
            {"$sort": {"_id": 1}}
        ]

        cursor = self.db.db[self.collection_name].aggregate(pipeline)
        agg_result = {doc["_id"]: doc for doc in await cursor.to_list(length=None)}

        result = []
        for hour in range(24):
            doc = agg_result.get(hour, {"consumption": 0, "cost": 0})
            result.append({
                "hour": f"{hour:02}:00",
                "consumption": doc["consumption"],
                "cost": int(doc["consumption"] * 0.30)
            })
        return result

    async def get_daily_summary(
            self,
            start_time: Optional[str] = Query(None),
            end_time: Optional[str] = Query(None),
            device_id: Optional[str] = Query(None)
    ):
        match_stage = {}
        if start_time or end_time:
            match_stage["timestamp"] = {}
            if start_time:
                match_stage["timestamp"]["$gte"] = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
            if end_time:
                match_stage["timestamp"]["$lte"] = datetime.fromisoformat(end_time.replace("Z", "+00:00"))

        if device_id:
            match_stage["device_id"] = ObjectId(device_id)

        pipeline = []
        if match_stage:
            pipeline.append({"$match": match_stage})
        pipeline += [
            {
                "$group": {
                    "_id": {"$dayOfWeek": "$timestamp"},
                    "consumption": {"$sum": "$power"},
                    "cost": {"$sum": {"$literal": 0}}
                }
            },
            {"$sort": {"_id": 1}}
        ]

        days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        cursor = self.db.db[self.collection_name].aggregate(pipeline)
        agg_result = {doc["_id"]: doc for doc in await cursor.to_list(length=None)}

        result = []
        for i in range(1, 8):  # MongoDB $dayOfWeek: 1 = Sunday, 7 = Saturday
            doc = agg_result.get(i, {"consumption": 0, "cost": 0})
            result.append({
                "day": days[i - 1],
                "consumption": doc["consumption"],
                "cost": int(doc["consumption"] * 0.30)
            })
        return result

    import random

    DEVICE_COLORS = [
        "#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#8dd1e1", "#a4de6c", "#d0ed57", "#d62728"
    ]

    async def get_last_month_summary_by_type(self):
        from datetime import datetime, timedelta
        from pymongo import DESCENDING

        now = datetime.utcnow()
        first_day_this_month = datetime(now.year, now.month, 1)
        last_month_end = first_day_this_month - timedelta(seconds=1)
        last_month_start = datetime(last_month_end.year, last_month_end.month, 1)

        # Lookup device info to get device type
        pipeline = [
            {"$match": {
                "timestamp": {"$gte": last_month_start, "$lte": last_month_end}
            }},
            {
                "$lookup": {
                    "from": "devices",
                    "localField": "device_id",
                    "foreignField": "_id",
                    "as": "device_info"
                }
            },
            {"$unwind": "$device_info"},
            {
                "$group": {
                    "_id": "$device_info.type",
                    "value": {"$sum": "$power"}
                }
            }
        ]

        cursor = self.db.db[self.collection_name].aggregate(pipeline)
        result = []
        used_colors = set()
        for doc in await cursor.to_list(length=None):
            color = random.choice([c for c in self.DEVICE_COLORS if c not in used_colors] or self.DEVICE_COLORS)
            used_colors.add(color)
            result.append({
                "name": doc["_id"],
                "value": int(doc["value"]),
                "color": color
            })
        return result