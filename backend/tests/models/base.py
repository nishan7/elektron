import pytest
from fastapi.testclient import TestClient
from fastapi import FastAPI
from pydantic import BaseModel
from pydantic_mongo import PydanticObjectId
from bson import ObjectId
from api.base import BaseCRUDAPI
from main import app


# Mock model
class MockModel(BaseModel):
    id: PydanticObjectId
    name: str
    value: int

# Mock database
class MockDB:
    def __init__(self):
        self.data = {}

    async def find_one(self, query):
        return next((item for item in self.data.values() if item["_id"] == query["_id"]), None)

    async def find(self, query):
        return [item for item in self.data.values()]

    async def insert_one(self, document):
        self.data[document["_id"]] = document
        return type("InsertResult", (), {"inserted_id": document["_id"]})

    async def update_one(self, query, update):
        item = await self.find_one(query)
        if item:
            self.data[item["_id"]].update(update["$set"])
            return type("UpdateResult", (), {"matched_count": 1})
        return type("UpdateResult", (), {"matched_count": 0})

    async def delete_one(self, query):
        item = await self.find_one(query)
        if item:
            del self.data[item["_id"]]
            return type("DeleteResult", (), {"deleted_count": 1})
        return type("DeleteResult", (), {"deleted_count": 0})

# Test setup
mock_db = MockDB()

crud_api = BaseCRUDAPI(MockModel, "mock_collection")
crud_api.db.db = {"mock_collection": mock_db}
app.include_router(crud_api.router)

client = TestClient(app)

@pytest.fixture
def mock_item():
    return {"id": str(ObjectId()), "name": "Test Item", "value": 42}

def test_create_item(mock_item):
    response = client.post("/", json=mock_item)
    assert response.status_code == 200
    assert response.json()["name"] == mock_item["name"]

def test_get_one_item(mock_item):
    mock_db.data[mock_item["id"]] = mock_item
    response = client.get(f"/{mock_item['id']}")
    assert response.status_code == 200
    assert response.json()["name"] == mock_item["name"]

def test_get_all_items(mock_item):
    mock_db.data[mock_item["id"]] = mock_item
    response = client.get("/")
    assert response.status_code == 200
    assert len(response.json()) == 1

def test_update_item(mock_item):
    mock_db.data[mock_item["id"]] = mock_item
    updated_data = {"name": "Updated Item", "value": 100}
    response = client.put(f"/{mock_item['id']}", json=updated_data)
    assert response.status_code == 200
    assert response.json()["name"] == updated_data["name"]

def test_delete_item(mock_item):
    mock_db.data[mock_item["id"]] = mock_item
    response = client.delete(f"/{mock_item['id']}")
    assert response.status_code == 200
    assert response.json()["message"] == "MockModel deleted successfully"
