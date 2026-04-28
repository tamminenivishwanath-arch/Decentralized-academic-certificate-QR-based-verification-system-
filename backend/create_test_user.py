from werkzeug.security import generate_password_hash
from pymongo import MongoClient

MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "CertificateInsertion"
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

email = "you@example.com"
plain = "test123"
pw_hash = generate_password_hash(plain)
db.users.insert_one({"email": email, "password": pw_hash, "role": "university"})
print("Inserted test user:", email)
