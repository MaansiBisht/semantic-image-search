from __future__ import annotations

from pathlib import Path
import sys

import pytest
from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.main import create_app
from app.services.clip_service import get_clip_service
from app.services.image_search_engine import get_image_search_engine
from app.services.unsplash_fetcher import get_unsplash_fetcher


class FakeClipService:
    def encode_text(self, text: str) -> list[float]:  # noqa: D401
        return [0.1, 0.2, 0.3]

    def encode_image_from_url(self, image_url: str) -> list[float]:  # noqa: D401
        return [0.4, 0.5, 0.6]

    def cosine_similarity(self, vector_a, vector_b) -> float:  # noqa: D401
        return 0.75


class FakeImageSearchEngine:
    def __init__(self) -> None:
        self.search_calls: list[dict[str, str]] = []
        self.raise_error: Exception | None = None

    def search_by_text(self, text: str, top_k: int | None = None):  # noqa: D401
        if self.raise_error:
            raise self.raise_error
        self.search_calls.append({"text": text, "top_k": top_k})
        return [
            {
                "id": "image-1",
                "score": 0.95,
                "metadata": {"image_url": "https://example.com/1.jpg", "query": text},
            }
        ]

    def describe_stats(self):  # noqa: D401
        return {"dimension": 512, "namespaces": {"default": 42}, "total_vectors": 42}


class FakeUnsplashFetcher:
    def __init__(self) -> None:
        self.raise_search_error: Exception | None = None
        self.raise_topic_error: Exception | None = None

    def fetch_and_index(self, query: str, *, page: int = 1, per_page: int | None = None):  # noqa: D401
        if self.raise_search_error:
            raise self.raise_search_error
        return [
            {
                "id": "unsplash-1",
                "image_url": "https://images.unsplash.com/photo-1",
                "query": query,
            }
        ]

    def list_topics(self, *, per_page: int | None = None):  # noqa: D401
        if self.raise_topic_error:
            raise self.raise_topic_error
        return [
            {
                "id": "topic-1",
                "title": "Nature",
                "slug": "nature",
                "description": "Outdoor photography",
                "cover_photo": {"urls": {"small": "https://images.unsplash.com/cover.jpg"}},
            }
        ]


@pytest.fixture()
def app():
    app = create_app()

    fake_clip = FakeClipService()
    fake_engine = FakeImageSearchEngine()
    fake_fetcher = FakeUnsplashFetcher()

    app.dependency_overrides[get_clip_service] = lambda: fake_clip
    app.dependency_overrides[get_image_search_engine] = lambda: fake_engine
    app.dependency_overrides[get_unsplash_fetcher] = lambda: fake_fetcher

    app.state.test_fakes = {
        "clip": fake_clip,
        "engine": fake_engine,
        "fetcher": fake_fetcher,
    }

    yield app

    app.dependency_overrides.clear()


@pytest.fixture()
def client(app) -> TestClient:
    return TestClient(app)


@pytest.fixture()
def fakes(app):
    return app.state.test_fakes
