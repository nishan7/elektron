from datetime import datetime

from constants import DEVICE_COLLECTION_NAME, RECORD_COLLECTION_NAME
from core.sync_database import db
from models.models import Record, Device  # Adjust import path if necessary
from services.device import validate_device_data


def update_record(data: dict):
    validated_data = Record.model_validate(data)
    device = db[DEVICE_COLLECTION_NAME].find_one({"_id": validated_data.device_id})
    if not device:
        raise ValueError(f"Device with id {validated_data.device_id} does not exist")
    db[RECORD_COLLECTION_NAME].insert_one(validated_data.model_dump(by_alias=True))
    validate_device_data(Device(**device), validated_data)




from datetime import datetime, timedelta, date


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
