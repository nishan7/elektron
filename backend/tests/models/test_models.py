from datetime import datetime
from pydantic import ValidationError
from bson import ObjectId
from models.models import Device, Record, Alert, AlertResponse
from pydantic_mongo import PydanticObjectId


def test_device_model():
    device = Device(
        name="Test Device",
        type="Sensor",
        location="Warehouse",
        model="X100",
        manufacturer="TestCorp",
        firmware_version="1.0.0",
        max=100.0
    )
    assert device.name == "Test Device"
    assert device.type == "Sensor"
    assert device.is_active is True
    assert device.status == "active"
    assert device.health == "good"
    assert device.created_at is not None


def record_model():
    record = Record(
        device_id=PydanticObjectId(ObjectId()),
        power=50.5,
        timestamp=datetime.utcnow()
    )
    assert record.power == 50.5
    assert isinstance(record.device_id, PydanticObjectId)
    assert record.timestamp is not None


def test_alert_model():
    alert = Alert(
        device_id=PydanticObjectId(ObjectId()),
        start_time=datetime.utcnow(),
        message="Power spike detected",
        metric="power",
        type="critical",
        resolved=False
    )
    assert alert.message == "Power spike detected"
    assert alert.metric == "power"
    assert alert.type == "critical"
    assert alert.resolved is False
    assert alert.start_time is not None


def test_alert_response_model():
    alert_response = AlertResponse(
        id=PydanticObjectId(ObjectId()),
        device_id=PydanticObjectId(ObjectId()),
        device_name="Test Device",
        start_time=datetime.utcnow(),
        message="Power spike detected",
        metric="power",
        type="critical",
        resolved=True,
        timestamp=datetime.utcnow()
    )
    assert alert_response.device_name == "Test Device"
    assert alert_response.resolved is True
    assert alert_response.type == "critical"
    assert alert_response.timestamp is not None


def test_device_model_validation():
    try:
        Device(name=None)
    except ValidationError as e:
        assert "name" in str(e)
