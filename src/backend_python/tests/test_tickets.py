"""Integration tests for the tickets slice (Member C).

Ported from the legacy ``src/backend/features/tickets/tests/test_tickets.py``
and ``test_edge_cases.py`` onto the canonical backend_python TestClient with
real JWT auth (no header-injected mock user).
"""

from unittest.mock import AsyncMock, MagicMock, patch

import httpx

# ─── Helpers ───────────────────────────────────────────────────────────────


def _patch_hf_score(score):
    """Patch ``httpx.AsyncClient.post`` to return a sentiment payload."""
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = [[{"label": "ANY", "score": score}]]
    return patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_resp)


# ─── TC-01..TC-05 (originally in test_tickets.py) ──────────────────────────


def test_tc01_create_ticket(client, customer_headers, jwt_user_id):
    user_id = jwt_user_id(customer_headers)
    with _patch_hf_score(0.1):
        r = client.post(
            "/api/v1/tickets",
            json={"subject": "Valid Subject", "body": "This is a valid ticket body."},
            headers=customer_headers,
        )
    assert r.status_code == 201, r.text
    body = r.json()
    assert "id" in body
    assert body["userId"] == user_id
    assert body["status"] == "OPEN"
    assert body["subject"] == "Valid Subject"


def test_tc02_priority_mapping(client, customer_headers):
    cases = [(0.1, "CRITICAL"), (0.3, "HIGH"), (0.6, "MEDIUM"), (0.9, "LOW")]
    for score, expected in cases:
        with _patch_hf_score(score):
            r = client.post(
                "/api/v1/tickets",
                json={
                    "subject": f"Priority Test {score}",
                    "body": "Valid body for priority mapping test.",
                },
                headers=customer_headers,
            )
        assert r.json()["priority"] == expected


def test_tc03_get_own_tickets(client, customer_headers, customer2_headers, jwt_user_id):
    user_id = jwt_user_id(customer_headers)
    with _patch_hf_score(0.5):
        for i in range(3):
            client.post(
                "/api/v1/tickets",
                json={
                    "subject": f"User1 Ticket {i}",
                    "body": "Body for user1 ticket.",
                },
                headers=customer_headers,
            )
        client.post(
            "/api/v1/tickets",
            json={"subject": "User2 Ticket", "body": "Body for user2 ticket."},
            headers=customer2_headers,
        )

    r = client.get("/api/v1/tickets", headers=customer_headers)
    assert r.status_code == 200
    body = r.json()
    assert len(body["tickets"]) == 3
    assert body["pagination"]["totalTickets"] == 3
    assert all(t["userId"] == user_id for t in body["tickets"])


def test_tc04_triage_queue_sorting(client, customer_headers, agent_headers):
    for score in (0.9, 0.1, 0.3):  # LOW, CRITICAL, HIGH
        with _patch_hf_score(score):
            client.post(
                "/api/v1/tickets",
                json={
                    "subject": f"Triage {score}",
                    "body": "Valid body for triage test.",
                },
                headers=customer_headers,
            )

    r_agent = client.get("/api/v1/tickets/triage", headers=agent_headers)
    assert r_agent.status_code == 200
    priorities = [t["priority"] for t in r_agent.json()]
    assert priorities == ["CRITICAL", "HIGH", "LOW"]

    r_cust = client.get("/api/v1/tickets/triage", headers=customer_headers)
    assert r_cust.status_code == 403


def test_tc05_status_transitions(client, customer_headers, agent_headers):
    with _patch_hf_score(0.5):
        created = client.post(
            "/api/v1/tickets",
            json={"subject": "Status Transition", "body": "Valid body for status test."},
            headers=customer_headers,
        ).json()
    ticket_id = created["id"]

    r = client.patch(
        f"/api/v1/tickets/{ticket_id}/status",
        json={"status": "IN_PROGRESS"},
        headers=agent_headers,
    )
    assert r.status_code == 200
    assert r.json()["status"] == "IN_PROGRESS"

    r = client.patch(
        f"/api/v1/tickets/{ticket_id}/status",
        json={"status": "RESOLVED"},
        headers=agent_headers,
    )
    assert r.status_code == 200
    assert r.json()["status"] == "RESOLVED"

    # RESOLVED → OPEN is illegal under the state machine
    r = client.patch(
        f"/api/v1/tickets/{ticket_id}/status",
        json={"status": "OPEN"},
        headers=agent_headers,
    )
    assert r.status_code == 422

    # Customers cannot change status
    r = client.patch(
        f"/api/v1/tickets/{ticket_id}/status",
        json={"status": "IN_PROGRESS"},
        headers=customer_headers,
    )
    assert r.status_code == 403


