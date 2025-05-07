import pytest
from fastapi import HTTPException
from bson import ObjectId
from unittest.mock import AsyncMock, MagicMock

from api.base import BaseCRUDAPI
from models.base import Base


@pytest.mark.asyncio
async def test_retrieves_single_item_by_id():
    mock_db = AsyncMock()
    mock_collection = AsyncMock()
    id = ObjectId()
    mock_collection.find_one = AsyncMock(return_value={"_id":id })
    mock_db.db = {"test_collection": mock_collection}

    api = BaseCRUDAPI(model=Base, collection_name="test_collection")
    api.db = mock_db

    result = await api.get_one(str(id))
    assert result.id == id

@pytest.mark.asyncio
async def  test_raises_404_when_item_not_found():
    mock_db = AsyncMock()
    mock_collection = AsyncMock()
    mock_collection.find_one = AsyncMock(return_value=None)
    mock_db.db = {"test_collection": mock_collection}
    api = BaseCRUDAPI(model=Base, collection_name="test_collection")
    api.db = mock_db

    with pytest.raises(HTTPException) as exc_info:
        await api.get_one(str(ObjectId()))
    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def  test_creates_new_item_successfully():
    mock_db = AsyncMock()
    mock_collection = AsyncMock()
    mock_collection.insert_one = AsyncMock()
    mock_collection.insert_one.return_value.inserted_id = ObjectId()
    mock_collection.find_one = AsyncMock(return_value={"_id": ObjectId(), "name": "New Item"})
    mock_db.db = {"test_collection": mock_collection}
    api = BaseCRUDAPI(model=DummyModel, collection_name="test_collection")
    api.db = mock_db

    result = await api.create({"name": "New Item"})
    assert result.id is not None
    assert result.name == "New Item"

@pytest.mark.asyncio
async def  test_updates_existing_item():
    mock_db = AsyncMock()
    mock_collection = AsyncMock()
    mock_collection.update_one = AsyncMock()
    mock_collection.update_one.return_value.matched_count = 1
    mock_collection.find_one = AsyncMock(return_value={"_id": ObjectId(), "name": "Updated Item"})
    mock_db.db = {"test_collection": mock_collection}
    api = BaseCRUDAPI(model=DummyModel, collection_name="test_collection")
    api.db = mock_db

    result = await api.put(str(ObjectId()), {"name": "Updated Item"})
    assert result.id is not None
    assert result.name == "Updated Item"

@pytest.mark.asyncio
async def  test_raises_404_when_updating_nonexistent_item():
    mock_db = AsyncMock()
    mock_collection = AsyncMock()
    mock_collection.update_one = AsyncMock()
    mock_collection.update_one.return_value.matched_count = 0
    mock_db.db = {"test_collection": mock_collection}
    api = BaseCRUDAPI(model=Base, collection_name="test_collection")
    api.db = mock_db

    with pytest.raises(HTTPException) as exc_info:
        await api.put(str(ObjectId()), {"name": "Nonexistent Item"})
    assert exc_info.value.status_code == 404

@pytest.mark.asyncio
async def  test_deletes_item_successfully():
    mock_db = AsyncMock()
    mock_collection = AsyncMock()
    mock_collection.delete_one = AsyncMock()
    mock_collection.delete_one.return_value.deleted_count = 1
    mock_db.db = {"test_collection": mock_collection}
    api = BaseCRUDAPI(model=Base, collection_name="test_collection")
    api.db = mock_db

    result = await api.delete(str(ObjectId()))
    assert result["message"] == "Base deleted successfully"

@pytest.mark.asyncio
async def  test_raises_404_when_deleting_nonexistent_item():
    mock_db = AsyncMock()
    mock_collection = AsyncMock()
    mock_collection.delete_one = AsyncMock()
    mock_collection.delete_one.return_value.deleted_count = 0
    mock_db.db = {"test_collection": mock_collection}
    api = BaseCRUDAPI(model=Base, collection_name="test_collection")
    api.db = mock_db

    with pytest.raises(HTTPException) as exc_info:
        await api.delete(str(ObjectId()))
    assert exc_info.value.status_code == 404


import pytest
from unittest.mock import AsyncMock, MagicMock
from bson import ObjectId
from fastapi import HTTPException

from api.base import BaseCRUDAPI
from models.base import Base


# Dummy model for testing
class DummyModel(Base):
    name: str = "Test"


@pytest.mark.asyncio
async def test_get_one_success():
    mock_db = AsyncMock()
    mock_db.db = {"dummy": AsyncMock()}
    mock_db.db["dummy"].find_one = AsyncMock(return_value={"_id": ObjectId(), "name": "Test"})

    api = BaseCRUDAPI(model=DummyModel, collection_name="dummy")
    api.db = mock_db

    result = await api.get_one(str(ObjectId()))
    assert isinstance(result, DummyModel)
    assert result.name == "Test"


@pytest.mark.asyncio
async def test_get_one_not_found():
    mock_db = AsyncMock()
    mock_db.db = {"dummy": AsyncMock()}
    mock_db.db["dummy"].find_one = AsyncMock(return_value=None)

    api = BaseCRUDAPI(model=DummyModel, collection_name="dummy")
    api.db = mock_db

    with pytest.raises(HTTPException) as exc_info:
        await api.get_one(str(ObjectId()))
    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_delete_success():
    mock_db = AsyncMock()
    mock_db.db = {"dummy": AsyncMock()}
    mock_db.db["dummy"].delete_one = AsyncMock()
    mock_db.db["dummy"].delete_one.return_value.deleted_count = 1

    api = BaseCRUDAPI(model=DummyModel, collection_name="dummy")
    api.db = mock_db

    response = await api.delete(str(ObjectId()))
    assert response["message"] == "DummyModel deleted successfully"


@pytest.mark.asyncio
async def test_delete_not_found():
    mock_db = AsyncMock()
    mock_db.db = {"dummy": AsyncMock()}
    mock_db.db["dummy"].delete_one = AsyncMock()
    mock_db.db["dummy"].delete_one.return_value.deleted_count = 0

    api = BaseCRUDAPI(model=DummyModel, collection_name="dummy")
    api.db = mock_db

    with pytest.raises(HTTPException) as exc_info:
        await api.delete(str(ObjectId()))
    assert exc_info.value.status_code == 404