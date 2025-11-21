"""
Advanced indexing configuration for Pinecone with HNSW and IVF-Flat options.
"""

from __future__ import annotations

from enum import Enum
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

from app.config.settings import get_settings


class IndexType(str, Enum):
    """Supported Pinecone index types for different use cases."""
    HNSW = "hnsw"  # Hierarchical Navigable Small World - High accuracy
    IVF_FLAT = "ivf_flat"  # Inverted File with Flat quantizer - Fast for large datasets
    PQ = "pq"  # Product Quantization - Memory efficient for millions of vectors


class IndexConfig(BaseModel):
    """Configuration for Pinecone index creation and optimization."""
    
    # Basic index settings
    name: str = Field(..., description="Index name")
    dimension: int = Field(512, description="Vector dimension")
    metric: str = Field("cosine", description="Distance metric (cosine, euclidean, dotproduct)")
    
    # Index type and performance settings
    index_type: IndexType = Field(IndexType.HNSW, description="Index algorithm type")
    
    # HNSW specific parameters
    hnsw_m: int = Field(16, ge=4, le=64, description="HNSW M parameter - connections per node")
    hnsw_ef_construction: int = Field(200, ge=100, le=800, description="HNSW ef_construction - search width during construction")
    hnsw_max_connections: int = Field(32, ge=16, le=128, description="Maximum connections per node")
    
    # IVF-Flat specific parameters
    ivf_nlist: int = Field(1024, ge=100, le=10000, description="Number of clusters for IVF")
    ivf_nprobe: int = Field(10, ge=1, le=100, description="Number of clusters to search")
    
    # PQ specific parameters
    pq_m: int = Field(8, ge=4, le=64, description="Number of subquantizers for PQ")
    pq_nbits: int = Field(8, ge=4, le=16, description="Bits per subquantizer")
    
    # Performance and capacity settings
    replicas: int = Field(1, ge=1, le=10, description="Number of replicas")
    shards: int = Field(1, ge=1, le=10, description="Number of shards")
    
    # Memory and storage optimization
    enable_compression: bool = Field(False, description="Enable vector compression")
    batch_size: int = Field(100, ge=10, le=1000, description="Batch size for operations")
    
    # Search optimization
    search_k: int = Field(50, ge=10, le=500, description="Search parameter k")
    max_results: int = Field(100, ge=10, le=1000, description="Maximum results to return")


class IndexingStrategy:
    """Strategy class for choosing optimal indexing configuration based on use case."""
    
    @staticmethod
    def get_high_accuracy_config(dimension: int = 512) -> IndexConfig:
        """Configuration optimized for highest accuracy (HNSW)."""
        return IndexConfig(
            name="semantic-search-hnsw",
            dimension=dimension,
            metric="cosine",
            index_type=IndexType.HNSW,
            hnsw_m=32,  # Higher M for better accuracy
            hnsw_ef_construction=400,  # Higher ef_construction for better build quality
            hnsw_max_connections=64,
            replicas=2,  # Redundancy for reliability
            search_k=100,  # More thorough search
            max_results=100
        )
    
    @staticmethod
    def get_high_speed_config(dimension: int = 512) -> IndexConfig:
        """Configuration optimized for speed (IVF-Flat)."""
        return IndexConfig(
            name="semantic-search-ivf",
            dimension=dimension,
            metric="cosine",
            index_type=IndexType.IVF_FLAT,
            ivf_nlist=2048,  # More clusters for better partitioning
            ivf_nprobe=5,  # Fewer probes for speed
            replicas=1,
            batch_size=500,  # Larger batches for throughput
            search_k=30,  # Faster search
            max_results=50
        )
    
    @staticmethod
    def get_memory_efficient_config(dimension: int = 512) -> IndexConfig:
        """Configuration optimized for memory efficiency (PQ)."""
        return IndexConfig(
            name="semantic-search-pq",
            dimension=dimension,
            metric="cosine",
            index_type=IndexType.PQ,
            pq_m=16,  # More subquantizers for better quality
            pq_nbits=8,
            enable_compression=True,
            replicas=1,
            batch_size=200,
            search_k=40,
            max_results=75
        )
    
    @staticmethod
    def get_balanced_config(dimension: int = 512) -> IndexConfig:
        """Balanced configuration for general use."""
        return IndexConfig(
            name="semantic-search-balanced",
            dimension=dimension,
            metric="cosine",
            index_type=IndexType.HNSW,
            hnsw_m=16,  # Standard M value
            hnsw_ef_construction=200,  # Standard ef_construction
            hnsw_max_connections=32,
            replicas=1,
            search_k=50,
            max_results=100
        )
    
    @staticmethod
    def choose_config_by_dataset_size(
        num_vectors: int, 
        dimension: int = 512,
        priority: str = "balanced"
    ) -> IndexConfig:
        """Choose optimal configuration based on dataset size and priority."""
        
        if num_vectors < 10000:
            # Small dataset - prioritize accuracy
            return IndexingStrategy.get_high_accuracy_config(dimension)
        
        elif num_vectors < 100000:
            # Medium dataset - balanced approach
            if priority == "accuracy":
                return IndexingStrategy.get_high_accuracy_config(dimension)
            elif priority == "speed":
                return IndexingStrategy.get_high_speed_config(dimension)
            else:
                return IndexingStrategy.get_balanced_config(dimension)
        
        elif num_vectors < 1000000:
            # Large dataset - consider speed and memory
            if priority == "accuracy":
                config = IndexingStrategy.get_high_accuracy_config(dimension)
                config.hnsw_m = 24  # Slightly reduce for performance
                config.hnsw_ef_construction = 300
                return config
            elif priority == "memory":
                return IndexingStrategy.get_memory_efficient_config(dimension)
            else:
                return IndexingStrategy.get_high_speed_config(dimension)
        
        else:
            # Very large dataset - prioritize memory and speed
            if priority == "accuracy":
                return IndexingStrategy.get_high_speed_config(dimension)  # IVF-Flat still good
            else:
                return IndexingStrategy.get_memory_efficient_config(dimension)  # PQ for compression


