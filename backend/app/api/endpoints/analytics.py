from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.device import PowerReading
from app.services.analytics import PowerAnalytics
from app.schemas.analytics import (
    AnomalyResponse,
    ForecastResponse,
    TrendAnalysisResponse,
    RecommendationResponse
)

router = APIRouter()
analytics = PowerAnalytics()

@router.get("/anomalies/{device_id}", response_model=List[AnomalyResponse])
def detect_anomalies(
    device_id: int,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    """Detect anomalies in power consumption data"""
    query = db.query(PowerReading).filter(PowerReading.device_id == device_id)
    
    if start_time:
        query = query.filter(PowerReading.timestamp >= start_time)
    if end_time:
        query = query.filter(PowerReading.timestamp <= end_time)
    
    readings = query.order_by(PowerReading.timestamp).all()
    
    if not readings:
        raise HTTPException(status_code=404, detail="No power readings found for the specified period")
    
    # Convert to list of dictionaries
    readings_data = [
        {
            'timestamp': reading.timestamp,
            'power': reading.power
        }
        for reading in readings
    ]
    
    # Detect anomalies
    anomalies = analytics.detect_anomalies(readings_data)
    return anomalies

@router.get("/forecast/{device_id}", response_model=List[ForecastResponse])
def forecast_power_consumption(
    device_id: int,
    horizon_days: int = Query(7, ge=1, le=30),
    db: Session = Depends(get_db)
):
    """Forecast power consumption for the next n days"""
    # Get historical data for training
    end_time = datetime.now()
    start_time = end_time - timedelta(days=30)  # Use last 30 days for training
    
    readings = db.query(PowerReading).filter(
        PowerReading.device_id == device_id,
        PowerReading.timestamp >= start_time,
        PowerReading.timestamp <= end_time
    ).order_by(PowerReading.timestamp).all()
    
    if not readings:
        raise HTTPException(status_code=404, detail="Insufficient historical data for forecasting")
    
    # Convert to list of dictionaries
    readings_data = [
        {
            'timestamp': reading.timestamp,
            'power': reading.power
        }
        for reading in readings
    ]
    
    # Train model and generate forecast
    analytics.train_forecast_model(readings_data)
    forecast = analytics.forecast_power_consumption(readings_data, horizon_days)
    return forecast

@router.get("/trends/{device_id}", response_model=TrendAnalysisResponse)
def analyze_power_trends(
    device_id: int,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    """Analyze power consumption trends"""
    query = db.query(PowerReading).filter(PowerReading.device_id == device_id)
    
    if start_time:
        query = query.filter(PowerReading.timestamp >= start_time)
    if end_time:
        query = query.filter(PowerReading.timestamp <= end_time)
    
    readings = query.order_by(PowerReading.timestamp).all()
    
    if not readings:
        raise HTTPException(status_code=404, detail="No power readings found for the specified period")
    
    # Convert to list of dictionaries
    readings_data = [
        {
            'timestamp': reading.timestamp,
            'power': reading.power
        }
        for reading in readings
    ]
    
    # Analyze trends
    trends = analytics.analyze_power_trends(readings_data)
    return trends

@router.get("/recommendations/{device_id}", response_model=List[RecommendationResponse])
def get_recommendations(
    device_id: int,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    """Get power-saving recommendations"""
    query = db.query(PowerReading).filter(PowerReading.device_id == device_id)
    
    if start_time:
        query = query.filter(PowerReading.timestamp >= start_time)
    if end_time:
        query = query.filter(PowerReading.timestamp <= end_time)
    
    readings = query.order_by(PowerReading.timestamp).all()
    
    if not readings:
        raise HTTPException(status_code=404, detail="No power readings found for the specified period")
    
    # Convert to list of dictionaries
    readings_data = [
        {
            'timestamp': reading.timestamp,
            'power': reading.power
        }
        for reading in readings
    ]
    
    # Generate recommendations
    recommendations = analytics.generate_recommendations(readings_data)
    return recommendations 