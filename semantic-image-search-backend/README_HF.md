---
title: Semantic Image Search API
emoji: 🔍
colorFrom: blue
colorTo: purple
sdk: docker
app_file: app.py
pinned: false
license: mit
---

# Semantic Image Search Backend

FastAPI backend for semantic image search using CLIP model and Pinecone vector database.

## Features

- Text-to-image search using CLIP embeddings
- Image-to-image search
- Pinecone vector database for scalable storage
- RESTful API with OpenAPI documentation
- Memory optimized for Hugging Face Spaces

## API Endpoints

- `GET /health` - Health check
- `GET /stats` - Database statistics
- `GET /categories` - Available categories
- `POST /search` - Text search
- `POST /upload-search` - Image upload search
- `POST /ingest` - Ingest new images

## Environment Variables

Create a `.env` file with:

```env
# Unsplash API
UNSPLASH_ACCESS_KEY=your_access_key
UNSPLASH_SECRET_KEY=your_secret_key

# Pinecone vector database
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_environment
PINECONE_INDEX_NAME=your_index_name

# Optional settings
CLIP_MODEL_NAME=openai/clip-vit-base-patch32
DEVICE=cpu
```

## Deployment

This app is configured for Hugging Face Spaces with Docker deployment.

## Local Development

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 7860
```

## API Documentation

Visit `/docs` for interactive API documentation.
