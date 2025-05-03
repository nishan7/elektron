from constants import RECORD_COLLECTION_NAME, ALERT_COLLECTION_NAME
from core.sync_database import db
from models.models import Device, Alert, Record


def validate_device_data(device: Device, data: Record):
    """Validates device data against the Device model."""
    max_val = device.max
    if max_val and data.power > max_val:
        reason = f"Metric {data.power} exceeds maximum value {max_val} for device {device.name}"
        alert = Alert(
            device_id=device.id,
            start_time=data.timestamp,
            reason=reason,
            metric=str(data.power),
        )
        db[ALERT_COLLECTION_NAME].insert_one(alert.model_dump(by_alias=True))

