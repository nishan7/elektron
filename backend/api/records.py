import random
from typing import List, Optional

from bson import ObjectId
from fastapi import Query, HTTPException
from datetime import datetime, timedelta
from calendar import month_abbr

from bson import ObjectId
from fastapi import Query
from api.base import BaseCRUDAPI
from models.base import Base
# from backend.models.base import PyObjectId
from models.models import Device, Record

COST_PER_WH = 0.00015 # Placeholder: $0.15 per kWh, assuming consumption is in Wh

class RecordsAPI(BaseCRUDAPI[Record]):
    DEVICE_COLORS = [
        "#8884d8", "#82ca9d", "#ffc658", "#ff8042", 
        "#8dd1e1", "#a4de6c", "#d0ed57", "#d62728",
        "#1f77b4", "#ff7f0e", "#2ca02c", "#9467bd",
        "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22" 
    ]

    def __init__(self):
        super().__init__(Record, "records")

    def setup_routes(self):
        self.router.get("/data", response_model=List[Record])(self.get_records_within_timeframe)
        self.router.get("/monthly-summary")(self.get_monthly_summary)
        self.router.get("/monthly-summary/")(self.get_monthly_summary)
        self.router.get("/hourly-summary")(self.get_hourly_summary)
        self.router.get("/hourly-summary/")(self.get_hourly_summary)
        self.router.get("/daily-summary")(self.get_daily_summary)
        self.router.get("/daily-summary/")(self.get_daily_summary)
        self.router.get("/last-month-summary")(self.get_last_month_summary_by_type)
        self.router.get("/last-month-summary/")(self.get_last_month_summary_by_type)
        self.router.get("/load-distribution-period", summary="Get load distribution for a specified period and device.")(self.get_load_distribution_period)
        self.router.get("/load-distribution-period/", summary="Get load distribution for a specified period and device.")(self.get_load_distribution_period)
        self.router.get("/device-analytics-summary", summary="Get aggregated analytics for a device over a period.")(self.get_device_analytics_summary)
        self.router.get("/device-analytics-summary/", summary="Get aggregated analytics for a device over a period.")(self.get_device_analytics_summary)
        self.router.get("/daily-trend-for-device", summary="Get daily consumption trend for a specific device over a period.")(self.get_daily_trend_for_device)
        self.router.get("/daily-trend-for-device/", summary="Get daily consumption trend for a specific device over a period.")(self.get_daily_trend_for_device)
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

        if device_id and device_id.lower() != 'all':
            if ObjectId.is_valid(device_id):
                match_stage["device_id"] = ObjectId(device_id)
            # else: handle invalid ObjectId if necessary
            #   pass # Example placeholder for else block if needed

        pipeline = []
        if match_stage:
            pipeline.append({"$match": match_stage})
        pipeline += [
            {
                "$group": {
                    "_id": {"$hour": "$timestamp"},
                    "consumption": {"$sum": "$power"},
                    # "cost": {"$sum": {"$literal": 0}} # Old cost, removing
                }
            },
            {"$sort": {"_id": 1}}
        ]

        cursor = self.db.db[self.collection_name].aggregate(pipeline)
        agg_result = {doc["_id"]: doc for doc in await cursor.to_list(length=None)}

        result = []
        for hour in range(24):
            doc = agg_result.get(hour, {"consumption": 0})
            consumption = doc["consumption"]
            cost = round(consumption * COST_PER_WH, 4) # Calculate cost
            result.append({
                "hour": f"{hour:02}:00",
                "consumption": consumption,
                "cost": cost # Add cost to the result
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

    async def get_load_distribution_period(
        self,
        start_time: str = Query(..., description="Start timestamp in ISO format (e.g., YYYY-MM-DDTHH:MM:SSZ)"),
        end_time: str = Query(..., description="End timestamp in ISO format (e.g., YYYY-MM-DDTHH:MM:SSZ)"),
        device_id: Optional[str] = Query(None, description="Optional device ID to filter by. 'all' or None for all devices."),
        group_by: Optional[str] = Query(None, description="Optional field to group by when device_id is 'all' or None. E.g., 'name' or 'type'. Default is 'type'.")
    ):
        try:
            gte_time = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
            lte_time = datetime.fromisoformat(end_time.replace("Z", "+00:00"))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid timestamp format. Please use ISO format.")

        if lte_time < gte_time:
            raise HTTPException(status_code=400, detail="end_time cannot be earlier than start_time.")

        match_conditions = {"timestamp": {"$gte": gte_time, "$lte": lte_time}}

        # Determine the field to group by
        if device_id and device_id.lower() != "all":
            if not ObjectId.is_valid(device_id):
                raise HTTPException(status_code=400, detail=f"Invalid device_id format: {device_id}")
            match_conditions["device_id"] = ObjectId(device_id)
            # Group by specific device name when a single device is selected
            group_stage_id_expression = {"$ifNull": ["$device_info.name", "Unknown Device Name"]}
        else:
            if group_by == 'name':
                # If frontend requests grouping by name for 'all' devices
                group_stage_id_expression = {"$ifNull": ["$device_info.name", "Unknown Device Name"]}
            else:
                # Default behavior for 'all' devices: group by type, fallback to name
                group_stage_id_expression = {
                    "$ifNull": [
                        "$device_info.type", 
                        {"$ifNull": ["$device_info.name", "Unknown"]} # Fallback to name if type is null
                    ]
                }

        pipeline = [
            {"$match": match_conditions},
            {
                "$lookup": {
                    "from": "devices",
                    "localField": "device_id",
                    "foreignField": "_id",
                    "as": "device_info"
                }
            },
            {
                "$unwind": {
                    "path": "$device_info",
                    "preserveNullAndEmptyArrays": True
                }
            },
            {
                "$group": {
                    "_id": group_stage_id_expression, # Dynamic group field
                    "value": {"$sum": "$power"}
                }
            },
            {"$sort": {"value": -1}} 
        ]
        
        cursor = self.db.db[self.collection_name].aggregate(pipeline)
        
        result = []
        used_colors = set()
        
        async for doc in cursor:
            category_name = doc["_id"]
            
            available_colors = [c for c in self.DEVICE_COLORS if c not in used_colors]
            if not available_colors:
                available_colors = self.DEVICE_COLORS
            
            color = random.choice(available_colors)
            used_colors.add(color)
            
            result.append({
                "name": category_name,
                "value": doc["value"],
                "color": color 
            })
            
        return result

    async def get_daily_trend_for_device(
        self,
        start_time: str = Query(..., description="Start timestamp ISO format (e.g., YYYY-MM-DDTHH:MM:SSZ)"),
        end_time: str = Query(..., description="End timestamp ISO format (e.g., YYYY-MM-DDTHH:MM:SSZ)"),
        device_id: Optional[str] = Query(None, description="Specific device ID, or omit/None for all devices."),
    ):
        try:
            gte_time = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
            lte_time = datetime.fromisoformat(end_time.replace("Z", "+00:00"))
            obj_device_id = None
            is_specific_device_query = False
            if device_id and device_id.lower() != "all":
                if not ObjectId.is_valid(device_id):
                    raise ValueError("Invalid device_id format for specific device trend.")
                obj_device_id = ObjectId(device_id)
                is_specific_device_query = True
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Invalid input: {e}")

        if lte_time < gte_time:
            raise HTTPException(status_code=400, detail="end_time cannot be earlier than start_time.")

        match_conditions = {
            "timestamp": {"$gte": gte_time, "$lte": lte_time}
        }
        if is_specific_device_query and obj_device_id:
            match_conditions["device_id"] = obj_device_id

        pipeline = [
            {
                "$match": match_conditions
            },
            {
                "$group": {
                    "_id": {
                        "year": {"$year": "$timestamp"},
                        "month": {"$month": "$timestamp"},
                        "day": {"$dayOfMonth": "$timestamp"}
                    },
                    "totalConsumption": {"$sum": "$power"}
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "date": {
                        "$dateFromParts": {
                            "year": "$_id.year",
                            "month": "$_id.month",
                            "day": "$_id.day"
                        }
                    },
                    "consumption": "$totalConsumption"
                }
            },
            {
                "$sort": {"date": 1}
            }
        ]

        cursor = self.db.db[self.collection_name].aggregate(pipeline)
        daily_trend_data = await cursor.to_list(length=None)
        
        for item in daily_trend_data:
            if isinstance(item["date"], datetime):
                item["date"] = item["date"].strftime("%Y-%m-%d")
            consumption = round(item.get("consumption", 0), 2)
            item["consumption"] = consumption
            item["cost"] = round(consumption * COST_PER_WH, 4)

        return daily_trend_data

    async def get_device_analytics_summary(
        self,
        start_time: str = Query(..., description="Start timestamp ISO format"),
        end_time: str = Query(..., description="End timestamp ISO format"),
        # Allow device_id to be None or 'all'
        device_id: Optional[str] = Query(None, description="Specific device ID, or omit/'all' for overall summary."), 
    ):
        # --- 1. Input Validation ---
        try:
            gte_time = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
            lte_time = datetime.fromisoformat(end_time.replace("Z", "+00:00"))
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Invalid timestamp format: {e}")

        if lte_time < gte_time:
            raise HTTPException(status_code=400, detail="end_time cannot be earlier than start_time.")

        is_specific_device = False
        obj_device_id = None
        if device_id and device_id.lower() != "all":
            if not ObjectId.is_valid(device_id):
                 raise HTTPException(status_code=400, detail=f"Invalid device_id format: {device_id}")
            obj_device_id = ObjectId(device_id)
            is_specific_device = True

        # --- 2. Fetch Device Info (only if specific device) ---
        device_name = "All Devices"
        device_type = "Overall"
        if is_specific_device:
            devices_collection = self.db.db["devices"]
            device_info_doc = await devices_collection.find_one({"_id": obj_device_id})
            if not device_info_doc:
                raise HTTPException(status_code=404, detail=f"Device with id {device_id} not found.")
            device_name = device_info_doc.get("name", "Unknown Device")
            device_type = device_info_doc.get("type", "Unknown Type")

        # --- 3. Aggregation Pipeline --- 
        match_stage = {
            "timestamp": {"$gte": gte_time, "$lte": lte_time}
        }
        if is_specific_device:
            match_stage["device_id"] = obj_device_id

        # Using $facet for calculations
        facet_stage = {
            "$facet": {
                "basicStats": [
                    {
                        "$group": {
                            "_id": None,
                            "averagePower": {"$avg": "$power"},
                            "peakPower": {"$max": "$power"},
                            # Always calculate minPower; will adjust in Python for 'all' devices
                            "minPower": {"$min": "$power"}, 
                            "totalConsumption": {"$sum": "$power"}
                        }
                    }
                ],
                "peakTimestampSearch": [
                     {"$match": {"power": {"$exists": True}}}, # Ensure power exists before sorting
                     {"$sort": {"power": -1}},
                     {"$limit": 1},
                     # Only get peak timestamp if specific device, less meaningful for overall
                     # Using a conditional expression here should be fine as it's in $project
                     {"$project": {"_id": 0, "peakPowerTimestamp": {"$cond": [is_specific_device, "$timestamp", None]}}}
                ],
                "hourlyConsumption": [
                     {
                         "$group": {
                             "_id": {"$hour": "$timestamp"},
                             # Use $avg for specific device, $sum for overall hourly pattern
                             "aggPowerHour": {"$avg": "$power"} if is_specific_device else {"$sum": "$power"} 
                         }
                     },
                     {"$sort": {"aggPowerHour": -1}}
                ]
            }
        }

        pipeline = [
            {"$match": match_stage},
            facet_stage
        ]

        result_cursor = self.db.db[self.collection_name].aggregate(pipeline)
        result = await result_cursor.to_list(length=1)

        # --- 4. Process Results --- 
        default_return = {
            "deviceName": device_name,
            "deviceType": device_type,
            # minPower will be set to None for 'all' devices later if no records found initially
            "averagePower": 0, "peakPower": 0, "minPower": 0, 
            "totalConsumption": 0, "peakPowerTimestamp": None, "peakHours": []
        }
        if not is_specific_device: # Explicitly set default minPower to None for 'all' case
            default_return["minPower"] = None
        
        if not result or not result[0]:
            return default_return # No records found for period/device

        facet_result = result[0]
        # Safely get basicStats, defaulting to an empty dict if the list is empty or facet_result is None
        stats = facet_result.get("basicStats", [{}])
        stats = stats[0] if stats else {}

        # Safely get peakTimestampSearch, defaulting to an empty dict
        peak_ts_data = facet_result.get("peakTimestampSearch", [{}])
        peak_ts_data = peak_ts_data[0] if peak_ts_data else {}
        
        hourly_data = facet_result.get("hourlyConsumption", [])

        peak_hours = [h["_id"] for h in hourly_data[:3]]

        analytics_summary = {
            "deviceName": device_name,
            "deviceType": device_type,
            "averagePower": stats.get("averagePower"), 
            "peakPower": stats.get("peakPower"), 
            "minPower": stats.get("minPower"), 
            "totalConsumption": stats.get("totalConsumption"),
            # peakPowerTimestamp will be None if not is_specific_device, due to $cond
            "peakPowerTimestamp": peak_ts_data.get("peakPowerTimestamp"), 
            "peakHours": peak_hours,
        }
        
        # Fill Nones with 0 if needed, except for specific fields kept as None
        for key in ["averagePower", "peakPower", "totalConsumption"]:
             if analytics_summary[key] is None:
                  analytics_summary[key] = 0
        
        # If it's 'all' devices, minPower should be None.
        # If specific device and minPower is None (e.g. no records), set to 0.
        if not is_specific_device:
            analytics_summary["minPower"] = None
        elif analytics_summary["minPower"] is None: # Specific device, but no minPower calculated (e.g. no records in basicStats)
             analytics_summary["minPower"] = 0

        return analytics_summary