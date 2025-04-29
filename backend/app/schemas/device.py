#   elektron/backend/app/schemas/device.py
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class DeviceBase(BaseModel):
    name: str
    device_type: str
    location: Optional[str] = None
    model: Optional[str] = None
    manufacturer: Optional[str] = None
    firmware_version: Optional[str] = None

class DeviceCreate(DeviceBase):
    pass

class DeviceResponse(DeviceBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

#   Removed: PowerReadingBase, PowerReadingCreate, PowerReadingResponse

class DeviceHealthBase(BaseModel):
    temperature: float = Field(..., description="Temperature in celsius")
    voltage_fluctuation: float = Field(..., description="Voltage fluctuation percentage")
    load_percentage: float = Field(..., description="Load percentage")
    health_status: str = Field(..., description="Health status: good, warning, critical")

class DeviceHealthResponse(DeviceHealthBase):
    id: int
    device_id: int
    timestamp: datetime

    class Config:
        orm_mode = True

class AlertBase(BaseModel):
    alert_type: str = Field(
        ..., description="Type of alert: power_spike, voltage_fluctuation, device_failure, etc."
    )
    severity: str = Field(..., description="Alert severity: info, warning, critical")
    message: str
    is_resolved: bool = False

class AlertCreate(AlertBase):
    device_id: int

class AlertResponse(AlertBase):
    id: int
    device_id: int
    timestamp: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        orm_mode = True