class FineTuningConfig(BaseModel):
    """Configuration for fine-tuning integration points."""
    
    # Model fine-tuning settings
    enable_fine_tuning: bool = Field(False, description="Enable model fine-tuning")
    base_model: str = Field("openai/clip-vit-base-patch32", description="Base model for fine-tuning")
    
    # LoRA (Low-Rank Adaptation) settings
    use_lora: bool = Field(True, description="Use LoRA for efficient fine-tuning")
    lora_rank: int = Field(16, ge=4, le=64, description="LoRA rank parameter")
    lora_alpha: int = Field(32, ge=8, le=128, description="LoRA alpha parameter")
    lora_dropout: float = Field(0.1, ge=0.0, le=0.5, description="LoRA dropout rate")
    
    # Training settings
    learning_rate: float = Field(1e-4, ge=1e-6, le=1e-2, description="Learning rate")
    batch_size: int = Field(32, ge=4, le=128, description="Training batch size")
    num_epochs: int = Field(10, ge=1, le=100, description="Number of training epochs")
    
    # Data settings
    custom_dataset_path: Optional[str] = Field(None, description="Path to custom dataset")
    validation_split: float = Field(0.2, ge=0.1, le=0.4, description="Validation data split")
    
    # Integration settings
    update_embeddings_after_training: bool = Field(True, description="Re-embed all images after training")
    backup_original_embeddings: bool = Field(True, description="Backup original embeddings")
    
    # Performance monitoring
    track_metrics: bool = Field(True, description="Track training metrics")
    save_checkpoints: bool = Field(True, description="Save training checkpoints")


def get_recommended_config() -> IndexConfig:
    """Get recommended configuration based on current settings."""
    settings = get_settings()
    
    # Estimate dataset size (this would be dynamic in production)
    estimated_vectors = 50000  # Default estimate
    
    # Choose configuration based on estimated size
    return IndexingStrategy.choose_config_by_dataset_size(
        num_vectors=estimated_vectors,
        dimension=settings.embedding_dim,
        priority="balanced"
    )


def get_fine_tuning_integration_points() -> Dict[str, Any]:
    """Get integration points for fine-tuning implementation."""
    return {
        "embedding_service": {
            "description": "Replace CLIP service with fine-tuned model",
            "integration_point": "app.services.clip_service.CLIPService",
            "method": "Load fine-tuned weights into existing CLIP model"
        },
        "training_pipeline": {
            "description": "Add training pipeline for custom datasets",
            "integration_point": "app.services.training_service.TrainingService",
            "method": "Implement LoRA fine-tuning with custom image-text pairs"
        },
        "embedding_update": {
            "description": "Re-embed existing images with fine-tuned model",
            "integration_point": "app.services.image_search_engine.ImageSearchEngine",
            "method": "Batch re-embedding and index update process"
        },
        "model_versioning": {
            "description": "Version control for different model iterations",
            "integration_point": "app.config.model_registry.ModelRegistry",
            "method": "Track model versions and performance metrics"
        },
        "evaluation_metrics": {
            "description": "Evaluate fine-tuned model performance",
            "integration_point": "app.services.evaluation_service.EvaluationService",
            "method": "Compare search relevance before/after fine-tuning"
        }
    }
