from bson import ObjectId
from fastapi import APIRouter, HTTPException, Request
from typing import Type, TypeVar, Generic, List, Optional
from pydantic import BaseModel
from fastapi import Body, Depends, Path

from fastapi import Query
from pydantic_mongo import PydanticObjectId

from core.database import db
from models.base import Base

T = TypeVar("T", bound=Base)
from typing import List, Generic, TypeVar

K = TypeVar("K")


class PaginatedResponse(Base, Generic[K]):
    total: int
    skip: int
    limit: int
    items: List[K]


class BaseCRUDAPI(Generic[T]):
    def __init__(self, model: Type[T], collection_name: str):
        self.model = model
        self.collection_name = collection_name
        self.router = APIRouter()
        self.db = db
        self.setup_routes()

    def setup_routes(self):
        self.router.get("/{item_id}", response_model=self.model)(self.get_one)
        self.router.get("/", response_model=List[self.model])(self.get_all)
        self.router.post("/", response_model=self.model)(self.create)
        self.router.put("/{item_id}", response_model=self.model)(self.put)
        self.router.delete("/{item_id}")(self.delete)


    async def get_one(self, item_id: str, kwargs: Optional[dict] = {}):
        document = await self.db.db[self.collection_name].find_one({"_id": ObjectId(item_id), **kwargs})
        if not document:
            raise HTTPException(status_code=404, detail=f"{self.model.__name__} not found")
        return self.model(**document)

    async def get_all(
        self,
        request: Request,
        skip: int = Query(0, ge=0, description="Number of items to skip"),
        limit: int = Query(10, ge=1, le=100, description="Maximum number of items to return"),
    ):
        query = {}

        for key, value in request.query_params.items():
            if key in ("skip", "limit"):
                continue

            expected_field = self.model.model_fields.get(key)

            if expected_field:
                field_type = expected_field.annotation
                try:
                    if field_type == ObjectId or field_type == PydanticObjectId:
                        query[key] = ObjectId(value)
                    elif field_type == bool:
                        query[key] = value.lower() == "true"
                    elif field_type == int:
                        query[key] = int(value)
                    else:
                        query[key] = {"$regex": value, "$options": "i"}
                except Exception:
                    raise HTTPException(status_code=400, detail=f"Invalid type for field {key}")
            else:
                # Field not defined in model, fallback: regex search
                query[key] = {"$regex": value, "$options": "i"}

        cursor = self.db.db[self.collection_name].find(query)
        items = []
        async for document in cursor:
            if "_id" in document:
                document["_id"] = str(document["_id"])
            items.append(self.model.model_validate(document))

        return items


    async def create(self, item: dict=Body()):
        document = self.model.model_validate(item)
        result = await self.db.db[self.collection_name].insert_one(document.model_dump(by_alias=True))
        return await self.get_one(result.inserted_id)

    async def put(self, item_id: str, item: dict = Body(...)):
        document = self.model.model_validate(item)
        result = await self.db.db[self.collection_name].update_one(
            {"_id": ObjectId(item_id)}, {"$set": document.model_dump(exclude="_id", by_alias=True)}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail=f"{self.model.__name__} not found")
        return await self.get_one(item_id)

    async def patch(self, item_id: str, item: dict = Body(...)):
        update_data = {k: v for k, v in item.items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        result = await self.db.db[self.collection_name].update_one(
            {"_id": ObjectId(item_id)}, {"$set": update_data}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail=f"{self.model.__name__} not found")
        return await self.get_one(item_id)


    async def delete(self, item_id: str):
        result = await self.db.db[self.collection_name].delete_one({"_id": item_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail=f"{self.model.__name__} not found")
        return {"message": f"{self.model.__name__} deleted successfully"}
