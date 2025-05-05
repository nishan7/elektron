




# class ApplicationAPI(BaseCRUDAPI[Application]):
#     def __init__(self):
#         super().__init__(Application, "application")
#
#         self.router.patch("/{item_id}/accept", response_model=self.model)(self.accept)
#         self.router.patch("/{item_id}/reject", response_model=self.model)(self.reject)
#
#     async def create(self, item: Application = Body(...)):
#         document = item.model_dump(by_alias=True)
#         result = await self.db.db[self.collection_name].insert_one(document)
#         return await self.get_one(result.inserted_id)
#
#     async def accept(self, item_id: PyObjectId):
#         data = {"selected": True}
#         return await self.patch(item_id, data)
#
#     async def reject(self, item_id: PyObjectId):
#         data = {"selected": False}
#         return await self.patch(item_id, data)
#
#
