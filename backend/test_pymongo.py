from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/")
db = client["CertificateInsertion"]

print("✅ pymongo is working, connected to MongoDB")
print("Collections in CertificateInsertion:", db.list_collection_names())