from constants import RECORD_COLLECTION_NAME, ALERT_COLLECTION_NAME, DEVICE_COLLECTION_NAME
from core.sync_database import db
from models.models import Device, Alert, Record


def validate_device_data(device: dict, record: Record):
    device_id = device["_id"]
    
    # Update max power value if current power is higher
    if "max" not in device or record.power > device["max"]:
        db[DEVICE_COLLECTION_NAME].update_one(
            {"_id": device_id},
            {"$set": {"max": record.power}}
        )


def update_device_threshold(device_id: str, threshold: float):
    """Update a device's power threshold"""
    result = db[DEVICE_COLLECTION_NAME].update_one(
        {"_id": device_id},
        {"$set": {"power_threshold": threshold}}
    )
    
    if result.matched_count == 0:
        raise ValueError(f"Device with id {device_id} does not exist")
        
    return result.modified_count > 0


def get_device_threshold(device_id):
    """Get the device's power threshold if set"""
    device = db[DEVICE_COLLECTION_NAME].find_one({"_id": device_id})
    if not device:
        raise ValueError(f"Device with id {device_id} does not exist")
        
    return device.get("power_threshold")

