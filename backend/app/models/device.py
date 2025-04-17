from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    device_type = Column(String, nullable=False)  # smart_plug, smart_meter, etc.
    location = Column(String)
    model = Column(String)
    manufacturer = Column(String)
    firmware_version = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    power_readings = relationship("PowerReading", back_populates="device")
    health_metrics = relationship("DeviceHealth", back_populates="device")
    alerts = relationship("Alert", back_populates="device")

class PowerReading(Base):
    __tablename__ = "power_readings"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"))
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    voltage = Column(Float)  # in volts
    current = Column(Float)  # in amperes
    power = Column(Float)    # in watts
    energy = Column(Float)   # in kilowatt-hours
    power_factor = Column(Float)
    
    # Relationships
    device = relationship("Device", back_populates="power_readings")

class DeviceHealth(Base):
    __tablename__ = "device_health"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"))
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    temperature = Column(Float)  # in celsius
    voltage_fluctuation = Column(Float)  # percentage
    load_percentage = Column(Float)  # percentage
    health_status = Column(String)  # good, warning, critical
    
    # Relationships
    device = relationship("Device", back_populates="health_metrics")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"))
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    alert_type = Column(String)  # power_spike, voltage_fluctuation, device_failure, etc.
    severity = Column(String)  # info, warning, critical
    message = Column(String)
    is_resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    device = relationship("Device", back_populates="alerts") 