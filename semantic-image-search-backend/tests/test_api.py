from __future__ import annotations

from fastapi import status


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"status": "ok"}


def test_generate_text_embedding(client):
    payload = {"text": "a scenic mountain"}
    response = client.post("/embeddings/text", json=payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "embedding" in data
    assert len(data["embedding"]) == 3


def test_search_ingests_and_returns_results(client):
    payload = {"query": "forest", "ingest": True, "top_k": 5}
    response = client.post("/search", json=payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["query"] == "forest"
    assert data["count"] == len(data["results"]) == 1
    assert data["ingested"][0]["query"] == "forest"


def test_categories(client):
    response = client.get("/categories")
    assert response.status_code == status.HTTP_200_OK
    categories = response.json()["categories"]
    assert categories[0]["title"] == "Nature"


def test_stats(client):
    response = client.get("/stats")
    assert response.status_code == status.HTTP_200_OK
    stats = response.json()
    assert stats["total_vectors"] == 42


def test_search_engine_error_returns_400(client, fakes):
    fakes["engine"].raise_error = ValueError("invalid query")
    try:
        payload = {"query": "trigger error", "top_k": 3}
        response = client.post("/search", json=payload)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        body = response.json()
        assert "invalid query" in body["detail"]
    finally:
        fakes["engine"].raise_error = None


def test_search_ingest_failure_returns_502(client, fakes):
    fakes["fetcher"].raise_search_error = ValueError("unsplash down")
    try:
        payload = {"query": "ocean", "ingest": True}
        response = client.post("/search", json=payload)
        assert response.status_code == status.HTTP_502_BAD_GATEWAY
        assert "unsplash down" in response.json()["detail"]
    finally:
        fakes["fetcher"].raise_search_error = None


def test_categories_failure_returns_502(client, fakes):
    fakes["fetcher"].raise_topic_error = ValueError("topic fail")
    try:
        response = client.get("/categories")
        assert response.status_code == status.HTTP_502_BAD_GATEWAY
        assert "topic fail" in response.json()["detail"]
    finally:
        fakes["fetcher"].raise_topic_error = None
