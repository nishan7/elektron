#   elektron/backend/app/api/endpoints/analytics.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Any, Dict
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.device import (
    Device,
    DeviceHealth,
    Alert,
)  #   Remove PowerReading import
from app.services.analytics import PowerAnalytics
from app.schemas.analytics import (
    AnomalyResponse,
    ForecastResponse,
    TrendAnalysisResponse,
    RecommendationResponse,
)
from pymongo import MongoClient
from app.core.config import settings  #   If you have a settings file
from bson import ObjectId  #   For handling MongoDB ObjectIds
from pydantic import BaseModel  #   For AggregatedPowerData

router = APIRouter()
analytics = PowerAnalytics()

#   MongoDB setup (You might want to centralize this)
MONGO_URI = settings.MONGO_URI or "mongodb://mongodb:27017/"
MONGO_DB = settings.MONGO_DB or "electricity_monitor"
MONGO_COLLECTION = "aggregated_power_data"

client = MongoClient(MONGO_URI)
db = client[MONGO_DB]
collection = db[MONGO_COLLECTION]

class AggregatedPowerData(BaseModel):
    id: str
    device_id: str
    aggregation_time: datetime
    avg_voltage: float
    avg_current: float
    avg_power: float
    avg_energy: float
    avg_power_factor: Optional[float] = None

    class Config:
        orm_mode = True
        allow_population_by_field_name = True  #   Allow _id to be mapped to id

def convert_to_readings_data(
    aggregated_data: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Converts aggregated data from MongoDB to the format expected by analytics functions.
    """
    readings_data = []
    for data in aggregated_data:
        readings_data.append(
            {
                "timestamp": data["aggregation_time"],
                "power": data["avg_power"],
            }
        )
    return readings_data

@router.get("/anomalies/{device_id}", response_model=List[AnomalyResponse])
async def detect_anomalies(
    device_id: int,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
):
    """Detect anomalies in aggregated power consumption data"""

    try:
        #   MongoDB query to get aggregated data for the device
        query = {"device_id": str(device_id)}  #   device_id is a string in MongoDB
        if start_time:
            query["aggregation_time"] = {"$gte": start_time}
        if end_time:
            if "aggregation_time" in query:
                query["aggregation_time"]["$lte"] = end_time
            else:
                query["aggregation_time"] = {"$lte": end_time}

        aggregated_data_cursor = collection.find(query).sort(
            "aggregation_time", 1
        )
        aggregated_data: List[Dict[str, Any]] = list(aggregated_data_cursor)

        if not aggregated_data:
            raise HTTPException(
                status_code=404,
                detail="No aggregated power data found for the specified period",
            )

        #   Convert aggregated data to the format expected by analytics
        readings_data = convert_to_readings_data(aggregated_data)

        #   Detect anomalies
        anomalies = analytics.detect_anomalies(readings_data)
        return anomalies

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        client.close()

@router.get("/forecast/{device_id}", response_model=List[ForecastResponse])
async def forecast_power_consumption(
    device_id: int, horizon_days: int = Query(7, ge=1, le=30)
):
    """Forecast power consumption for the next n days using aggregated data"""

    try:
        #   Get historical aggregated data for training
        end_time = datetime.now()
        start_time = end_time - timedelta(days=30)  #   Use last 30 days for training

        query = {
            "device_id": str(device_id),  #   device_id is a string in MongoDB
            "aggregation_time": {"$gte": start_time, "$lte": end_time},
        }
        aggregated_data_cursor = collection.find(query).sort(
            "aggregation_time", 1
        )
        aggregated_data: List[Dict[str, Any]] = list(aggregated_data_cursor)

        if not aggregated_data:
            raise HTTPException(
                status_code=404,
                detail="Insufficient historical aggregated data for forecasting",
            )

        #   Convert aggregated data to the format expected by analytics
        readings_data = convert_to_readings_data(aggregated_data)

        #   Train model and generate forecast
        analytics.train_forecast_model(readings_data)
        forecast = analytics.forecast_power_consumption(readings_data, horizon_days)
        return forecast

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        client.close()

@router.get("/trends/{device_id}", response_model=TrendAnalysisResponse)
async def analyze_power_trends(
    device_id: int, start_time: Optional[datetime] = None, end_time: Optional[datetime] = None
):
    """Analyze power consumption trends using aggregated data"""

    try:
        #   MongoDB query to get aggregated data for the device
        query = {"device_id": str(device_id)}  #   device_id is a string in MongoDB
        if start_time:
            query["aggregation_time"] = {"$gte": start_time}
        if end_time:
            if "aggregation_time" in query:
                query["aggregation_time"]["$lte"] = end_time
            else:
                query["aggregation_time"] = {"$lte": end_time}

        aggregated_data_cursor = collection.find(query).sort(
            "aggregation_time", 1
        )
        aggregated_data: List[Dict[str, Any]] = list(aggregated_data_cursor)

        if not aggregated_data:
            raise HTTPException(
                status_code=404,
                detail="No aggregated power data found for the specified period",
            )

        #   Convert aggregated data to the format expected by analytics
        readings_data = convert_to_readings_data(aggregated_data)

        #   Analyze trends
        trends = analytics.analyze_power_trends(readings_data)
        return trends

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        client.close()

@router.get("/recommendations/{device_id}", response_model=List[RecommendationResponse])
async def get_recommendations(
    device_id: int, start_time: Optional[datetime] = None, end_time: Optional[datetime] = None
):
    """Get power-saving recommendations using aggregated data"""

    try:
        #   MongoDB query to get aggregated data for the device
        query = {"device_id": str(device_id)}  #   device_id is a string in MongoDB
        if start_time:
            query["aggregation_time"] = {"$gte": start_time}
        if end_time:
            if "aggregation_time" in query:
                query["aggregation_time"]["$lte"] = end_time
            else:
                query["aggregation_time"] = {"$lte": end_time}

        aggregated_data_cursor = collection.find(query).sort(
            "aggregation_time", 1
        )
        aggregated_data: List[Dict[str, Any]] = list(aggregated_data_cursor)

        if not aggregated_data:
            raise HTTPException(
                status_code=404,
                detail="No aggregated power data found for the specified period",
            )

        #   Convert aggregated data to the format expected by analytics
        readings_data = convert_to_readings_data(aggregated_data)

        #   Generate recommendations
        recommendations = analytics.generate_recommendations(readings_data)
        return recommendations

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        client.close()