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

class Record(Base):
    device_id: PydanticObjectId
    power: float
    timestamp: datetime



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

