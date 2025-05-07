import pytest
from unittest.mock import AsyncMock, MagicMock
from bson import ObjectId
from datetime import datetime
from fastapi import HTTPException

from api.alerts import AlertsAPI


@pytest.mark.asyncio
async def retrieves_alerts_within_timeframe():
    mock_db = AsyncMock()
    mock_db.db["alerts"].find.return_value.__aiter__.return_value = [
        {"_id": ObjectId(), "start_time": datetime(2023, 1, 1), "device_id": ObjectId()},
        {"_id": ObjectId(), "start_time": datetime(2023, 1, 2), "device_id": ObjectId()},
    ]
    api = AlertsAPI()
    api.db = mock_db
    api.get_enriched_alerts = AsyncMock(side_effect=lambda doc: {**doc, "device_name": "Device A"})

    result = await api.get_records_within_timeframe(
        start_time="2023-01-01T00:00:00Z", end_time="2023-01-02T23:59:59Z"
    )
    assert len(result) == 2
    assert result[0]["device_name"] == "Device A"

@pytest.mark.asyncio
async def retrieves_alerts_with_no_timeframe():
    mock_db = AsyncMock()
    mock_db.db["alerts"].find.return_value.__aiter__.return_value = [
        {"_id": ObjectId(), "start_time": datetime(2023, 1, 1), "device_id": ObjectId()},
    ]
    api = AlertsAPI()
    api.db = mock_db
    api.get_enriched_alerts = AsyncMock(side_effect=lambda doc: {**doc, "device_name": "Device B"})

    result = await api.get_records_within_timeframe()
    assert len(result) == 1
    assert result[0]["device_name"] == "Device B"

@pytest.mark.asyncio
async def retrieves_alerts_with_invalid_device_id():
    mock_db = AsyncMock()
    api = AlertsAPI()
    api.db = mock_db

    with pytest.raises(HTTPException):
        await api.get_records_within_timeframe(device_id="invalid_id")

@pytest.mark.asyncio
async def retrieves_alerts_with_no_results():
    mock_db = AsyncMock()
    mock_db.db["alerts"].find.return_value.__aiter__.return_value = []
    api = AlertsAPI()
    api.db = mock_db

    result = await api.get_records_within_timeframe(
        start_time="2023-01-01T00:00:00Z", end_time="2023-01-02T23:59:59Z"
    )
    assert len(result) == 0