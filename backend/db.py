from pymongo import MongoClient
from dotenv import load_dotenv
from urllib.parse import quote_plus
import os

load_dotenv()

username = os.getenv("MONGO_USERNAME")
password = os.getenv("MONGO_PASSWORD")
cluster = os.getenv("MONGO_CLUSTER")

MONGO_URI = f"mongodb+srv://{quote_plus(username)}:{quote_plus(password)}@{cluster}/"

client = MongoClient(MONGO_URI)
db = client["code-1"]
users_collection = db["user"]