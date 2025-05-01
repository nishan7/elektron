# from pydantic import BaseModel, Field
# from typing import Optional, Annotated, Any, Callable
# from datetime import datetime
# from bson import ObjectId
# from typing import List
# from pydantic.json_schema import JsonSchemaValue
# from pydantic_core import core_schema
#
#
# class _ObjectIdPydanticAnnotation:
#     # Based on https://docs.pydantic.dev/latest/usage/types/custom/#handling-third-party-types.
#
#     @classmethod
#     def __get_pydantic_core_schema__(
#             cls,
#             _source_type: Any,
#             _handler: Callable[[Any], core_schema.CoreSchema],
#     ) -> core_schema.CoreSchema:
#         def validate_from_str(input_value: str) -> ObjectId:
#             return ObjectId(input_value)
#
#         return core_schema.union_schema(
#             [
#                 # check if it's an instance first before doing any further work
#                 core_schema.is_instance_schema(ObjectId),
#                 core_schema.no_info_plain_validator_function(validate_from_str),
#             ],
#             serialization=core_schema.to_string_ser_schema(),
#         )
#
#
# PyObjectId = Annotated[
#     ObjectId, _ObjectIdPydanticAnnotation
# ]
#
#
# class JobBase(BaseModel):
#     id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
#     title: str
#     description: str
#     location: str
#     pay: int
#     is_active: bool = True
#     created_at: datetime = Field(default_factory=datetime.utcnow)
#     employer: str
#     tags: List[str]
#     type: str  # job, gig, volunteer
#     # skills: List[str]
#     job_poster: PyObjectId  # User
#
#
# class User(BaseModel):
#     id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
#     name: str
#     about_me: str
#     location: str
#     rating: int
#     phone: int = None
#     email: str
#     photo_b64: Optional[str] = None
#     type: str  # job_seeker, job_poster
#     organization: Optional[str] = None
#
#     class Config:
#         validate_by_name = True
#         arbitrary_types_allowed = True
#         json_encoders = {ObjectId: str}
#
#
# class Job(JobBase):
#     updated_at: datetime = Field(default_factory=datetime.utcnow)
#
#     class Config:
#         validate_by_name = True
#         arbitrary_types_allowed = True
#         json_encoders = {ObjectId: str}
#
#
# class VolunteerJob(JobBase):
#     updated_at: datetime = Field(default_factory=datetime.utcnow)
#     organization: Optional[str] = None  # Example additional field for volunteer jobs
#
#     class Config:
#         validate_by_name = True
#         arbitrary_types_allowed = True
#         json_encoders = {ObjectId: str}
#
#
# class GigJob(JobBase):
#     # created_at: datetime = Field(default_factory=datetime.utcnow)
#     updated_at: datetime = Field(default_factory=datetime.utcnow)
#     duration: Optional[str] = None  # Example additional field for gig jobs
#
#     class Config:
#         validate_by_name = True
#         arbitrary_types_allowed = True
#         json_encoders = {ObjectId: str}
#
#
# class Application(BaseModel):
#     id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
#     job_id: PyObjectId  # Job
#     applicant: PyObjectId  # User
#     poster: PyObjectId  # User
#     active: bool = True
#     selected: bool = False
