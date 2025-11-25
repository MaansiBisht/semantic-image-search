from __future__ import annotations

import gc
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
        self._model = None  # Lazy loading
        self._processor = None  # Lazy loading
        self._settings = settings

    def _ensure_model_loaded(self) -> None:
        """Lazy load the model only when needed."""
        if self._model is None:
            # Load model with maximum memory optimization
            self._model = CLIPModel.from_pretrained(
                self._settings.clip_model_name,
                torch_dtype=torch.float16 if self._device.type == "cuda" else torch.float32,
                low_cpu_mem_usage=True,
                device_map="auto" if self._device.type == "cuda" else None
            )
            
            # Optimize model for inference
            self._model.eval()
            
            # Move to device if not using device_map
            if not (self._device.type == "cuda" and hasattr(self._model, 'hf_device_map')):
                self._model = self._model.to(self._device)
        
        if self._processor is None:
            self._processor = CLIPProcessor.from_pretrained(self._settings.clip_model_name)

    @property
    def device(self) -> torch.device:
        return self._device

    def encode_text(self, text: str) -> list[float]:
        if not text:
            raise ValueError("Text must not be empty")

        self._ensure_model_loaded()
        inputs = self._processor(text=[text], return_tensors="pt", padding=True).to(self.device)
        with torch.no_grad():
            text_features = self._model.get_text_features(**inputs)
            normalized = text_features / text_features.norm(dim=-1, keepdim=True)
            result = normalized.squeeze(0).cpu().tolist()
        
        # Clear intermediate tensors to free memory
        del inputs, text_features, normalized
        if self._device.type == "cuda":
            torch.cuda.empty_cache()
        gc.collect()  # Force garbage collection
        
        return result

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
        self._ensure_model_loaded()
        
        # Resize image to reduce memory usage - smaller size for Render
        if max(image.size) > 256:
            image = image.resize((256, 256), Image.Resampling.LANCZOS)
        
        # Convert to RGB if needed
        if image.mode != "RGB":
            image = image.convert("RGB")
        
        inputs = self._processor(images=image, return_tensors="pt").to(self.device)
        
        # Use smaller batch size and clear memory aggressively
        with torch.no_grad():
            image_features = self._model.get_image_features(**inputs)
            normalized = image_features / image_features.norm(dim=-1, keepdim=True)
            result = normalized.squeeze(0).cpu().tolist()
        
        # Aggressive memory cleanup
        del inputs, image_features, normalized
        if hasattr(image, 'close'):
            image.close()
        if self._device.type == "cuda":
            torch.cuda.empty_cache()
        gc.collect()  # Force garbage collection
        
        return result


# Global instance to avoid multiple model loading
_clip_service_instance = None

def get_clip_service() -> CLIPService:
    global _clip_service_instance
    if _clip_service_instance is None:
        _clip_service_instance = CLIPService()
    return _clip_service_instance
