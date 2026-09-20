#!/usr/bin/env bash

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$APP_DIR"

# Create virtual environment if needed
[ -d .venv ] || python3 -m venv .venv

# Install dependencies
.venv/bin/pip install -r requirements.txt

# Start Chroma
docker compose up -d

# Start Flask/Gunicorn with PM2
pm2 delete rag 2>/dev/null || true
pm2 start ".venv/bin/gunicorn -b 0.0.0.0:5000 main:app" \
  --name rag \
  --cwd "$APP_DIR"

pm2 save

echo "RAG app running on port 5000"