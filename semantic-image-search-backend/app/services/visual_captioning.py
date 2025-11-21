"""
Visual Captioning Service using BLIP/LLaVA models for automatic image description generation.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any, Optional
from abc import ABC, abstractmethod

import requests
from PIL import Image
import torch
from transformers import BlipProcessor, BlipForConditionalGeneration

from app.config.settings import get_settings

logger = logging.getLogger(__name__)


class BaseCaptioningModel(ABC):
    """Abstract base class for visual captioning models."""
    
    @abstractmethod
    def generate_caption(self, image_url: str) -> str:
        """Generate a caption for the given image URL."""
        pass
    
    @abstractmethod
    def generate_detailed_description(self, image_url: str) -> str:
        """Generate a detailed description for the given image URL."""
        pass


class BLIPCaptioningModel(BaseCaptioningModel):
    """BLIP-based image captioning model."""
    
    def __init__(self, model_name: str = "Salesforce/blip-image-captioning-base"):
        self.model_name = model_name
        self.processor = None
        self.model = None
        self._load_model()
    
    def _load_model(self):
        """Load the BLIP model and processor."""
        try:
            logger.info(f"Loading BLIP model: {self.model_name}")
            self.processor = BlipProcessor.from_pretrained(self.model_name)
            self.model = BlipForConditionalGeneration.from_pretrained(self.model_name)
            
            # Move to GPU if available
            if torch.cuda.is_available():
                self.model = self.model.cuda()
                logger.info("BLIP model loaded on GPU")
            else:
                logger.info("BLIP model loaded on CPU")
                
        except Exception as e:
            logger.error(f"Failed to load BLIP model: {e}")
            raise RuntimeError(f"Could not initialize BLIP model: {e}")
    
    def _load_image_from_url(self, image_url: str) -> Image.Image:
        """Load image from URL."""
        try:
            response = requests.get(image_url, timeout=10)
            response.raise_for_status()
            return Image.open(response.content).convert('RGB')
        except Exception as e:
            logger.error(f"Failed to load image from {image_url}: {e}")
            raise ValueError(f"Could not load image: {e}")
    
    def generate_caption(self, image_url: str) -> str:
        """Generate a simple caption for the image."""
        if not self.model or not self.processor:
            raise RuntimeError("Model not loaded")
        
        try:
            image = self._load_image_from_url(image_url)
            
            # Process image and generate caption
            inputs = self.processor(image, return_tensors="pt")
            
            if torch.cuda.is_available():
                inputs = {k: v.cuda() for k, v in inputs.items()}
            
            with torch.no_grad():
                out = self.model.generate(**inputs, max_length=50, num_beams=5)
            
            caption = self.processor.decode(out[0], skip_special_tokens=True)
            logger.info(f"Generated caption for {image_url}: {caption}")
            return caption
            
        except Exception as e:
            logger.error(f"Failed to generate caption for {image_url}: {e}")
            return "Unable to generate caption"
    
    def generate_detailed_description(self, image_url: str) -> str:
        """Generate a detailed description using conditional generation."""
        if not self.model or not self.processor:
            raise RuntimeError("Model not loaded")
        
        try:
            image = self._load_image_from_url(image_url)
            
            # Use conditional generation for more detailed descriptions
            prompt = "a detailed description of"
            inputs = self.processor(image, prompt, return_tensors="pt")
            
            if torch.cuda.is_available():
                inputs = {k: v.cuda() for k, v in inputs.items()}
            
            with torch.no_grad():
                out = self.model.generate(
                    **inputs, 
                    max_length=100, 
                    num_beams=5,
                    temperature=0.7,
                    do_sample=True
                )
            
            description = self.processor.decode(out[0], skip_special_tokens=True)
            # Remove the prompt from the output
            description = description.replace(prompt, "").strip()
            
            logger.info(f"Generated detailed description for {image_url}: {description}")
            return description
            
        except Exception as e:
            logger.error(f"Failed to generate detailed description for {image_url}: {e}")
            return self.generate_caption(image_url)  # Fallback to simple caption


class MockCaptioningModel(BaseCaptioningModel):
    """Mock captioning model for development/testing."""
    
    def generate_caption(self, image_url: str) -> str:
        """Generate a mock caption."""
        return f"A beautiful image from {image_url.split('/')[-1]}"
    
    def generate_detailed_description(self, image_url: str) -> str:
        """Generate a mock detailed description."""
        return f"This is a detailed description of the image located at {image_url}. The image contains various visual elements that would be analyzed by a real captioning model."


class VisualCaptioningService:
    """Service for generating image captions and descriptions."""
    
    def __init__(self, model_type: str = "blip"):
        self.model_type = model_type
        self.model: Optional[BaseCaptioningModel] = None
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize the captioning model based on configuration."""
        settings = get_settings()
        
        try:
            if self.model_type.lower() == "blip":
                self.model = BLIPCaptioningModel()
            elif self.model_type.lower() == "mock":
                self.model = MockCaptioningModel()
            else:
                logger.warning(f"Unknown model type: {self.model_type}, using mock model")
                self.model = MockCaptioningModel()
                
        except Exception as e:
            logger.error(f"Failed to initialize {self.model_type} model: {e}")
            logger.info("Falling back to mock model")
            self.model = MockCaptioningModel()
    
    def generate_caption(self, image_url: str) -> str:
        """Generate a caption for the given image URL."""
        if not self.model:
            raise RuntimeError("Captioning model not initialized")
        
        return self.model.generate_caption(image_url)
    
    def generate_detailed_description(self, image_url: str) -> str:
        """Generate a detailed description for the given image URL."""
        if not self.model:
            raise RuntimeError("Captioning model not initialized")
        
        return self.model.generate_detailed_description(image_url)
    
    def generate_searchable_text(self, image_url: str) -> dict[str, str]:
        """Generate both caption and detailed description for search indexing."""
        try:
            caption = self.generate_caption(image_url)
            description = self.generate_detailed_description(image_url)
            
            # Combine for comprehensive searchable text
            combined_text = f"{caption}. {description}"
            
            return {
                "caption": caption,
                "detailed_description": description,
                "combined_text": combined_text,
                "searchable_keywords": self._extract_keywords(combined_text)
            }
            
        except Exception as e:
            logger.error(f"Failed to generate searchable text for {image_url}: {e}")
            return {
                "caption": "Image",
                "detailed_description": "Unable to analyze image",
                "combined_text": "Image content",
                "searchable_keywords": ""
            }
    
    def _extract_keywords(self, text: str) -> str:
        """Extract keywords from generated text for better searchability."""
        # Simple keyword extraction - in production, use more sophisticated NLP
        import re
        
        # Remove common words and extract meaningful terms
        stop_words = {
            'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
            'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
            'to', 'was', 'will', 'with', 'this', 'there', 'their', 'they'
        }
        
        # Extract words, filter stop words, and join
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
        keywords = [word for word in words if word not in stop_words]
        
        return ' '.join(set(keywords))  # Remove duplicates


# Global service instance
_captioning_service: Optional[VisualCaptioningService] = None


def get_captioning_service(model_type: str = "mock") -> VisualCaptioningService:
    """Get or create the global captioning service instance."""
    global _captioning_service
    
    if _captioning_service is None:
        _captioning_service = VisualCaptioningService(model_type=model_type)
    
    return _captioning_service


def reset_captioning_service():
    """Reset the global captioning service (useful for testing)."""
    global _captioning_service
    _captioning_service = None
