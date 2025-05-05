from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.models.device import Alert, Device
from app.services.alerts import AlertService
from app.schemas.device import AlertResponse, AlertCreate

router = APIRouter()
alert_service = AlertService()

@router.get("", response_model=List[AlertResponse])
def get_all_alerts(
    resolved: Optional[bool] = None,
    severity: Optional[str] = None,
    limit: int = Query(100, ge=1, le=1000),
    skip: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Get all alerts with optional filtering and pagination."""
    query = db.query(Alert)
    
    if resolved is not None:
        query = query.filter(Alert.is_resolved == resolved)
    if severity:
        query = query.filter(Alert.severity.ilike(f"%{severity}%"))
    
    alerts = query.order_by(Alert.timestamp.desc()).offset(skip).limit(limit).all()
    return alerts

@router.post("/{device_id}", response_model=AlertResponse)
def create_alert(
    device_id: int,
    alert: AlertCreate,
    db: Session = Depends(get_db)
):
    """Create a new alert for a device"""
    device = db.query(Device).filter(Device.id == device_id).first()
    if device is None:
        raise HTTPException(status_code=404, detail="Device not found")
    
    db_alert = Alert(
        device_id=device_id,
        alert_type=alert.alert_type,
        severity=alert.severity,
        message=alert.message,
        is_resolved=alert.is_resolved
    )
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert

@router.get("/{device_id}", response_model=List[AlertResponse])
def get_alerts(
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

@router.put("/{alert_id}/resolve", response_model=AlertResponse)
def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    """Mark an alert as resolved"""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.is_resolved = True
    alert.resolved_at = datetime.now()
    db.commit()
    db.refresh(alert)
    return alert

@router.post("/{device_id}/monitor")
def monitor_device(
    device_id: int,
    notification_channels: List[str] = Query(["email", "slack"]),
    db: Session = Depends(get_db)
):
    """Monitor device metrics and generate alerts"""
    device = db.query(Device).filter(Device.id == device_id).first()
    if device is None:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Get latest power reading and health metrics
    latest_reading = db.query(PowerReading).filter(
        PowerReading.device_id == device_id
    ).order_by(PowerReading.timestamp.desc()).first()
    
    latest_health = db.query(DeviceHealth).filter(
        DeviceHealth.device_id == device_id
    ).order_by(DeviceHealth.timestamp.desc()).first()
    
    if not latest_reading:
        raise HTTPException(status_code=404, detail="No power readings found for device")
    
    # Prepare device data for monitoring
    device_data = {
        'name': device.name,
        'power': latest_reading.power,
        'voltage': latest_reading.voltage,
        'temperature': latest_health.temperature if latest_health else None,
        'health_metrics': {
            'health_status': latest_health.health_status if latest_health else 'unknown'
        }
    }
    
    # Monitor device and generate alerts
    alerts = alert_service.monitor_device(device_data)
    
    # Process and send alerts
    results = []
    for alert in alerts:
        success = alert_service.process_alert(alert, notification_channels)
        results.append({
            'alert': alert,
            'sent': success
        })
    
    return {
        'device_id': device_id,
        'alerts_generated': len(alerts),
        'results': results
    } 