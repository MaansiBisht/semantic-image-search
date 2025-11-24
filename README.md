# 🔍 Semantic Image Search

AI-powered image search application with advanced UI features. Search images using natural language or upload images to find visually similar results.

## ✨ Key Features

**Search Capabilities:**
- Text-based semantic search using CLIP embeddings
- Image upload for similarity search
- Color-based filtering and search
- Metadata filters (orientation, date range)

**UI Features:**
- 3 view modes: Grid, Masonry, Carousel
- Advanced lightbox with zoom & pan
- Batch operations (multi-select, bulk download/favorite)
- Color palette extraction with click-to-search
- Analytics dashboard with search insights
- Saved searches with keyboard shortcuts (Cmd+1-9)
- Customizable preferences (view mode, theme, results per page)
- Dark mode support

## 🛠️ Tech Stack

**Frontend:**
- Next.js 16 + React 19 + TypeScript
- Tailwind CSS 4 + Framer Motion
- LocalStorage for preferences & favorites

**Backend:**
- FastAPI + Python
- CLIP embeddings (OpenAI)
- Pinecone vector database
- Unsplash API integration

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/MaansiBisht/semantic-image-search.git
cd semantic-image-search
```

```bash
# Backend
cd semantic-image-search-backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Frontend
cd semantic-image-search-frontend
npm install
```

### 2. Environment Setup

**Backend** - Create `.env` file:
```env
PINECONE_API_KEY=your_key
PINECONE_ENVIRONMENT=your_env
PINECONE_INDEX_NAME=your_index
UNSPLASH_ACCESS_KEY=your_key  # Optional
```

**Frontend** - Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Run

```bash
# Terminal 1: Backend
cd semantic-image-search-backend
uvicorn app.main:app --reload

# Terminal 2: Frontend
cd semantic-image-search-frontend
npm run dev
```

Visit `http://localhost:3000`

## 📸 Screenshots

**Grid View with Color Palettes**
- Multi-column responsive grid
- Extracted color swatches
- Similarity scores

**Advanced Lightbox**
- Zoom & pan functionality
- Keyboard navigation
- Image metadata display

**Analytics Dashboard**
- Search history timeline
- Popular search terms
- Usage statistics

**Batch Operations**
- Multi-select mode
- Floating action toolbar
- Bulk download/favorite

## 🎯 Use Cases

- Visual content discovery
- Image similarity search
- Color-based image filtering
- Design inspiration gathering
- Photo collection management