# ─── EC-1..EC-5 (originally in test_edge_cases.py) ─────────────────────────


def test_ec1_xss_sanitization(client, customer_headers):
    with _patch_hf_score(0.5):
        r = client.post(
            "/api/v1/tickets",
            json={
                "subject": "Help <script>alert('xss')</script> me",
                "body": "This is a long enough body for validation.",
            },
            headers=customer_headers,
        )
    assert r.status_code == 201
    subj = r.json()["subject"]
    assert "<script>" not in subj
    assert "alert" not in subj
    assert subj == "Help  me"


def test_ec2_duplicate_submission(client, customer_headers):
    payload = {"subject": "Duplicate Ticket", "body": "Unique body for dedup test."}
    with _patch_hf_score(0.5):
        r1 = client.post("/api/v1/tickets", json=payload, headers=customer_headers)
        r2 = client.post("/api/v1/tickets", json=payload, headers=customer_headers)
    assert r1.status_code == 201
    assert r2.status_code == 409


def test_ec3_huggingface_timeout(client, customer_headers):
    with patch(
        "httpx.AsyncClient.post",
        side_effect=httpx.TimeoutException("Timeout"),
    ):
        r = client.post(
            "/api/v1/tickets",
            json={
                "subject": "Timeout Test",
                "body": "Testing system behavior on AI timeout.",
            },
            headers=customer_headers,
        )
    assert r.status_code == 201
    body = r.json()
    assert body["priority"] == "MEDIUM"
    assert body["sentiment_source"] == "fallback"


def test_ec4_extreme_payload(client, customer_headers):
    r = client.post(
        "/api/v1/tickets",
        json={"subject": "A" * 121, "body": "Valid body length."},
        headers=customer_headers,
    )
    assert r.status_code == 422

    r = client.post(
        "/api/v1/tickets",
        json={"subject": "Valid Subject", "body": "Too short"},
        headers=customer_headers,
    )
    assert r.status_code == 422


def test_ec5_null_and_missing_score(client, customer_headers):
    # Null score
    mock_null = MagicMock()
    mock_null.status_code = 200
    mock_null.json.return_value = [[{"label": "ANY", "score": None}]]
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_null):
        r = client.post(
            "/api/v1/tickets",
            json={"subject": "Null Score Test", "body": "Testing null score behavior."},
            headers=customer_headers,
        )
    assert r.status_code == 201
    assert r.json()["priority"] == "MEDIUM"
    assert r.json()["sentiment_source"] == "score_invalid"

    # Missing score key
    mock_missing = MagicMock()
    mock_missing.status_code = 200
    mock_missing.json.return_value = [[{"label": "ANY"}]]
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_missing):
        r = client.post(
            "/api/v1/tickets",
            json={"subject": "Missing Score Test", "body": "Testing missing score behavior."},
            headers=customer_headers,
        )
    assert r.status_code == 201
    assert r.json()["priority"] == "MEDIUM"
    assert r.json()["sentiment_source"] == "score_invalid"


# ─── Auth: anonymous access is rejected ────────────────────────────────────


def test_anonymous_cannot_create_ticket(client):
    r = client.post(
        "/api/v1/tickets",
        json={"subject": "Anon", "body": "Anonymous request should be rejected."},
    )
    assert r.status_code == 401


def test_anonymous_cannot_list_tickets(client):
    r = client.get("/api/v1/tickets")
    assert r.status_code == 401
