from __future__ import annotations

import io
from functools import lru_cache
from typing import Sequence

import httpx
import torch
from PIL import Image
from transformers import CLIPModel, CLIPProcessor

from app.config.settings import get_settings


class CLIPService:
    """Helper class to generate embeddings with Hugging Face CLIP."""

    def __init__(self) -> None:
        settings = get_settings()
        requested_device = settings.device
        if requested_device == "cuda" and not torch.cuda.is_available():
            requested_device = "cpu"

        self._device = torch.device(requested_device)
        self._model = CLIPModel.from_pretrained(settings.clip_model_name).to(self._device)
        self._processor = CLIPProcessor.from_pretrained(settings.clip_model_name)

    @property
    def device(self) -> torch.device:
        return self._device

    def encode_text(self, text: str) -> list[float]:
        if not text:
            raise ValueError("Text must not be empty")

        inputs = self._processor(text=[text], return_tensors="pt", padding=True).to(self.device)
        with torch.no_grad():
            text_features = self._model.get_text_features(**inputs)
            normalized = text_features / text_features.norm(dim=-1, keepdim=True)
        return normalized.squeeze(0).cpu().tolist()

    def encode_image_from_bytes(self, image_bytes: bytes) -> list[float]:
        with Image.open(io.BytesIO(image_bytes)) as image:
            return self._encode_image(image.convert("RGB"))

    def encode_image_from_url(self, image_url: str, *, timeout: float = 10.0) -> list[float]:
        if not image_url:
            raise ValueError("Image URL must not be empty")

        try:
            response = httpx.get(image_url, timeout=timeout)
            response.raise_for_status()
        except httpx.HTTPError as exc:  # pragma: no cover - network errors
            raise ValueError(f"Failed to retrieve image: {exc}") from exc

        return self.encode_image_from_bytes(response.content)

    def cosine_similarity(self, vector_a: Sequence[float], vector_b: Sequence[float]) -> float:
        a = torch.tensor(vector_a, dtype=torch.float32)
        b = torch.tensor(vector_b, dtype=torch.float32)

        if a.shape != b.shape:
            raise ValueError("Vectors must have the same shape")

        a_norm = a / a.norm()
        b_norm = b / b.norm()
        return torch.dot(a_norm, b_norm).item()

    def _encode_image(self, image: Image.Image) -> list[float]:
        inputs = self._processor(images=image, return_tensors="pt").to(self.device)
        with torch.no_grad():
            image_features = self._model.get_image_features(**inputs)
            normalized = image_features / image_features.norm(dim=-1, keepdim=True)
        return normalized.squeeze(0).cpu().tolist()


@lru_cache
def get_clip_service() -> CLIPService:
    return CLIPService()
