from database import collection
from llm import get_completion, get_embeddings

messages = [
    {
        "role": "system",
        "content": "You are an assistant for the Model Building Bye Laws 2016. Answer the following question using only the context shared."
    },
]

while True:
    question = input("Enter your question:\n")
    
    if question.startswith("exit"):
        break

    ques_embedding = get_embeddings(question)
    results = collection.query(
        query_embeddings=[ques_embedding],
        n_results=3
    )
    retrieved_data = results["documents"][0]

    prompt = f"""
        The context is:
        {retrieved_data}
        The question is: {question}
    """
    messages.append({"role": "user", "content": prompt})

    answer = get_completion(messages)
    print(f"\n{answer}\n")

    messages.append({ "role": "assistant", "content": answer })

# for i in range(3):
#     metadata = results["metadatas"][0][i]
#     document = results["documents"][0][i]
#     distance = results["distances"][0][i]

#     print(f"\n--- Rank {i + 1} ---")
#     print("Page:", metadata.get("page"))
#     print("Source:", metadata.get("source"))
#     print("Distance:", distance)
#     print("Text:", document)