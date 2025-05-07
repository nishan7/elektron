import pytest
from unittest.mock import MagicMock, patch
from bson import ObjectId
from datetime import datetime
from models.models import Device, Record, Alert
from services.device import validate_device_data
from constants import ALERT_COLLECTION_NAME

def test_validates_device_data_within_limits():
    mock_db = MagicMock()
    device = Device(id=ObjectId(), name="Device A", max=100)
    data = Record(timestamp=datetime.now(), power=50, device_id=device.id)
    validate_device_data(device, data)
    mock_db[ALERT_COLLECTION_NAME].insert_one.assert_not_called()

def test_raises_alert_when_power_exceeds_max():
    mock_db = MagicMock()
    mock_db[ALERT_COLLECTION_NAME].insert_one = MagicMock()
    device = Device(id=ObjectId(), name="Device B", max=100)
    data = Record(timestamp=datetime.now(), power=150, device_id=device.id)
    with patch("services.device.db", mock_db):
        validate_device_data(device, data)
        mock_db[ALERT_COLLECTION_NAME].insert_one.assert_called_once()

def test_does_not_raise_alert_when_max_is_none():
    mock_db = MagicMock()
    device = Device(id=ObjectId(), name="Device C", max=None)
    data = Record(timestamp=datetime.now(), power=200, device_id=device.id)
    validate_device_data(device, data)
    mock_db[ALERT_COLLECTION_NAME].insert_one.assert_not_called()
