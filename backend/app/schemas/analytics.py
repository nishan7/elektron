from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class AnomalyResponse(BaseModel):
    timestamp: datetime
    power: float
    anomaly_score: float
    is_anomaly: bool

class ForecastResponse(BaseModel):
    timestamp: datetime
    power: float

class DailyStats(BaseModel):
    date: datetime
    mean: float
    min: float
    max: float
    std: float

class TrendAnalysisResponse(BaseModel):
    daily_stats: List[DailyStats]
    peak_hours: List[int]
    trend_slope: float
    trend_intercept: float

class RecommendationResponse(BaseModel):
    type: str
    message: str
    potential_savings: str 