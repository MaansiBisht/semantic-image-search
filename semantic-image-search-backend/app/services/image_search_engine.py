from __future__ import annotations

import time
import numpy as np
from collections.abc import Iterable, Sequence
from typing import Any, Optional, Dict, List, Tuple
from datetime import datetime
import colorsys

from pinecone import Pinecone, ServerlessSpec

from app.config.settings import get_settings
from app.services.clip_service import CLIPService, get_clip_service
from app.services.visual_captioning import get_captioning_service


class ImageSearchEngine:
    def __init__(self, clip_service: CLIPService | None = None) -> None:
        self._settings = get_settings()
        if not self._settings.pinecone_api_key:
            raise RuntimeError("Pinecone API key is not configured")
        if not self._settings.pinecone_index_name:
            raise RuntimeError("Pinecone index name is not configured")

        self._clip = clip_service or get_clip_service()
        self._pinecone = Pinecone(api_key=self._settings.pinecone_api_key)
        self._index = self._get_or_create_index()

    @property
    def index(self):  # type: ignore[override]
        return self._index

    def _get_or_create_index(self):
        index_name = self._settings.pinecone_index_name
        list_response = self._pinecone.list_indexes()
        existing_indexes = set(list_response.names()) if hasattr(list_response, "names") else {item["name"] for item in list_response.indexes}

        if index_name not in existing_indexes:
            cloud, region = self._split_environment()
            if not cloud or not region:
                raise RuntimeError("Pinecone environment must be specified as '<region>-<cloud>' (e.g. 'us-central1-gcp')")

            self._pinecone.create_index(
                name=index_name,
                dimension=self._settings.embedding_dim,
                metric="cosine",
                spec=ServerlessSpec(cloud=cloud, region=region),
            )
            self._wait_for_index(index_name)

        return self._pinecone.Index(index_name)

    def _wait_for_index(self, index_name: str, timeout: int = 60) -> None:
        start = time.time()
        while time.time() - start < timeout:
            description = self._pinecone.describe_index(index_name)
            status = getattr(description, "status", None)
            if status and getattr(status, "ready", False):
                return
            time.sleep(1)
        raise TimeoutError(f"Timed out waiting for Pinecone index '{index_name}' to be ready")

    def _split_environment(self) -> tuple[str | None, str | None]:
        environment = self._settings.pinecone_environment
        if not environment or "-" not in environment:
            return None, None
        *region_parts, cloud = environment.split("-")
        region = "-".join(region_parts)
        return cloud, region

    def encode_text(self, text: str) -> list[float]:
        return self._clip.encode_text(text)

    def encode_image(self, image_url: str) -> list[float]:
        return self._clip.encode_image_from_url(image_url)
    
    def encode_image_from_bytes(self, image_bytes: bytes) -> list[float]:
        return self._clip.encode_image_from_bytes(image_bytes)

    def upsert_vectors(self, vectors: Iterable[dict[str, Any]]) -> None:
        vector_list = []
        for vector in vectors:
            payload = {
                "id": vector["id"],
                "values": list(vector["values"]),
                "metadata": vector.get("metadata", {}),
            }
            vector_list.append(payload)

        if not vector_list:
            return

        self._index.upsert(vectors=vector_list, namespace=self._settings.pinecone_namespace)

    def upsert_image(self, *, image_id: str, embedding: Sequence[float], metadata: dict[str, Any]) -> None:
        self.upsert_vectors([
            {
                "id": image_id,
                "values": list(embedding),
                "metadata": metadata,
            }
        ])

    def search(self, *, embedding: Sequence[float], top_k: int | None = None) -> list[dict[str, Any]]:
        response = self._index.query(
            vector=list(embedding),
            top_k=top_k or self._settings.pinecone_top_k,
            namespace=self._settings.pinecone_namespace,
            include_metadata=True,
        )

        matches = []
        for match in getattr(response, "matches", []) or []:
            matches.append(
                {
                    "id": getattr(match, "id", None),
                    "score": getattr(match, "score", 0.0),
                    "metadata": getattr(match, "metadata", {}) or {},
                }
            )
        return matches

    def search_by_text(self, text: str, top_k: int | None = None) -> list[dict[str, Any]]:
        embedding = self.encode_text(text)
        return self.search(embedding=embedding, top_k=top_k)

    def search_by_image_url(self, image_url: str, top_k: int | None = None) -> list[dict[str, Any]]:
        embedding = self.encode_image(image_url)
        return self.search(embedding=embedding, top_k=top_k)
    
    def search_by_image_bytes(self, image_bytes: bytes, top_k: int | None = None) -> list[dict[str, Any]]:
        """Search using raw image bytes from uploaded file."""
        embedding = self.encode_image_from_bytes(image_bytes)
        return self.search(embedding=embedding, top_k=top_k)

    def search_hybrid(self, text: str, image_url: str, text_weight: float = 0.5, top_k: int | None = None) -> list[dict[str, Any]]:
        """
        Perform hybrid search combining text and image embeddings.
        
        Args:
            text: Text query
            image_url: URL of reference image
            text_weight: Weight for text embedding (0.0-1.0), image weight = 1 - text_weight
            top_k: Number of results to return
        """
        text_embedding = self.encode_text(text)
        image_embedding = self.encode_image(image_url)
        
        # Combine embeddings with weighted average
        text_embedding = np.array(text_embedding)
        image_embedding = np.array(image_embedding)
        
        hybrid_embedding = (text_weight * text_embedding + (1 - text_weight) * image_embedding)
        # Normalize the combined embedding
        hybrid_embedding = hybrid_embedding / np.linalg.norm(hybrid_embedding)
        
        return self.search(embedding=hybrid_embedding.tolist(), top_k=top_k)

    def apply_metadata_filters(self, matches: list[dict[str, Any]], filters: dict[str, Any]) -> list[dict[str, Any]]:
        """Apply metadata-based filters to search results."""
        if not filters:
            return matches
        
        filtered_matches = []
        for match in matches:
            metadata = match.get("metadata", {})
            
            # Color filter
            if filters.get("color") and metadata.get("color"):
                if filters["color"] != metadata["color"]:
                    continue
            
            # Orientation filter
            if filters.get("orientation"):
                width = metadata.get("width", 0)
                height = metadata.get("height", 0)
                if width and height:
                    aspect_ratio = width / height
                    if filters["orientation"] == "landscape" and aspect_ratio <= 1.2:
                        continue
                    elif filters["orientation"] == "portrait" and aspect_ratio >= 0.8:
                        continue
                    elif filters["orientation"] == "squarish" and (aspect_ratio < 0.8 or aspect_ratio > 1.2):
                        continue
            
            # Date filters
            if filters.get("date_from") or filters.get("date_to"):
                created_at = metadata.get("created_at")
                if created_at:
                    try:
                        image_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                        if filters.get("date_from"):
                            from_date = datetime.fromisoformat(filters["date_from"])
                            if image_date < from_date:
                                continue
                        if filters.get("date_to"):
                            to_date = datetime.fromisoformat(filters["date_to"])
                            if image_date > to_date:
                                continue
                    except (ValueError, TypeError):
                        # Skip if date parsing fails
                        continue
            
            filtered_matches.append(match)
        
        return filtered_matches

    def calculate_color_similarity(self, query_color: str, image_color: str) -> float:
        """Calculate color similarity score between query and image colors."""
        if not query_color or not image_color:
            return 0.0
        
        # Color mapping to RGB values (simplified)
        color_map = {
            'black': (0, 0, 0),
            'white': (255, 255, 255),
            'red': (255, 0, 0),
            'green': (0, 255, 0),
            'blue': (0, 0, 255),
            'yellow': (255, 255, 0),
            'orange': (255, 165, 0),
            'purple': (128, 0, 128),
            'magenta': (255, 0, 255),
            'teal': (0, 128, 128),
            'black_and_white': (128, 128, 128)  # Gray as average
        }
        
        query_rgb = color_map.get(query_color.lower(), (128, 128, 128))
        image_rgb = color_map.get(image_color.lower(), (128, 128, 128))
        
        # Calculate Euclidean distance in RGB space
        distance = np.sqrt(sum((a - b) ** 2 for a, b in zip(query_rgb, image_rgb)))
        max_distance = np.sqrt(3 * (255 ** 2))  # Maximum possible distance
        
        # Convert to similarity score (0-1)
        similarity = 1.0 - (distance / max_distance)
        return max(0.0, similarity)

    def calculate_text_metadata_similarity(self, query: str, metadata: dict) -> float:
        """Calculate text similarity between query and image metadata."""
        if not query:
            return 0.0
        
        # Combine relevant text fields from metadata
        text_fields = []
        
        # Add description, tags, photographer, etc.
        if metadata.get('description'):
            text_fields.append(metadata['description'])
        if metadata.get('tags'):
            text_fields.extend(metadata['tags'])
        if metadata.get('photographer'):
            text_fields.append(metadata['photographer'])
        if metadata.get('caption'):
            text_fields.append(metadata['caption'])
        if metadata.get('detailed_description'):
            text_fields.append(metadata['detailed_description'])
        
        if not text_fields:
            return 0.0
        
        # Simple text similarity using word overlap (in production, use embeddings)
        query_words = set(query.lower().split())
        text_content = ' '.join(text_fields).lower()
        text_words = set(text_content.split())
        
        if not text_words:
            return 0.0
        
        # Calculate Jaccard similarity
        intersection = len(query_words.intersection(text_words))
        union = len(query_words.union(text_words))
        
        return intersection / union if union > 0 else 0.0

    def search_with_weighted_scoring(
        self, 
        query: str, 
        image_url: Optional[str] = None,
        image_weight: float = 0.6,
        text_weight: float = 0.2,
        metadata_weight: float = 0.2,
        color_filter: Optional[str] = None,
        top_k: Optional[int] = None
    ) -> List[dict[str, Any]]:
        """
        Perform advanced search with weighted multi-modal scoring.
        
        Args:
            query: Text query
            image_url: Optional image URL for visual similarity
            image_weight: Weight for image embedding similarity (0.0-1.0)
            text_weight: Weight for text/metadata similarity (0.0-1.0)
            metadata_weight: Weight for metadata/color similarity (0.0-1.0)
            color_filter: Optional color filter for metadata matching
            top_k: Number of results to return
        
        Returns:
            List of search results with weighted scores
        """
        # Normalize weights to sum to 1.0
        total_weight = image_weight + text_weight + metadata_weight
        if total_weight > 0:
            image_weight /= total_weight
            text_weight /= total_weight
            metadata_weight /= total_weight
        
        # Get initial results based on primary search mode
        if image_url:
            # Use image similarity as primary
            matches = self.search_by_image_url(image_url, top_k=top_k * 2)  # Get more for reranking
        else:
            # Use text similarity as primary
            matches = self.search_by_text(query, top_k=top_k * 2)
        
        # Calculate weighted scores for each match
        weighted_matches = []
        
        for match in matches:
            metadata = match.get('metadata', {})
            base_score = match.get('score', 0.0)
            
            # Component scores
            image_score = base_score  # Use base similarity as image score
            text_score = self.calculate_text_metadata_similarity(query, metadata)
            color_score = 0.0
            
            if color_filter and metadata.get('color'):
                color_score = self.calculate_color_similarity(color_filter, metadata['color'])
            
            # Calculate weighted final score
            final_score = (
                image_weight * image_score +
                text_weight * text_score +
                metadata_weight * color_score
            )
            
            # Add component scores to metadata for debugging
            enhanced_metadata = metadata.copy()
            enhanced_metadata.update({
                'component_scores': {
                    'image_score': image_score,
                    'text_score': text_score,
                    'color_score': color_score,
                    'final_weighted_score': final_score
                },
                'weights_used': {
                    'image_weight': image_weight,
                    'text_weight': text_weight,
                    'metadata_weight': metadata_weight
                }
            })
            
            weighted_match = {
                'id': match.get('id'),
                'score': final_score,
                'metadata': enhanced_metadata
            }
            
            weighted_matches.append(weighted_match)
        
        # Sort by weighted score and return top results
        weighted_matches.sort(key=lambda x: x['score'], reverse=True)
        return weighted_matches[:top_k] if top_k else weighted_matches

    def enhance_with_visual_captions(self, image_url: str, metadata: dict) -> dict:
        """Enhance metadata with AI-generated visual captions."""
        try:
            captioning_service = get_captioning_service(model_type="mock")  # Use mock for now
            
            # Generate captions and descriptions
            caption_data = captioning_service.generate_searchable_text(image_url)
            
            # Add to metadata
            enhanced_metadata = metadata.copy()
            enhanced_metadata.update({
                'ai_caption': caption_data['caption'],
                'ai_detailed_description': caption_data['detailed_description'],
                'ai_combined_text': caption_data['combined_text'],
                'ai_keywords': caption_data['searchable_keywords'],
                'caption_generated_at': datetime.now().isoformat()
            })
            
            return enhanced_metadata
            
        except Exception as e:
            # If captioning fails, return original metadata
            return metadata

    def upsert_image_with_captions(self, *, image_id: str, embedding: Sequence[float], metadata: dict[str, Any]) -> None:
        """Upsert image with enhanced metadata including AI-generated captions."""
        image_url = metadata.get('image_url') or metadata.get('thumbnail_url')
        
        if image_url:
            # Enhance metadata with visual captions
            enhanced_metadata = self.enhance_with_visual_captions(image_url, metadata)
        else:
            enhanced_metadata = metadata
        
        # Use existing upsert method with enhanced metadata
        self.upsert_image(
            image_id=image_id,
            embedding=embedding,
            metadata=enhanced_metadata
        )

    def describe_stats(self) -> dict[str, Any]:
        stats = self._index.describe_index_stats(namespace=self._settings.pinecone_namespace)
        namespaces = getattr(stats, "namespaces", {}) or {}
        dimension = getattr(stats, "dimension", self._settings.embedding_dim)
        namespace_counts: dict[str, int] = {}
        total_vectors = 0
        for name, info in namespaces.items():
            vector_count = getattr(info, "vector_count", 0)
            namespace_counts[name] = vector_count
            total_vectors += vector_count

        return {
            "dimension": dimension,
            "namespaces": namespace_counts,
            "total_vectors": total_vectors,
        }


_image_search_engine: ImageSearchEngine | None = None


def get_image_search_engine() -> ImageSearchEngine:
    global _image_search_engine
    if _image_search_engine is None:
        _image_search_engine = ImageSearchEngine()
    return _image_search_engine
