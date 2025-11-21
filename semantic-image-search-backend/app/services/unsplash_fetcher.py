from __future__ import annotations

from collections.abc import Sequence
from typing import Any

import httpx

from app.config.settings import get_settings
from app.services.image_search_engine import ImageSearchEngine, get_image_search_engine


class UnsplashFetcher:
    def __init__(
        self,
        image_search_engine: ImageSearchEngine | None = None,
        *,
        timeout: float = 10.0,
    ) -> None:
        self._settings = get_settings()
        if not self._settings.unsplash_access_key:
            raise RuntimeError("Unsplash access key is not configured")

        self._engine = image_search_engine or get_image_search_engine()
        self._timeout = timeout

    def search_photos(
        self,
        query: str,
        *,
        page: int = 1,
        per_page: int | None = None,
    ) -> dict[str, Any]:
        params = {
            "query": query,
            "page": page,
            "per_page": per_page or self._settings.unsplash_results_per_page,
        }
        return self._request("GET", "/search/photos", params=params)

    def list_topics(self, *, per_page: int | None = None) -> Sequence[dict[str, Any]]:
        params = {
            "per_page": per_page or self._settings.unsplash_results_per_page,
            "order_by": "featured",
        }
        response = self._request("GET", "/topics", params=params)
        assert isinstance(response, list)  # Unsplash returns a list of topics
        return response

    def fetch_and_index(
        self,
        query: str,
        *,
        page: int = 1,
        per_page: int | None = None,
    ) -> list[dict[str, Any]]:
        search_results = self.search_photos(query, page=page, per_page=per_page)
        photos: Sequence[dict[str, Any]] = search_results.get("results", [])

        ingested: list[dict[str, Any]] = []
        for photo in photos:
            image_id = photo.get("id")
            urls = photo.get("urls", {})
            if not image_id or not urls:
                continue

            image_url = urls.get("regular") or urls.get("full") or urls.get("small")
            thumbnail_url = urls.get("thumb") or urls.get("small")
            if not image_url:
                continue

            try:
                embedding = self._engine.encode_image(image_url)
            except Exception:  # pragma: no cover - CLIP failures are unexpected
                continue

            metadata = self._build_metadata(photo, query=query, image_url=image_url, thumbnail_url=thumbnail_url)
            self._engine.upsert_image(image_id=image_id, embedding=embedding, metadata=metadata)
            ingested.append({"id": image_id, **metadata})

        return ingested

    def _request(self, method: str, path: str, *, params: dict[str, Any] | None = None) -> Any:
        headers = {
            "Authorization": f"Client-ID {self._settings.unsplash_access_key}",
            "Accept-Version": "v1",
        }
        try:
            with httpx.Client(base_url=self._settings.unsplash_api_base_url, timeout=self._timeout, headers=headers) as client:
                response = client.request(method, path, params=params)
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as exc:  # pragma: no cover - network errors
            raise ValueError(f"Unsplash API request failed: {exc}") from exc

    def _build_metadata(
        self,
        photo: dict[str, Any],
        *,
        query: str,
        image_url: str,
        thumbnail_url: str | None,
    ) -> dict[str, Any]:
        user_info = photo.get("user", {}) or {}
        tags = [tag.get("title") for tag in photo.get("tags", []) if isinstance(tag, dict) and tag.get("title")]
        return {
            "source": "unsplash",
            "query": query,
            "image_url": image_url,
            "thumbnail_url": thumbnail_url,
            "description": photo.get("description") or photo.get("alt_description"),
            "photographer": user_info.get("name"),
            "photographer_profile": (user_info.get("links") or {}).get("html"),
            "tags": tags,
            "width": photo.get("width"),
            "height": photo.get("height"),
            "color": photo.get("color"),
        }


_unsplash_fetcher: UnsplashFetcher | None = None


def get_unsplash_fetcher() -> UnsplashFetcher:
    global _unsplash_fetcher
    if _unsplash_fetcher is None:
        _unsplash_fetcher = UnsplashFetcher()
    return _unsplash_fetcher
