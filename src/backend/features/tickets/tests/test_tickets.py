import pytest
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

def test_tc01_create_ticket():
    """TC-01: POST valid ticket - assert 201, id, status OPEN, and userId."""
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = [[{"label": "NEGATIVE", "score": 0.1}]]
        mock_post.return_value = mock_response

        response = client.post(
            "/api/v1/tickets",
            json={"subject": "Valid Subject", "body": "This is a valid ticket body."},
            headers={"X-User-ID": "user_01", "X-User-Role": "customer"}
        )

        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["userId"] == "user_01"
        assert data["status"] == "OPEN"
        assert data["subject"] == "Valid Subject"

def test_tc02_priority_mapping():
    """TC-02: AI Priority mapping logic - scores 0.1, 0.3, 0.6, 0.9."""
    scenarios = [
        (0.1, "CRITICAL"),
        (0.3, "HIGH"),
        (0.6, "MEDIUM"),
        (0.9, "LOW")
    ]

    for score, expected_priority in scenarios:
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = [[{"label": "ANY", "score": score}]]
            mock_post.return_value = mock_response

            response = client.post(
                "/api/v1/tickets",
                json={"subject": f"Priority Test {score}", "body": "Valid body for priority mapping test."},
                headers={"X-User-ID": "user_01"}
            )
            assert response.json()["priority"] == expected_priority

def test_tc03_get_own_tickets():
    """TC-03: Customer views own tickets with correct pagination."""
    # Create 3 tickets for user1
    for i in range(3):
        client.post(
            "/api/v1/tickets",
            json={"subject": f"User1 Ticket {i}", "body": "Body for user1 ticket."},
            headers={"X-User-ID": "user_01"}
        )
    # Create 1 ticket for user2
    client.post(
        "/api/v1/tickets",
        json={"subject": "User2 Ticket", "body": "Body for user2 ticket."},
        headers={"X-User-ID": "user_02"}
    )

    # GET user1 tickets
    response = client.get("/api/v1/tickets", headers={"X-User-ID": "user_01"})
    assert response.status_code == 200
    data = response.json()
    assert len(data["tickets"]) == 3
    assert data["pagination"]["totalTickets"] == 3
    for ticket in data["tickets"]:
        assert ticket["userId"] == "user_01"

def test_tc04_triage_queue_sorting():
    """TC-04: Agent triage queue - CRITICAL first, customer forbidden."""
    # Create tickets with specific priorities
    priorities = [(0.9, "LOW"), (0.1, "CRITICAL"), (0.3, "HIGH")]
    for i, (score, _) in enumerate(priorities):
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = [[{"label": "ANY", "score": score}]]
            mock_post.return_value = mock_response
            
            client.post(
                "/api/v1/tickets",
                json={"subject": f"Triage Subject {i}", "body": "Valid body for triage test."},
                headers={"X-User-ID": "user_01"}
            )

    # Agent access (agent role)
    response = client.get("/api/v1/tickets/triage", headers={"X-User-ID": "agent_01", "X-User-Role": "agent"})
    assert response.status_code == 200
    data = response.json()
    assert data[0]["priority"] == "CRITICAL"
    assert data[1]["priority"] == "HIGH"
    assert data[2]["priority"] == "LOW"

    # Customer access (forbidden)
    response = client.get("/api/v1/tickets/triage", headers={"X-User-ID": "user_01", "X-User-Role": "customer"})
    assert response.status_code == 403

def test_tc05_status_transitions():
    """TC-05: Status state machine transitions and role gating."""
    # Create ticket
    resp = client.post(
        "/api/v1/tickets",
        json={"subject": "Status Transition", "body": "Valid body for status test."},
        headers={"X-User-ID": "user_01"}
    )
    ticket_id = resp.json()["id"]

    # OPEN -> IN_PROGRESS (Agent, valid)
    resp = client.patch(
        f"/api/v1/tickets/{ticket_id}/status",
        json={"status": "IN_PROGRESS"},
        headers={"X-User-ID": "agent_01", "X-User-Role": "agent"}
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "IN_PROGRESS"

    # IN_PROGRESS -> RESOLVED (Agent, valid)
    resp = client.patch(
        f"/api/v1/tickets/{ticket_id}/status",
        json={"status": "RESOLVED"},
        headers={"X-User-ID": "agent_01", "X-User-Role": "agent"}
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "RESOLVED"

    # RESOLVED -> OPEN (Agent, invalid transition)
    resp = client.patch(
        f"/api/v1/tickets/{ticket_id}/status",
        json={"status": "OPEN"},
        headers={"X-User-ID": "agent_01", "X-User-Role": "agent"}
    )
    assert resp.status_code == 422

    # Customer update (forbidden)
    resp = client.patch(
        f"/api/v1/tickets/{ticket_id}/status",
        json={"status": "IN_PROGRESS"},
        headers={"X-User-ID": "user_01", "X-User-Role": "customer"}
    )
    assert resp.status_code == 403
