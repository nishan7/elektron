from datetime import datetime, timedelta, date
import logging

from constants import DEVICE_COLLECTION_NAME, RECORD_COLLECTION_NAME, ALERT_COLLECTION_NAME, SETTINGS_COLLECTION_NAME
from core.sync_database import db
from models.models import Record, Alert, Device
from services.device import validate_device_data
from bson import ObjectId

logger = logging.getLogger(__name__)

def update_record(data: dict):
    validated_data = Record.model_validate(data)
    device_id_obj = validated_data.device_id
    
    # Try to find the device
    device = db[DEVICE_COLLECTION_NAME].find_one({"_id": device_id_obj})
    
    if not device:
        # Device not found, automatically create it
        logger.warning(f"Device with id {device_id_obj} not found. Creating new device entry.")
        new_device_data = {
            "_id": device_id_obj,
            "name": f"Device {str(device_id_obj)[-6:]}",
            "device_type": "Unknown",
            "location": "Unknown",
            "model": "Unknown",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "power_threshold": None
        }
        # Validate using Pydantic model before inserting
        try:
            device_model = Device.model_validate(new_device_data)
            insert_result = db[DEVICE_COLLECTION_NAME].insert_one(device_model.model_dump(by_alias=True))
            if insert_result.inserted_id:
                logger.info(f"Successfully created new device with id {device_id_obj}")
                # Fetch the newly created device to proceed
                device = db[DEVICE_COLLECTION_NAME].find_one({"_id": device_id_obj})
            else:
                logger.error(f"Failed to insert new device with id {device_id_obj}")
                raise ValueError(f"Failed to create device with id {device_id_obj}")
        except Exception as e:
            logger.exception(f"Error validating or inserting new device {device_id_obj}: {e}")
            raise ValueError(f"Failed to create device with id {device_id_obj}")
            
    # Proceed with inserting the record
    db[RECORD_COLLECTION_NAME].insert_one(validated_data.model_dump(by_alias=True))
    
    # Update device status or other validations if necessary
    # validate_device_data(device, validated_data) # Keep this if it updates device status
    
    # Check if power threshold is exceeded
    check_power_threshold(device, validated_data)

def check_power_threshold(device: dict, record: Record):
    """Check if the power reading exceeds the device's threshold and create an alert if needed"""
    device_id = device["_id"]
    power_threshold = device.get("power_threshold")
    
    # If device has no threshold, check global settings
    if not power_threshold:
        settings = db[SETTINGS_COLLECTION_NAME].find_one({})
        if settings and "alertThreshold" in settings and settings["alertThreshold"] is not None:
            power_threshold = float(settings["alertThreshold"])
            # Log that the global threshold is being used
            logger.info(f"Using global power threshold {power_threshold}W for device {device_id}")
    
    # If no threshold is set or power is below threshold, do nothing
    if not power_threshold or record.power <= power_threshold:
        return
        
    # Log the threshold exceedance
    logger.info(f"Power threshold exceeded: {record.power}W > {power_threshold}W for device {device_id}")
        
    # Check if there's already an unresolved alert for this device
    existing_alert = db[ALERT_COLLECTION_NAME].find_one({
        "device_id": device_id,
        "metric": "power",
        "resolved": False
    })
    
    if existing_alert:
        # Alert already exists, no need to create a new one
        logger.info(f"Power threshold exceeded but alert already exists for device {device_id}")
        return
        
    # Create a new alert
    device_name = device.get("name", "Unknown Device")
    severity = "critical" if record.power > power_threshold * 1.5 else "warning"
    
    alert_data = {
        "device_id": device_id,
        "timestamp": datetime.utcnow(),
        "severity": severity,
        "message": f"Power consumption exceeded threshold: {record.power}W > {power_threshold}W on device '{device_name}'",
        "metric": "power",
        "value": record.power,
        "threshold": power_threshold,
        "resolved": False
    }
    
    alert = Alert.model_validate(alert_data)
    db[ALERT_COLLECTION_NAME].insert_one(alert.model_dump(by_alias=True))
    logger.info(f"Created power threshold alert for device {device_id}")


class RecordFetcher:
    def __init__(self, db):
        self.collection = db[RECORD_COLLECTION_NAME]

    def get_records_since(self, delta: timedelta):
        now = datetime.utcnow()
        time_threshold = now - delta
        return self.collection.find({"timestamp": {"$gte": time_threshold}})

    def get_records_between(self, start_time: datetime, end_time: datetime):
        return self.collection.find({"timestamp": {"$gte": start_time, "$lte": end_time}})

    def last_5_minutes(self):
        now = datetime.utcnow()
        start_time = now - timedelta(minutes=5)
        return self.get_records_between(start_time, now)

    def last_10_minutes(self):
        now = datetime.utcnow()
        start_time = now - timedelta(minutes=10)
        return self.get_records_between(start_time, now)

    def last_30_minutes(self):
        now = datetime.utcnow()
        start_time = now - timedelta(minutes=30)
        return self.get_records_between(start_time, now)

    def last_1_hour(self):
        now = datetime.utcnow()
        start_time = now - timedelta(hours=1)
        return self.get_records_between(start_time, now)

    def last_1_day(self):
        now = datetime.utcnow()
        start_time = now - timedelta(days=1)
        return self.get_records_between(start_time, now)

    def get_records_for_day(self, day: date):
        start_datetime = datetime.combine(day, datetime.min.time())
        end_datetime = datetime.combine(day, datetime.max.time())
        return self.get_records_between(start_datetime, end_datetime)


# Usage Example
if __name__ == '__main__':
    fetcher = RecordFetcher(db)
    records_5m = fetcher.last_5_minutes()
    records_10m = fetcher.last_10_minutes()
    records_30m = fetcher.last_30_minutes()
    records_1h = fetcher.last_1_hour()
    records_1d = fetcher.last_1_day()

    print(f"Records in last 5 minutes: {len(records_5m)}")
    print(f"Records in last 10 minutes: {len(records_10m)}")
    print(f"Records in last 30 minutes: {len(records_30m)}")
    print(f"Records in last 1 hour: {len(records_1h)}")
    print(f"Records in last 1 day: {len(records_1d)}")

if __name__ == '__main__':
    update_record(
        {
            "device_id": "681012976bb14e7b76a00631",
            "power": 100.0,
            "timestamp": datetime.now()
        }
    )
