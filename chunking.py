from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from database import collection
from llm import openai_client

pdf_path = "./source_material/bye_laws_2016.pdf"

loader = PyPDFLoader(pdf_path)
pages = loader.load()
pages = pages[19:252]

for i, page in enumerate(pages[:10]):
    print(f"Page: {i+1}")
    print(f"Content: {page.page_content[:100]}")
    print(f"Metadata: {page.metadata}")

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=100,
)

chunks = splitter.split_documents(pages)


for i, chunk in enumerate(chunks):
    print(f"\n\nProcessing embeddings for chunk {i}")
    response = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=chunk.page_content
    )
    embedding = response.data[0].embedding
    print(f"Embedding recieved: {embedding}")
    collection.add(
        ids=[f"chunk_{i}"],
        documents=[chunk.page_content],
        embeddings=[embedding],
        metadatas=[{
            "page": chunk.metadata.get("page"),
            "source": "mbbl_2016"
        }]        
    )
    print(f"Written in db")