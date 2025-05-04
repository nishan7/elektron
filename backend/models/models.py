from datetime import datetime
from typing import Optional

from bson import ObjectId
from pydantic import Field
from pydantic_mongo import PydanticObjectId
from pydantic import Field, validator
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

class AlertResponse(Alert):
    id: PydanticObjectId
    device_name: str
    timestamp: datetime


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
