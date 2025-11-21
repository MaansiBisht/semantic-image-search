from __future__ import annotations

from typing import Annotated

from pydantic import BaseModel, Field, ValidationInfo, field_validator


class EmbeddingResponse(BaseModel):
    embedding: list[float]


class TextEmbeddingRequest(BaseModel):
    text: Annotated[str, Field(min_length=1)]


class ImageEmbeddingUrlRequest(BaseModel):
    image_url: Annotated[str, Field(min_length=1)]


class SimilarityRequest(BaseModel):
    vector_a: list[float]
    vector_b: list[float]

    @field_validator("vector_a", "vector_b")
    @classmethod
    def validate_vector(cls, value: list[float]) -> list[float]:
        if not value:
            raise ValueError("Embedding vector cannot be empty")
        return value

    @field_validator("vector_b")
    @classmethod
    def validate_matching_dimension(cls, vector_b: list[float], info: ValidationInfo) -> list[float]:
        vector_a = info.data.get("vector_a")
        if vector_a is not None and len(vector_a) != len(vector_b):
            raise ValueError("Embedding vectors must be the same length")
        return vector_b


class SimilarityResponse(BaseModel):
    similarity: float
