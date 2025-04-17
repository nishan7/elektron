from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.device import Device, PowerReading, DeviceHealth, Alert
from app.schemas.device import (
    DeviceCreate, 
    DeviceResponse, 
    PowerReadingCreate, 
    PowerReadingResponse,
    DeviceHealthResponse,
    AlertResponse
)

router = APIRouter()

@router.post("/", response_model=DeviceResponse)
def create_device(device: DeviceCreate, db: Session = Depends(get_db)):
    """Create a new device"""
    db_device = Device(
        name=device.name,
        device_type=device.device_type,
        location=device.location,
        model=device.model,
        manufacturer=device.manufacturer,
        firmware_version=device.firmware_version
    )
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    return db_device

@router.get("/", response_model=List[DeviceResponse])
def get_devices(
    skip: int = 0, 
    limit: int = 100, 
    active_only: bool = False,
    db: Session = Depends(get_db)
):
    """Get all devices with optional filtering"""
    query = db.query(Device)
    if active_only:
        query = query.filter(Device.is_active == True)
    return query.offset(skip).limit(limit).all()

@router.get("/{device_id}", response_model=DeviceResponse)
def get_device(device_id: int, db: Session = Depends(get_db)):
    """Get a specific device by ID"""
    device = db.query(Device).filter(Device.id == device_id).first()
    if device is None:
        raise HTTPException(status_code=404, detail="Device not found")
    return device

@router.put("/{device_id}", response_model=DeviceResponse)
def update_device(device_id: int, device: DeviceCreate, db: Session = Depends(get_db)):
    """Update a device"""
    db_device = db.query(Device).filter(Device.id == device_id).first()
    if db_device is None:
        raise HTTPException(status_code=404, detail="Device not found")
    
    for key, value in device.dict().items():
        setattr(db_device, key, value)
    
    db.commit()
    db.refresh(db_device)
    return db_device

@router.delete("/{device_id}")
def delete_device(device_id: int, db: Session = Depends(get_db)):
    """Delete a device"""
    db_device = db.query(Device).filter(Device.id == device_id).first()
    if db_device is None:
        raise HTTPException(status_code=404, detail="Device not found")
    
    db.delete(db_device)
    db.commit()
    return {"message": "Device deleted successfully"}

@router.post("/{device_id}/readings", response_model=PowerReadingResponse)
def create_power_reading(
    device_id: int, 
    reading: PowerReadingCreate, 
    db: Session = Depends(get_db)
):
    """Create a new power reading for a device"""
    device = db.query(Device).filter(Device.id == device_id).first()
    if device is None:
        raise HTTPException(status_code=404, detail="Device not found")
    
    db_reading = PowerReading(
        device_id=device_id,
        voltage=reading.voltage,
        current=reading.current,
        power=reading.power,
        energy=reading.energy,
        power_factor=reading.power_factor
    )
    db.add(db_reading)
    db.commit()
    db.refresh(db_reading)
    return db_reading

@router.get("/{device_id}/readings", response_model=List[PowerReadingResponse])
def get_power_readings(
    device_id: int,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get power readings for a device with optional time filtering"""
    query = db.query(PowerReading).filter(PowerReading.device_id == device_id)
    
    if start_time:
        query = query.filter(PowerReading.timestamp >= start_time)
    if end_time:
        query = query.filter(PowerReading.timestamp <= end_time)
    
    return query.order_by(PowerReading.timestamp.desc()).limit(limit).all()

@router.get("/{device_id}/health", response_model=List[DeviceHealthResponse])
def get_device_health(
    device_id: int,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get health metrics for a device"""
    query = db.query(DeviceHealth).filter(DeviceHealth.device_id == device_id)
    
    if start_time:
        query = query.filter(DeviceHealth.timestamp >= start_time)
    if end_time:
        query = query.filter(DeviceHealth.timestamp <= end_time)
    
    return query.order_by(DeviceHealth.timestamp.desc()).limit(limit).all()

@router.get("/{device_id}/alerts", response_model=List[AlertResponse])
def get_device_alerts(
    device_id: int,
    resolved: Optional[bool] = None,
    severity: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get alerts for a device with optional filtering"""
    query = db.query(Alert).filter(Alert.device_id == device_id)
    
    if resolved is not None:
        query = query.filter(Alert.is_resolved == resolved)
    if severity:
        query = query.filter(Alert.severity == severity)
    
    return query.order_by(Alert.timestamp.desc()).limit(limit).all() 