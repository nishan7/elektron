from datetime import datetime
from typing import Optional

from bson import ObjectId
from pydantic import Field
from pydantic_mongo import PydanticObjectId
from pydantic import Field, validator
from models.base import Base


class Device(Base):
    name: str
    device_type: str
    location: Optional[str] = None
    model: Optional[str] = None
    manufacturer: Optional[str] = None
    firmware_version: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    max: Optional[float] = None
    power_threshold: Optional[float] = None

class Record(Base):
    device_id: PydanticObjectId
    power: float
    timestamp: datetime

class Alert(Base):
    device_id: PydanticObjectId
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    severity: str = Field(..., description="Alert severity: info, warning, critical")
    message: str
    metric: str
    value: float
    threshold: float
    resolved: bool = False
    resolved_at: Optional[datetime] = None
    
    @validator('severity')
    def validate_severity(cls, v):
        allowed_values = ['info', 'warning', 'critical']
        if v not in allowed_values:
            raise ValueError(f'Severity must be one of {allowed_values}')
        return v

class Settings(Base):
    emailNotifications: bool = True
    alertThreshold: Optional[float] = Field(None, description="Power threshold in Watts (W) that will trigger alerts when exceeded")
    refreshInterval: Optional[int] = Field(30, description="Dashboard refresh interval in seconds")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


    # class Config:
    #     validate_by_name = True
    #     arbitrary_types_allowed = True
    #     json_encoders = {ObjectId: str}

# class HourlyStats(Base):
#     date: datetime
#     mean: float
#     min: float
#     max: float
#     std: float
#     device_id: Optional[PyObjectId]
#
# class Alert(Base):
#     alert_type: str = Field(..., description="Type of alert: power_spike, voltage_fluctuation, device_failure, etc.")
#     severity: str = Field(..., description="Alert severity: info, warning, critical")
#     message: str
#     device_id: Optional[PyObjectId]
#     timestamp: datetime = Field(default_factory=datetime.utcnow)

