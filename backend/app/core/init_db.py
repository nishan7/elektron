from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session

from app.models.device import Device, PowerReading, Alert
from app.core.database import SessionLocal, engine, Base

def init_db(db: Session = None):
    Base.metadata.create_all(bind=engine)
    
    if db is None:
        db = SessionLocal()
        should_close = True
    else:
        should_close = False
    
    try:
        # Check if we already have devices
        if db.query(Device).first():
            return
        
        # Create sample devices
        devices = [
            Device(
                name="Living Room Smart Meter",
                device_type="Smart Meter",
                location="Living Room",
                model="SM-2000",
                manufacturer="EcoTech",
                firmware_version="1.0.0",
                is_active=True
            ),
            Device(
                name="Kitchen Smart Plug",
                device_type="Smart Plug",
                location="Kitchen",
                model="SP-1000",
                manufacturer="PowerSense",
                firmware_version="2.1.0",
                is_active=True
            ),
            Device(
                name="Bedroom Smart Meter",
                device_type="Smart Meter",
                location="Bedroom",
                model="SM-2000",
                manufacturer="EcoTech",
                firmware_version="1.0.0",
                is_active=True
            )
        ]
        
        for device in devices:
            db.add(device)
        db.commit()
        
        # Add power readings for each device
        now = datetime.now()
        for device in devices:
            for i in range(24):  # Last 24 hours of readings
                timestamp = now - timedelta(hours=i)
                reading = PowerReading(
                    device_id=device.id,
                    timestamp=timestamp,
                    voltage=random.uniform(110, 120),
                    current=random.uniform(1, 10),
                    power=random.uniform(100, 1200),
                    energy=random.uniform(0.1, 1.0),
                    power_factor=random.uniform(0.8, 1.0)
                )
                db.add(reading)
        
        # Add some sample alerts
        alerts = [
            Alert(
                device_id=devices[0].id,
                alert_type="High Power Consumption",
                severity="warning",
                message="Power consumption exceeded normal threshold",
                timestamp=now - timedelta(hours=2),
                is_resolved=False
            ),
            Alert(
                device_id=devices[1].id,
                alert_type="Voltage Spike",
                severity="critical",
                message="Dangerous voltage spike detected",
                timestamp=now - timedelta(hours=1),
                is_resolved=False
            ),
            Alert(
                device_id=devices[2].id,
                alert_type="Connection Lost",
                severity="warning",
                message="Device connection temporarily lost",
                timestamp=now - timedelta(minutes=30),
                is_resolved=True
            )
        ]
        
        for alert in alerts:
            db.add(alert)
        
        db.commit()
    finally:
        if should_close:
            db.close()

if __name__ == "__main__":
    init_db() 