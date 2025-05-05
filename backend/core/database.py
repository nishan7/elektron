import os
from motor.motor_asyncio import AsyncIOMotorClient

class Database:
    client: AsyncIOMotorClient = None
    db = None

    async def connect_to_database(self):
        #mongo_uri = os.getenv("MONGO_URI", "mongodb://root:example@localhost:27017/elektron?authSource=admin")
        mongo_uri = os.getenv("MONGO_URI", "mongodb://root:example@mongo:27017/elektron?authSource=admin")
        self.client = AsyncIOMotorClient(mongo_uri)
        self.db = self.client.get_database()

    async def close_database_connection(self):
        if self.client:
            self.client.close()

db = Database()



# from sqlalchemy import create_engine
# from sqlalchemy.ext.declarative import declarative_base
# from sqlalchemy.orm import sessionmaker
# import os
# from dotenv import load_dotenv
#
# load_dotenv()
#
# SQLALCHEMY_DATABASE_URL = os.getenv(
#     "DATABASE_URL",
#     "postgresql://postgres:postgres@db:5432/electricity_monitor"
# )
#
# engine = create_engine(SQLALCHEMY_DATABASE_URL)
# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
#
# Base = declarative_base()
#
# # Dependency
# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()
