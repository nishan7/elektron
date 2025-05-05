import json
import os
import sys
import datetime
from core.sync_database import db
from bson import ObjectId
from dateutil.parser import isoparse

database_name = "elektron"
output_dir = "./mongo_data"


def dump_all_collections():
    os.makedirs(output_dir, exist_ok=True)
    database = db.client[database_name]
    collections = database.list_collection_names()

    for collection_name in collections:
        collection = database[collection_name]
        documents = list(collection.find())
        for doc in documents:
            for key, value in doc.items():
                if isinstance(value, ObjectId):
                    doc[key] = str(value)
                elif isinstance(value, datetime.datetime):
                    doc[key] = value.isoformat()
        with open(os.path.join(output_dir, f"{collection_name}.json"), "w") as f:
            json.dump(documents, f, indent=2)
        print(f"Dumped {collection_name} with {len(documents)} documents.")


def load_all_collections():
    database = db.client[database_name]
    if not os.path.exists(output_dir):
        print(f"No directory named '{output_dir}' found.")
        return

    for filename in os.listdir(output_dir):
        if filename.endswith(".json"):
            collection_name = filename.replace(".json", "")
            with open(os.path.join(output_dir, filename), "r") as f:
                documents = json.load(f)
                for doc in documents:
                    for key, value in doc.items():
                        if key == "_id":
                            doc[key] = ObjectId(value)
                        elif isinstance(value, str):
                            try:
                                parsed = isoparse(value)
                                if isinstance(parsed, datetime.datetime):
                                    doc[key] = parsed
                            except Exception:
                                pass
            if documents:
                database[collection_name].insert_many(documents)
                print(f"Loaded {len(documents)} documents into {collection_name}.")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python mongoload.py [dump|load]")
    elif sys.argv[1] == "dump":
        dump_all_collections()
    elif sys.argv[1] == "load":
        load_all_collections()
    else:
        print("Invalid argument. Use 'dump' or 'load'.")
