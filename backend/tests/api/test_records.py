import pytest
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime
from bson import ObjectId

from api.records import RecordsAPI


@pytest.mark.asyncio
async def test_retrieves_records_within_timeframe():
    mock_db = MagicMock()
    mock_cursor = AsyncMock()
    mock_cursor.__aiter__.return_value = [
        {"_id": ObjectId(), "timestamp": datetime(2023, 1, 1), "device_id": ObjectId(), "power": 100}
    ]
    mock_db.db["records"].find.return_value = mock_cursor

    api = RecordsAPI()
    api.db = mock_db

    result = await api.get_records_within_timeframe(
        start_time="2023-01-01T00:00:00Z",
        end_time="2023-01-02T00:00:00Z",
        device_id=str(ObjectId())
    )

    assert len(result) == 1
    assert result[0].power == 100

@pytest.mark.asyncio
async def returns_empty_list_when_no_records_found():
    mock_db = MagicMock()
    mock_cursor = AsyncMock()
    mock_cursor.__aiter__.return_value = []
    mock_db.db["records"].find.return_value = mock_cursor

    api = RecordsAPI()
    api.db = mock_db

    result = await api.get_records_within_timeframe(
        start_time="2023-01-01T00:00:00Z",
        end_time="2023-01-02T00:00:00Z"
    )

    assert result == []

@pytest.mark.asyncio
async def calculates_monthly_summary_correctly():
    mock_db = MagicMock()
    mock_cursor = AsyncMock()
    mock_cursor.__aiter__.return_value = [
        {"_id": 1, "power": 300},
        {"_id": 2, "power": 200}
    ]
    mock_db.db["records"].aggregate.return_value = mock_cursor

    api = RecordsAPI()
    api.db = mock_db

    result = await api.get_monthly_summary(year=2023)

    assert len(result) == 12
    assert result[0]["month"] == "Jan"
    assert result[0]["power"] == 300
    assert result[1]["month"] == "Feb"
    assert result[1]["power"] == 200

@pytest.mark.asyncio
async def handles_empty_monthly_summary():
    mock_db = MagicMock()
    mock_cursor = AsyncMock()
    mock_cursor.__aiter__.return_value = []
    mock_db.db["records"].aggregate.return_value = mock_cursor

    api = RecordsAPI()
    api.db = mock_db

    result = await api.get_monthly_summary(year=2023)

    assert len(result) == 12
    assert all(month["power"] == 0 for month in result)