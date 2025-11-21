from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=Path(__file__).resolve().parent.parent.parent / ".env", env_file_encoding="utf-8")

    app_name: str = "Semantic Image Search Backend"
    clip_model_name: str = "openai/clip-vit-base-patch32"
    device: str = "cpu"
    embedding_dim: int = 512
    pinecone_namespace: str = "default"
    pinecone_top_k: int = 8
    unsplash_api_base_url: str = "https://api.unsplash.com"
    unsplash_results_per_page: int = 10

    unsplash_access_key: str | None = None
    unsplash_secret_key: str | None = None
    pinecone_api_key: str | None = None
    pinecone_environment: str | None = None
    pinecone_index_name: str | None = None


@lru_cache
def get_settings() -> Settings:
    return Settings()
