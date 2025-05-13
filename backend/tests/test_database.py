import pytest
from unittest.mock import AsyncMock, patch
from core.database import Database

@pytest.mark.asyncio
async def test_connects_to_database_with_valid_uri():
    db = Database()
    with patch("core.database.AsyncIOMotorClient") as mock_client:
        await db.connect_to_database()
        mock_client.assert_called_once_with("mongodb://root:example@localhost:27017/elektron?authSource=admin")
        assert db.client is not None
        assert db.db is not None

@pytest.mark.asyncio
async def test_does_not_fail_when_closing_connection_without_client():
    db = Database()
    await db.close_database_connection()  # Should not raise any exceptions

@pytest.mark.asyncio
async def test_closes_database_connection_successfully():
    db = Database()
    db.client = AsyncMock()
    await db.close_database_connection()
    db.client.close.assert_called_once()