from bson import ObjectId
from pydantic import BaseModel, Field
from typing import Optional, Annotated, Any, Callable
from pydantic_mongo import PydanticObjectId


# Base to be used by all models
class Base(BaseModel):
    id: PydanticObjectId = Field(default_factory=PydanticObjectId, alias="_id")
