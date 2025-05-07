import os

from pymongo import MongoClient

mongo_uri = os.getenv("MONGO_URI", "mongodb+srv://cmpe-272:cmpe-272@cluster0.crznvzq.mongodb.net/elektron?retryWrites=true&w=majority&appName=Cluster0")

db = MongoClient(mongo_uri)["elektron"]

