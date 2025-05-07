from bson import ObjectId
from fastapi import APIRouter, HTTPException, Request, BackgroundTasks
from typing import Type, TypeVar, Generic, List, Optional
from pydantic import BaseModel
from fastapi import Body, Depends, Path

from fastapi import Query
from pydantic_mongo import PydanticObjectId

from core.database import db
from models.base import Base
from models.models import Alert, Device, Settings
from services.email_service import send_alert_email
import os

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
        self.router.patch("/{item_id}", response_model=self.model)(self.patch)
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


    async def create(self, background_tasks: BackgroundTasks, item: dict = Body(...)):
        document = self.model.model_validate(item)
        result = await self.db.db[self.collection_name].insert_one(document.model_dump(by_alias=True))
        created_item = await self.get_one(result.inserted_id)

        if isinstance(created_item, Alert) and os.environ.get('MAILJET_API_KEY'):
            print(f"New alert created (ID: {created_item.id}), attempting to send email notification.")
            app_settings_doc = await self.db.db["settings"].find_one({})
            recipient_email = None
            if app_settings_doc and app_settings_doc.get('notifications') and isinstance(app_settings_doc['notifications'], dict):
                recipient_email = app_settings_doc['notifications'].get('alertRecipientEmail')

            if recipient_email:
                device_name = "Unknown Device"
                if created_item.device_id:
                    try:
                        device_doc = await self.db.db["devices"].find_one({"_id": ObjectId(str(created_item.device_id))})
                        if device_doc:
                            device_name = device_doc.get("name", "Unknown Device")
                    except Exception as e:
                        print(f"Error fetching device name for alert email: {e}")
                
                background_tasks.add_task(
                    send_alert_email, 
                    created_item,
                    recipient_email,
                    device_name
                )
                print(f"Email notification task added for alert {created_item.id} to {recipient_email}")
            else:
                print("Alert email notification skipped: Recipient email not configured in settings or settings not found.")
        elif isinstance(created_item, Alert):
            print("Alert email notification skipped: MAILJET_API_KEY not set.")

        return created_item

    async def put(self, item_id: str, item: dict = Body(...)):
        validated_item_data = self.model.model_validate(item).model_dump(by_alias=True, exclude_unset=True, exclude={"_id", "id"})
        if not validated_item_data:
            raise HTTPException(status_code=400, detail="No valid fields to update")

        result = await self.db.db[self.collection_name].update_one(
            {"_id": ObjectId(str(item_id))}, {"$set": validated_item_data}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail=f"{self.model.__name__} not found")
        return await self.get_one(item_id)

    async def patch(self, item_id: str, item: dict = Body(...)):
        update_data = {k: v for k, v in item.items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        result = await self.db.db[self.collection_name].update_one(
            {"_id": ObjectId(str(item_id))}, {"$set": update_data}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail=f"{self.model.__name__} not found")
        return await self.get_one(item_id)


    async def delete(self, item_id: str):
        try:
            obj_item_id = ObjectId(item_id)
        except Exception:
            raise HTTPException(status_code=400, detail=f"Invalid item ID format: {item_id}")
        
        result = await self.db.db[self.collection_name].delete_one({"_id": obj_item_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail=f"{self.model.__name__} not found")
        return {"message": f"{self.model.__name__} deleted successfully", "id": item_id}
