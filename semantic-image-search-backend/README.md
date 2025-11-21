# Semantic Image Search Backend

## Overview

The backend provides advanced REST APIs for multi-modal semantic search with AI-powered visual understanding. Built with FastAPI, it integrates cutting-edge AI models and vector search technologies:

- **OpenAI CLIP** (`openai/clip-vit-base-patch32`) for text and image embeddings
- **BLIP/LLaVA** for automatic visual captioning and description generation
- **Pinecone** vector database with advanced indexing (HNSW, IVF-Flat, PQ)
- **Unsplash API** for sourcing fresh imagery to index
- **Weighted Multi-Modal Scoring** for sophisticated search result ranking
- **LoRA Fine-Tuning Integration** for domain-specific model customization

## Prerequisites

- Python 3.11+
- A Pinecone account with a serverless index (or permissions to create one)
- Unsplash API credentials (access key and secret)
- (Optional) GPU with CUDA if you plan to run CLIP on GPU

## Project Structure

```text
backend/
├── app/
│   ├── api/               # FastAPI routers with advanced search endpoints
│   ├── config/            # Settings management and indexing configurations
│   │   ├── settings.py    # Environment and application settings
│   │   └── indexing.py    # Advanced Pinecone indexing strategies
│   ├── schemas/           # Pydantic models for requests/responses
│   │   └── search.py      # Enhanced search schemas with weighted scoring
│   ├── services/          # AI model integrations and search engines
│   │   ├── clip_service.py        # CLIP embeddings service
│   │   ├── image_search_engine.py # Advanced multi-modal search engine
│   │   ├── visual_captioning.py   # BLIP/LLaVA captioning service
│   │   └── unsplash_fetcher.py    # Unsplash API integration
│   └── main.py            # Application factory
├── tests/                 # Pytest test suite
├── .env.example           # Sample environment configuration
├── README.md              # This guide
└── requirements.txt       # Python dependencies
```

## Environment Configuration

Copy the sample environment file and populate it with your credentials:

```bash
cp .env.example .env
```

| Variable | Description |
| --- | --- |
| `UNSPLASH_ACCESS_KEY` | Unsplash API access key |
| `UNSPLASH_SECRET_KEY` | Unsplash API secret (optional for current calls) |
| `PINECONE_API_KEY` | Pinecone API key |
| `PINECONE_ENVIRONMENT` | Pinecone environment, e.g. `us-central1-gcp` |
| `PINECONE_INDEX_NAME` | Pinecone index name, e.g. `semantic-image-search` |

Additional settings with sane defaults are defined in `app/config/settings.py` and can be overridden via environment variables (e.g. `PINECONE_NAMESPACE`, `PINECONE_TOP_K`).

> **Note:** Hugging Face CLIP is loaded locally. Unless you rely on private models or hosted inference endpoints, no Hugging Face API token is required.

## Setup & Installation

Create and activate a virtual environment (recommended):

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

Install dependencies:

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

The first request to a CLIP endpoint will download the model weights to your local Hugging Face cache.

## Running the Server

Launch the FastAPI application with Uvicorn:

```bash
uvicorn app.main:app --reload
```

The API will be available at [http://127.0.0.1:8000](http://127.0.0.1:8000). Interactive documentation is accessible at `/docs` (Swagger UI) and `/redoc`.

## API Reference

### Health Check
- **GET** `/health`
- Returns `{ "status": "ok" }`.

### Advanced Search
- **POST** `/search`
  - **Multi-Modal Search**: Text, image, or hybrid queries
  - **Weighted Scoring**: Custom score fusion with adjustable weights
  - **Advanced Filters**: Color, orientation, date range filtering
  - **Body Example**:
    ```json
    {
      "query": "sunset beach",
      "mode": "hybrid",
      "image_url": "https://example.com/image.jpg",
      "use_advanced_scoring": true,
      "image_weight": 0.6,
      "text_weight": 0.2,
      "metadata_weight": 0.2,
      "color": "orange",
      "orientation": "landscape",
      "min_score": 0.3,
      "top_k": 10
    }
    ```

- **POST** `/upload-search`
  - **Image Upload Search**: Find similar images by uploading a file
  - **Body**: Multipart form with image file and optional parameters

### Embeddings
- **POST** `/embeddings/text`
  - Body: `{ "text": "Describe the image" }`
- **POST** `/embeddings/image-url`
  - Body: `{ "image_url": "https://images.unsplash.com/..." }`
- **POST** `/embeddings/similarity`
  - Body: `{ "vector_a": [...], "vector_b": [...] }`

### Discovery & Analytics
- **GET** `/categories`
  - Query params: `per_page` (1-50). Lists Unsplash topics.
- **GET** `/stats`
  - Returns Pinecone index statistics with namespace breakdown.

Refer to `app/schemas` for detailed request/response models.

## Testing

Pytest is configured for automated testing. Tests rely on dependency overrides to avoid loading external services.

Run tests from the backend directory:

```bash
pytest
```

## Advanced Features

### Multi-Modal Search Engine
The `ImageSearchEngine` class provides sophisticated search capabilities:

- **Weighted Scoring**: Combine image, text, and metadata similarities
  ```python
  final_score = image_weight * image_score + text_weight * text_score + metadata_weight * color_score
  ```
- **Hybrid Search**: Merge text and image embeddings with weighted averages
- **Metadata Filtering**: Color, orientation, and date-based filtering
- **Score Transparency**: Detailed component score breakdown

### Visual Captioning Service
Automatic image description generation using state-of-the-art models:

- **BLIP Integration**: Salesforce BLIP for high-quality captions
- **Detailed Descriptions**: Extended image analysis beyond simple captions
- **Keyword Extraction**: Searchable terms for enhanced discoverability
- **Fallback Support**: Mock service for development environments

### Advanced Indexing Configurations
Optimized Pinecone index settings for different use cases:

- **HNSW (High Accuracy)**: M=32, ef_construction=400 for maximum precision
- **IVF-Flat (High Speed)**: nlist=2048, nprobe=5 for fast retrieval
- **PQ (Memory Efficient)**: Compression for large-scale deployments
- **Smart Selection**: Automatic configuration based on dataset size

### Fine-Tuning Integration Points
Framework for custom model deployment:

- **LoRA Support**: Low-Rank Adaptation for efficient fine-tuning
- **Model Versioning**: Track and compare model performance
- **Evaluation Pipeline**: A/B testing for model improvements
- **Custom Datasets**: Domain-specific training data integration

## Development Tips

- Use `python-dotenv` or export environment variables manually when running locally.
- The Pinecone index is created automatically if it does not exist. Ensure your API key has permissions to create indexes.
- For production deployments, consider using the HNSW indexing strategy for accuracy or IVF-Flat for speed.
- Enable visual captioning in production by setting up BLIP models with GPU acceleration.
- Use the mock captioning service during development to avoid model loading overhead.

## Future Enhancements

### Near Term
- Real-time image upload processing with immediate similarity search
- Background ingestion jobs to keep Pinecone populated asynchronously
- Advanced analytics and search performance monitoring
- Custom model fine-tuning pipeline with LoRA integration

### Medium Term
- Multi-language support for international datasets
- Video frame analysis and temporal search capabilities
- Advanced visualization tools for embedding space exploration
- Federated search across multiple vector databases

### Long Term
- Real-time collaborative search and annotation features
- Enterprise SSO integration and user management
- Advanced AI model marketplace for custom embeddings
- Automated model optimization and hyperparameter tuning
