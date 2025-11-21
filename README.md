# 🔍 Semantic Image Search (Work in Progress)

> This repo currently contains two bootstrapped apps that talk to each other locally:
> 1. **Backend** – FastAPI server that exposes CLIP-based vector search endpoints and optional Unsplash ingestion.
> 2. **Frontend** – Next.js 16 UI that lets you run text queries against the backend and view scored results.

Everything documented below reflects the code that already exists in this repo today. Future ideas (real-time uploads, LoRA tuning, etc.) will be re-introduced once they are implemented.

## ✅ What Works Today

- **FastAPI backend** with routes for health checks, search, embeddings, Unsplash categories, and Pinecone stats (@backend/app).
- **Image search engine** built on CLIP embeddings and Pinecone, with optional Unsplash ingestion and metadata filters (color/orientation/date).
- **Advanced scoring helpers** exist in code, but the primary flow uses CLIP similarity plus optional metadata filtering.
- **Next.js frontend** that calls the backend `/search` endpoint, shows scored cards, and renders a modal with metadata.
- **Local favorites/recent searches** stored in `localStorage` on the frontend.

## � Repository Layout

```text
semantic-image-search/
├── backend/
│   ├── app/                # FastAPI app (routes, schemas, services)
│   ├── tests/
│   ├── requirements.txt
│   └── README.md           # Backend-specific docs
├── frontend/
│   ├── src/app/page.tsx    # Main UI entry point
│   ├── src/components/
│   ├── package.json
│   └── README.md           # Frontend-specific docs
└── README.md               # (this file)
```

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/MaansiBisht/semantic-image-search.git
cd semantic-image-search
```

```bash
# Backend deps
cd backend
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Frontend deps (new terminal)
cd ../frontend
npm install
```

### 2. Environment Variables

- Copy `backend/.env.example` → `backend/.env` and set at least:
  - `PINECONE_API_KEY`, `PINECONE_ENVIRONMENT`, `PINECONE_INDEX_NAME`
  - `UNSPLASH_ACCESS_KEY` (only needed if you toggle ingestion)
- For the frontend, create `frontend/.env.local` (optional) to override `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8000`).

### 3. Run the apps

```bash
# Terminal 1: backend
cd backend
uvicorn app.main:app --reload

# Terminal 2: frontend
cd frontend
npm run dev

# Visit http://localhost:3000
```

## 🧪 Current Capabilities

### Backend endpoints

| Method | Route | Purpose |
| --- | --- | --- |
| `GET /health` | Health status |
| `POST /search` | CLIP similarity search; can optionally ingest fresh Unsplash images before searching |
| `POST /upload-search` | Upload an image file and search for similar images |
| `POST /embeddings/text` | Return a raw text embedding |
| `POST /embeddings/image-url` | Return embedding for an image URL |
| `POST /embeddings/similarity` | Cosine similarity between two vectors |
| `GET /categories` | Proxy to Unsplash topics |
| `GET /stats` | Pinecone namespace stats |

### Frontend experience

- Search bar with toggles for ingestion, min score, top-k, and mode (text / image URL / hybrid).
- **Image upload support**: Upload local image files for similarity search.
- Filters drawer for color, orientation, and date range (these map directly to Pinecone metadata filters).
- Result grid that displays similarity score, metadata, and provides a modal with download/favorite options.
- Basic connection banner that lets you know if the backend is offline.

## ⚠️ Known Limitations

1. **Visual captioning & LoRA fine-tuning** helpers exist in the backend but are not wired into the main flow yet.
2. **Favorites/recents** live only in the browser's `localStorage` (no backend persistence).
3. **No auth, analytics, Docker, or CI** in this repo right now.