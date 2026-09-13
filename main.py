from database import collection
from llm import openai_client

question = input("Enter your question")

ques_embedding_response = openai_client.embeddings.create(
    model="text-embedding-3-small",
    input=question
)
ques_embedding = ques_embedding_response.data[0].embedding

results = collection.query(
    query_embeddings=[ques_embedding],
    n_results=3
)

for i in range(3):
    metadata = results["metadatas"][0][i]
    document = results["documents"][0][i]
    distance = results["distances"][0][i]

    print(f"\n--- Rank {i + 1} ---")
    print("Page:", metadata.get("page"))
    print("Source:", metadata.get("source"))
    print("Distance:", distance)
    print("Text:", document)