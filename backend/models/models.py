from datetime import datetime
from typing import Optional

from bson import ObjectId
from pydantic import Field, BaseModel
from pydantic_mongo import PydanticObjectId
from models.base import Base


class Device(Base):
    name: str
    type: Optional[str] = None
    location: Optional[str] = None
    model: Optional[str] = None
    manufacturer: Optional[str] = None
    firmware_version: Optional[str] = None
    is_active: bool = True
    status: Optional[str] = 'active'
    health: Optional[str] = 'good'
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    max: Optional[float] = None


class Record(Base):
    device_id: PydanticObjectId
    power: float
    timestamp: datetime


class Alert(Base):
    device_id: PydanticObjectId
    start_time: datetime
    end_time: Optional[datetime] = None
    message: str
    metric: str
    type: Optional[str] = 'warning'
    resolved: bool = False
    device_name: Optional[str] = Field(None, alias="deviceName")
    location: Optional[str] = Field(None, alias="location")

class AlertResponse(Alert):
    id: PydanticObjectId = Field(alias="_id")
    timestamp: datetime

    class Config:
        allow_population_by_field_name = True
        by_alias = True
        json_encoders = {
            ObjectId: str,
            PydanticObjectId: str,
            datetime: lambda dt: dt.isoformat()
        }

    #
    # id: '5',
    # deviceId: '4',
    # deviceName: 'Kitchen Appliances',
    # type: 'info',
    # message: 'Regular maintenance check completed',
    # timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
    # resolved: true,

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

# Nested model for Notification Settings
class NotificationSettings(BaseModel):
    email: bool = True
    sms: bool = False
    criticalAlerts: bool = True # Using camelCase to match input example

# Nested model for Threshold Settings
class ThresholdSettings(BaseModel):
    powerAlert: Optional[float] = Field(None, alias="powerAlert") # W or kW? Assume W for now
    costAlert: Optional[float] = Field(None, alias="costAlert") # Cost per hour? day?
    criticalThreshold: Optional[float] = Field(None, alias="criticalThreshold") # Power? Cost?
    dataRefreshInterval: Optional[int] = Field(30, alias="dataRefreshInterval") # Seconds
    timeZone: Optional[str] = Field("UTC", alias="timeZone")

# Main Settings model using nested models
class Settings(Base): 
    notifications: NotificationSettings = Field(default_factory=NotificationSettings)
    thresholds: ThresholdSettings = Field(default_factory=ThresholdSettings)

    class Config:
        allow_population_by_field_name = True 
        validate_assignment = True 
        json_encoders = { 
            ObjectId: str,
            PydanticObjectId: str
        }
        # Keep aliases consistent with field names unless MongoDB needs snake_case
        # If MongoDB stores camelCase, no by_alias needed just for outputting camelCase.
        # If DB stores snake_case, add `alias_generator = to_camel`, `by_alias=True`.
        # Assuming DB will store fields as named (camelCase here).
