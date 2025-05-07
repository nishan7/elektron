import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta, date
from services.records import RecordFetcher, update_record
from bson import ObjectId

from constants import DEVICE_COLLECTION_NAME, RECORD_COLLECTION_NAME


# def test_updates_record_successfully_with_valid_data():
#     mock_db = MagicMock()
#     mock_db[DEVICE_COLLECTION_NAME].find_one.return_value = {"_id": ObjectId(), "name": "Device A"}
#     mock_db[RECORD_COLLECTION_NAME].insert_one.return_value = None
#     mock_db[RECORD_COLLECTION_NAME].insert_one = MagicMock()
#     data = {"device_id": ObjectId(), "power": 50.0, "timestamp": datetime.utcnow()}
#     with patch("services.records.db", mock_db):
#         update_record(data)
#         mock_db[RECORD_COLLECTION_NAME].insert_one.assert_called_once()
#
# def test_raises_error_when_device_does_not_exist():
#     mock_db = MagicMock()
#     mock_db[DEVICE_COLLECTION_NAME].find_one.return_value = None
#     mock_db[RECORD_COLLECTION_NAME].insert_one = MagicMock()
#     data = {"device_id": ObjectId(), "power": 50.0, "timestamp": datetime.utcnow()}
#     with patch("services.records.db", mock_db):
#         with pytest.raises(ValueError, match="Device with id .* does not exist"):
#             update_record(data)

def test_fetches_records_within_last_5_minutes():
    mock_db = MagicMock()
    now = datetime.utcnow()
    mock_db[RECORD_COLLECTION_NAME].find.return_value = [{"timestamp": now - timedelta(minutes=3)}]
    fetcher = RecordFetcher(mock_db)
    records = fetcher.last_5_minutes()
    assert len(records) == 1

def test_fetches_records_for_specific_day():
    mock_db = MagicMock()
    specific_day = date(2023, 1, 1)
    mock_db[RECORD_COLLECTION_NAME].find.return_value = [
        {"timestamp": datetime(2023, 1, 1, 12, 0, 0)},
        {"timestamp": datetime(2023, 1, 1, 18, 0, 0)},
    ]
    fetcher = RecordFetcher(mock_db)
    records = fetcher.get_records_for_day(specific_day)
    assert len(records) == 2