from database import collection
from llm import get_completion, get_completion_steam, get_embeddings

system_prompt = {
    "role": "system",
    "content": "You are an assistant for the Model Building Bye Laws 2016. Answer the following question using only the context shared."
}

def ask(conversation):
    question_obj = conversation.pop()
    question = question_obj["content"]
    ques_embedding = get_embeddings(question)
    results = collection.query(
        query_embeddings=[ques_embedding],
        n_results=3
    )
    retrieved_data = results["documents"][0]
    
    prompt = f"""
    The context is:
    {retrieved_data}
    The question is:
    {question}
    """

    if len(conversation) == 0:
        conversation = [system_prompt, *conversation]
    
    conversation.append({"role": "user", "content": prompt})
    answer = get_completion(conversation)
    conversation.append({"role": "assistant", "content": answer})    
    
    return conversation

def ask_stream(conversation):
    question_obj = conversation.pop()
    question = question_obj["content"]
    ques_embedding = get_embeddings(question)
    results = collection.query(
        query_embeddings=[ques_embedding],
        n_results=3
    )
    retrieved_data = results["documents"][0]
    
    prompt = f"""
    The context is:
    {retrieved_data}
    The question is:
    {question}
    """

    if len(conversation) == 0:
        conversation = [system_prompt, *conversation]
    
    conversation.append({"role": "user", "content": prompt})

    answer = ""
    for chunk in get_completion_steam(conversation):
        answer += chunk
        yield chunk
    conversation.append({
        "role": "assistant",
        "content": answer
    }) 

# for i in range(3):
#     metadata = results["metadatas"][0][i]
#     document = results["documents"][0][i]
#     distance = results["distances"][0][i]
