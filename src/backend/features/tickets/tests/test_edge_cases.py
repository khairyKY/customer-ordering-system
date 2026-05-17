import pytest
import httpx
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock, MagicMock
from ..main import app
from ..service import tickets, submission_hashes

client = TestClient(app)

@pytest.fixture(autouse=True)
def clear_storage():
    """Autouse fixture to clear in-memory storage before each test."""
    tickets.clear()
    submission_hashes.clear()

def test_ec1_xss_sanitization():
    """EC-1: XSS sanitization - script tag in subject should be stripped."""
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = [[{"label": "ANY", "score": 0.5}]]
        mock_post.return_value = mock_response

        # Subject with script tag, body long enough to pass validation
        response = client.post(
            "/api/v1/tickets",
            json={
                "subject": "Help <script>alert('xss')</script> me",
                "body": "This is a long enough body for validation."
            },
            headers={"X-User-ID": "user_01"}
        )

        assert response.status_code == 201
        data = response.json()
        assert "<script>" not in data["subject"]
        assert "alert" not in data["subject"]
        assert data["subject"] == "Help  me"

def test_ec2_duplicate_submission():
    """EC-2: Deduplication - same payload twice should return 409 on second try."""
    payload = {"subject": "Duplicate Ticket", "body": "This is a unique body for testing dedup."}
    
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = [[{"label": "ANY", "score": 0.5}]]
        mock_post.return_value = mock_response

        # First submission
        resp1 = client.post("/api/v1/tickets", json=payload, headers={"X-User-ID": "user_01"})
        assert resp1.status_code == 201

        # Second submission (Immediate)
        resp2 = client.post("/api/v1/tickets", json=payload, headers={"X-User-ID": "user_01"})
        assert resp2.status_code == 409

def test_ec3_huggingface_timeout():
    """EC-3: Resilience - HuggingFace timeout should fallback to MEDIUM priority."""
    with patch("httpx.AsyncClient.post", side_effect=httpx.TimeoutException("Timeout")):
        response = client.post(
            "/api/v1/tickets",
            json={"subject": "Timeout Test", "body": "Testing system behavior on AI timeout."},
            headers={"X-User-ID": "user_01"}
        )

        assert response.status_code == 201
        data = response.json()
        assert data["priority"] == "MEDIUM"
        assert data["sentiment_source"] == "fallback"

def test_ec4_extreme_payload():
    """EC-4: Validation - extreme payload sizes should return 422."""
    # Subject too long (121 chars)
    response = client.post(
        "/api/v1/tickets",
        json={"subject": "A" * 121, "body": "Valid body length."},
        headers={"X-User-ID": "user_01"}
    )
    assert response.status_code == 422

    # Body too short (9 chars)
    response = client.post(
        "/api/v1/tickets",
        json={"subject": "Valid Subject", "body": "Too short"},
        headers={"X-User-ID": "user_01"}
    )
    assert response.status_code == 422

def test_ec5_nan_null_score():
    """EC-5: Resilience - NaN or null score from AI should map to MEDIUM priority."""
    # Null score
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = [[{"label": "ANY", "score": None}]]
        mock_post.return_value = mock_response

        response = client.post(
            "/api/v1/tickets",
            json={"subject": "Null Score Test", "body": "Testing null score behavior."},
            headers={"X-User-ID": "user_01"}
        )
        assert response.status_code == 201
        assert response.json()["priority"] == "MEDIUM"
        assert response.json()["sentiment_source"] == "score_invalid"

    # Missing score field
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = [[{"label": "ANY"}]]
        mock_post.return_value = mock_response

        response = client.post(
            "/api/v1/tickets",
            json={"subject": "Missing Score Test", "body": "Testing missing score behavior."},
            headers={"X-User-ID": "user_01"}
        )
        assert response.status_code == 201
        assert response.json()["priority"] == "MEDIUM"
        assert response.json()["sentiment_source"] == "score_invalid"
