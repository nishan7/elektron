import os

from pymongo import MongoClient

mongo_uri = os.getenv("MONGO_URI", "mongodb://root:example@localhost:27017/elektron?authSource=admin")

db = MongoClient(mongo_uri)["elektron"]

