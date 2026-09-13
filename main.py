from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

pdf_path = "./source_material/bye_laws_2016.pdf"

loader = PyPDFLoader(pdf_path)
pages = loader.load()
pages = pages[19:252]

# for i, page in enumerate(pages[:10]):
#     print(f"Page: {i+1}")
#     print(f"Content: {page.page_content[:100]}")
#     print(f"Metadata: {page.metadata}")

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=100,
)

chunks = splitter.split_documents(pages)

# for i, chunk in enumerate(chunks[:10]):
#     print(f"\n\nChunk {i+1}")
#     print(f"Content {chunk.page_content[:500]}")
#     print(f"MetaData {chunk.metadata}")