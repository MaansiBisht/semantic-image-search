from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from fastapi.responses import JSONResponse

from app.config.settings import get_settings
from app.schemas.embeddings import (
    EmbeddingResponse,
    ImageEmbeddingUrlRequest,
    SimilarityRequest,
    SimilarityResponse,
    TextEmbeddingRequest,
)
from app.schemas.search import (
    CategoriesResponse,
    Category,
    SearchRequest,
    SearchResponse,
    SearchResult,
    StatsResponse,
)
from app.services.clip_service import CLIPService, get_clip_service
from app.services.image_search_engine import ImageSearchEngine, get_image_search_engine
from app.services.unsplash_fetcher import UnsplashFetcher, get_unsplash_fetcher

router = APIRouter()

embeddings_router = APIRouter(prefix="/embeddings", tags=["embeddings"])
search_router = APIRouter(tags=["search"])


@embeddings_router.post("/text", response_model=EmbeddingResponse)
def generate_text_embedding(
    payload: TextEmbeddingRequest, clip_service: CLIPService = Depends(get_clip_service)
) -> EmbeddingResponse:
    embedding = clip_service.encode_text(payload.text)
    return EmbeddingResponse(embedding=embedding)


@embeddings_router.post("/image-url", response_model=EmbeddingResponse)
def generate_image_embedding_from_url(
    payload: ImageEmbeddingUrlRequest, clip_service: CLIPService = Depends(get_clip_service)
) -> EmbeddingResponse:
    embedding = clip_service.encode_image_from_url(payload.image_url)
    return EmbeddingResponse(embedding=embedding)


@embeddings_router.post("/similarity", response_model=SimilarityResponse)
def compute_similarity(
    payload: SimilarityRequest, clip_service: CLIPService = Depends(get_clip_service)
) -> SimilarityResponse:
    similarity = clip_service.cosine_similarity(payload.vector_a, payload.vector_b)
    return SimilarityResponse(similarity=similarity)


@search_router.post("/search", response_model=SearchResponse)
def search_images(
    payload: SearchRequest,
    engine: ImageSearchEngine = Depends(get_image_search_engine),
    fetcher: UnsplashFetcher = Depends(get_unsplash_fetcher),
) -> SearchResponse:
    settings = get_settings()
    ingested: list[dict[str, Any]] = []

    if payload.ingest:
        try:
            ingested = fetcher.fetch_and_index(payload.query, page=payload.page, per_page=payload.per_page)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
        except RuntimeError as exc:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc

    try:
        # Perform search based on mode and scoring preference
        if payload.use_advanced_scoring:
            # Use advanced weighted scoring
            matches = engine.search_with_weighted_scoring(
                query=payload.query,
                image_url=payload.image_url,
                image_weight=payload.image_weight,
                text_weight=payload.text_weight,
                metadata_weight=payload.metadata_weight,
                color_filter=payload.color.value if payload.color else None,
                top_k=payload.top_k
            )
        else:
            # Use standard search modes
            if payload.mode == "text":
                matches = engine.search_by_text(payload.query, top_k=payload.top_k)
            elif payload.mode == "image" and payload.image_url:
                matches = engine.search_by_image_url(payload.image_url, top_k=payload.top_k)
            elif payload.mode == "hybrid" and payload.image_url:
                matches = engine.search_hybrid(payload.query, payload.image_url, top_k=payload.top_k)
            else:
                raise ValueError("Invalid search mode or missing image_url for image/hybrid search")
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    # Apply metadata filters
    filter_dict = {}
    if payload.color:
        filter_dict["color"] = payload.color.value
    if payload.orientation:
        filter_dict["orientation"] = payload.orientation.value
    if payload.date_from:
        filter_dict["date_from"] = payload.date_from
    if payload.date_to:
        filter_dict["date_to"] = payload.date_to
    
    if filter_dict:
        matches = engine.apply_metadata_filters(matches, filter_dict)

    # Apply minimum score filtering if specified
    if payload.min_score is not None:
        matches = [match for match in matches if match.get("score", 0.0) >= payload.min_score]

    results = [
        SearchResult(
            id=match.get("id"),
            score=float(match.get("score", 0.0)),
            metadata=match.get("metadata") or {},
        )
        for match in matches
    ]

    top_k = payload.top_k or settings.pinecone_top_k
    return SearchResponse(
        query=payload.query,
        results=results,
        ingested=ingested,
        top_k=top_k,
        count=len(results),
    )


@search_router.post("/upload-search", response_model=SearchResponse)
async def upload_image_search(
    file: UploadFile = File(...),
    query: str = "",
    top_k: int = Query(8, ge=1, le=100),
    min_score: float = Query(0.2, ge=0.0, le=1.0),
    engine: ImageSearchEngine = Depends(get_image_search_engine),
) -> SearchResponse:
    """Search for similar images by uploading an image file."""
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Perform search using the uploaded image bytes
        matches = engine.search_by_image_bytes(file_content, top_k=top_k)
        
        # Apply minimum score filtering if specified
        if min_score is not None:
            matches = [match for match in matches if match.get("score", 0.0) >= min_score]
        
        # Build response
        results = [
            SearchResult(
                id=match.get("id"),
                score=float(match.get("score", 0.0)),
                metadata=match.get("metadata") or {},
            )
            for match in matches
        ]
        
        return SearchResponse(
            query=query or f"Image upload: {file.filename}",
            results=results,
            ingested=[],
            top_k=top_k,
            count=len(results),
        )
        
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing uploaded image: {str(exc)}"
        ) from exc


@search_router.get("/categories", response_model=CategoriesResponse)
def list_categories(
    per_page: int | None = Query(None, ge=1, le=50),
    fetcher: UnsplashFetcher = Depends(get_unsplash_fetcher),
) -> CategoriesResponse:
    try:
        topics = fetcher.list_topics(per_page=per_page)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc

    categories = [
        Category(
            id=topic.get("id"),
            title=topic.get("title"),
            slug=topic.get("slug"),
            description=topic.get("description"),
            cover_photo_url=((topic.get("cover_photo") or {}).get("urls") or {}).get("small"),
        )
        for topic in topics
    ]

    return CategoriesResponse(categories=categories)


@search_router.get("/stats", response_model=StatsResponse)
def get_stats(engine: ImageSearchEngine = Depends(get_image_search_engine)) -> StatsResponse:
    data = engine.describe_stats()
    return StatsResponse(**data)


router.include_router(embeddings_router)
router.include_router(search_router)
