import chromadb

db_client = chromadb.HttpClient(
    host="localhost",
    port=8000
)
print (f"DB Connection: {db_client.heartbeat()}")

collection = db_client.get_or_create_collection("mbbl_embeddings")
print(f"Collection: {collection.name}-{collection.count}")