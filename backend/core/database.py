import os
from motor.motor_asyncio import AsyncIOMotorClient

class Database:
    client: AsyncIOMotorClient = None
    db = None

    async def connect_to_database(self):
        mongo_uri = os.getenv("MONGO_URI", "mongodb+srv://cmpe-272:cmpe-272@cluster0.crznvzq.mongodb.net/elektron?retryWrites=true&w=majority&appName=Cluster0")
        # mongo_uri = os.getenv("MONGO_URI", "mongodb://root:example@mongo:27017/elektron?authSource=admin")
        self.client = AsyncIOMotorClient(mongo_uri)
        print(mongo_uri)
        self.db = self.client.get_database()

    async def close_database_connection(self):
        if self.client:
            self.client.close()

db = Database()

