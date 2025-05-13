import pytest
from unittest.mock import AsyncMock
from bson import ObjectId
from models.models import Device
from api.device import DeviceAPI

@pytest.mark.asyncio
async def test_retrieves_active_devices_with_results():
    mock_db = AsyncMock()
    mock_db.db["devices"].find.return_value.__aiter__.return_value = [
        {"_id": ObjectId(), "name": "Device 1", "is_active": True},
        {"_id": ObjectId(), "name": "Device 2", "is_active": True},
    ]
    api = DeviceAPI()
    api.db = mock_db

    result = await api.get_active_devices()
    assert len(result) == 2
    assert result[0].name == "Device 1"
    assert result[1].name == "Device 2"

@pytest.mark.asyncio
async def test_retrieves_active_devices_with_no_results():
    mock_db = AsyncMock()
    mock_db.db["devices"].find.return_value.__aiter__.return_value = []
    api = DeviceAPI()
    api.db = mock_db

    result = await api.get_active_devices()
    assert len(result) == 0