# MBBL RAG Assistant

Chat with the **Model Building Bye-Laws 2016** PDF using retrieval-augmented generation (RAG). Ask questions in plain language; the app retrieves relevant passages from the bye-laws and answers with an LLM grounded in that context.

**Live demo:** [https://mbbl-rag.vinaykumar.dev](https://mbbl-rag.vinaykumar.dev)

---

## Idea

Building codes are long, dense, and easy to misread. This project is a Level‑1 RAG portfolio piece: a focused “chat with my documents” system over a single authoritative PDF—not an agent, not a multi-tool workflow.

**Pipeline**

```
PDF → chunk → embed (OpenAI) → Chroma
                ↑
Question → embed → similarity search → prompt + context → LLM → streamed answer
```

The model only sees retrieved chunks plus the user question, which keeps answers tied to the source document.

---



## Features

- PDF ingestion with page-aware chunking
- Semantic search over bye-law sections (Chroma)
- Streaming chat UI (Flask + browser)
- Deployed on AWS with HTTPS on a custom subdomain
- Nginx rate limiting on `/ask` (per client IP; excess requests get `429`)

---



## Tech stack


| Layer               | Choice                                        |
| ------------------- | --------------------------------------------- |
| Language            | Python 3                                      |
| Orchestration / IO  | LangChain loaders & text splitters            |
| Embeddings & chat   | OpenAI (`text-embedding-3-small`, chat model) |
| Vector store        | ChromaDB (Docker, self-hosted)                |
| API / UI server     | Flask + Gunicorn                              |
| Frontend            | Single-page HTML/CSS/JS                       |
| Process manager     | PM2                                           |
| Reverse proxy / TLS | Nginx + Let’s Encrypt                         |
| Secrets             | `.env` (`OPENAI_API_KEY`)                     |


---



## Hosting


| Piece        | Detail                                                               |
| ------------ | -------------------------------------------------------------------- |
| Compute      | AWS EC2 (Ubuntu)                                                     |
| App process  | Gunicorn behind PM2 on port `5000`                                   |
| Vectors      | Chroma via Docker Compose on `localhost:8000` (not exposed publicly) |
| Public entry | Nginx on `80` / `443` → proxies to Gunicorn                          |
| Rate limit   | Nginx `limit_req` on `/ask` by `$binary_remote_addr`                 |
| DNS          | GoDaddy subdomain → Elastic IP                                       |
| TLS          | Certbot (Let’s Encrypt)                                              |


**Deploy shape:** pull code → `./start.sh` (deps, Chroma, PM2). Run `ingestion.py` **once** (or when the PDF / chunking / embedding model changes)—not on every app restart.

---



## Project layout

```
├── main.py              # Flask routes (/, /ask)
├── rag.py               # Retrieve → prompt → stream completion
├── llm.py               # OpenAI embeddings & chat
├── database.py          # Chroma HTTP client
├── ingestion.py         # One-shot PDF → embed → Chroma
├── templates/           # Chat UI
├── static/              # CSS / JS
├── docker-compose.yaml  # Chroma
├── start.sh             # EC2: compose + pm2 + gunicorn
├── start-local.sh       # Local convenience script
└── ingest/              # Source PDF (not committed)
```

---



## Local development

1. Clone the repo and create a venv; `pip install -r requirements.txt` (include `pypdf` for PDF loading).
2. Copy the bye-laws PDF into `ingest/` (path expected by `ingestion.py`).
3. Add `.env` with `OPENAI_API_KEY=...`
4. Start Chroma: `docker compose up -d`
5. Ingest once: `python ingestion.py`
6. Run the app: `python main.py` (or your local start script) and open `http://127.0.0.1:5000`

---



## What this is / isn’t

**Is:** a production-shaped RAG demo—retrieve, ground, generate, ship.

**Isn’t:** an agentic system, multi-corpus admin console, or fine-tuned domain model. Those are natural next steps on the same foundation.

---



## License / data

The Model Building Bye-Laws PDF is third-party regulatory material. This repo is for learning and demonstration; respect the source document’s terms if you redistribute it.