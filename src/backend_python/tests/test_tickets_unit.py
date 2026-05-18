"""Unit tests for the tickets service layer (Member C).

Covers pure functions and the service namespace without going through the
HTTP layer. Database is not touched — storage is module-level in-memory and
is reset by the autouse fixture in ``conftest.py``.

Originally adapted from ``src/backend/features/tickets/tests/test_unit.py``
and ``test_service_unit.py``, plus additional coverage for branches that
were not exercised in the legacy suite (HF non-dict payload, dedup window
expiry, exact-score boundaries, pagination edges, status state-machine
illegal transitions).
"""

from __future__ import annotations

import asyncio
import hashlib
import time
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest
from fastapi import HTTPException
from pydantic import ValidationError


def _run(coro):
    """Tiny shim so the unit tests don't depend on pytest-asyncio."""
    return asyncio.run(coro)

from app.schemas import (
    Ticket,
    TicketBase,
    TicketCreate,
    TicketPriority,
    TicketStatus,
    sanitize_html,
)
from app.services import tickets_service
from app.services.tickets_service import (
    TicketService,
    get_ai_priority,
    score_to_priority,
    submission_hash,
)


# ─── sanitize_html ─────────────────────────────────────────────────────────


def test_sanitize_strips_script_tag_and_contents():
    assert sanitize_html("Hello <script>alert('xss')</script> world") == "Hello  world"


def test_sanitize_strips_img_tag():
    assert sanitize_html("Check this <img src=x onerror=alert(1)> out") == "Check this  out"


def test_sanitize_plain_text_unchanged():
    assert sanitize_html("Just a plain string with no tags.") == "Just a plain string with no tags."


def test_sanitize_strips_nested_inline_tags():
    assert sanitize_html("a <b>bold <i>and italic</i></b> c") == "a bold and italic c"


def test_sanitize_strips_uppercase_script():
    assert sanitize_html("hi <SCRIPT>bad()</SCRIPT> there") == "hi  there"


# ─── score_to_priority (pure boundary function) ────────────────────────────


@pytest.mark.parametrize("score,expected", [
    (0.0,   TicketPriority.CRITICAL),
    (0.249, TicketPriority.CRITICAL),
    (0.25,  TicketPriority.HIGH),
    (0.499, TicketPriority.HIGH),
    (0.50,  TicketPriority.MEDIUM),
    (0.749, TicketPriority.MEDIUM),
    (0.75,  TicketPriority.LOW),
    (1.0,   TicketPriority.LOW),
])
def test_score_to_priority_boundaries(score, expected):
    assert score_to_priority(score) is expected


# ─── submission_hash (deterministic + key separation) ──────────────────────


def test_submission_hash_is_deterministic():
    a = submission_hash("user1", "Subject", "Body Content")
    b = submission_hash("user1", "Subject", "Body Content")
    assert a == b
    assert a == hashlib.sha256(b"user1:Subject:Body Content").hexdigest()


def test_submission_hash_differs_by_user():
    a = submission_hash("user1", "S", "B")
    b = submission_hash("user2", "S", "B")
    assert a != b


def test_submission_hash_differs_by_subject():
    a = submission_hash("u", "Subject 1", "B")
    b = submission_hash("u", "Subject 2", "B")
    assert a != b


def test_submission_hash_differs_by_body():
    a = submission_hash("u", "S", "Body 1")
    b = submission_hash("u", "S", "Body 2")
    assert a != b


# ─── get_ai_priority — full branch coverage ────────────────────────────────


def _mock_post(score=None, *, status_code=200, json_value=None):
    resp = MagicMock()
    resp.status_code = status_code
    if json_value is not None:
        resp.json.return_value = json_value
    else:
        resp.json.return_value = [[{"label": "ANY", "score": score}]]
    return patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=resp)


def test_get_ai_priority_critical_branch():
    with _mock_post(0.1):
        priority, source = _run(get_ai_priority("s", "b"))
    assert priority is TicketPriority.CRITICAL
    assert source == "hf_model"


def test_get_ai_priority_high_branch():
    with _mock_post(0.4):
        priority, source = _run(get_ai_priority("s", "b"))
    assert priority is TicketPriority.HIGH
    assert source == "hf_model"


def test_get_ai_priority_medium_branch():
    with _mock_post(0.6):
        priority, _ = _run(get_ai_priority("s", "b"))
    assert priority is TicketPriority.MEDIUM


def test_get_ai_priority_low_branch():
    with _mock_post(0.9):
        priority, _ = _run(get_ai_priority("s", "b"))
    assert priority is TicketPriority.LOW


def test_get_ai_priority_non_200_returns_fallback():
    with _mock_post(status_code=503, json_value=[]):
        priority, source = _run(get_ai_priority("s", "b"))
    assert priority is TicketPriority.MEDIUM
    assert source == "fallback"


def test_get_ai_priority_empty_list_is_score_invalid():
    with _mock_post(json_value=[]):
        priority, source = _run(get_ai_priority("s", "b"))
    assert priority is TicketPriority.MEDIUM
    assert source == "score_invalid"


def test_get_ai_priority_empty_inner_list_is_score_invalid():
    with _mock_post(json_value=[[]]):
        priority, source = _run(get_ai_priority("s", "b"))
    assert priority is TicketPriority.MEDIUM
    assert source == "score_invalid"


def test_get_ai_priority_non_dict_payload_is_score_invalid():
    # New coverage: legacy code crashed here; the ported service falls back cleanly.
    with _mock_post(json_value=[["unexpected_string"]]):
        priority, source = _run(get_ai_priority("s", "b"))
    assert priority is TicketPriority.MEDIUM
    assert source == "score_invalid"


def test_get_ai_priority_missing_score_key_is_score_invalid():
    with _mock_post(json_value=[[{"label": "ANY"}]]):
        priority, source = _run(get_ai_priority("s", "b"))
    assert priority is TicketPriority.MEDIUM
    assert source == "score_invalid"


def test_get_ai_priority_nan_score_is_score_invalid():
    # New coverage: explicit NaN must not silently route to LOW via `< 0.25` failing.
    with _mock_post(score=float("nan")):
        priority, source = _run(get_ai_priority("s", "b"))
    assert priority is TicketPriority.MEDIUM
    assert source == "score_invalid"


def test_get_ai_priority_timeout_is_fallback():
    with patch("httpx.AsyncClient.post", side_effect=httpx.TimeoutException("t")):
        priority, source = _run(get_ai_priority("s", "b"))
    assert priority is TicketPriority.MEDIUM
    assert source == "fallback"


def test_get_ai_priority_transport_error_is_score_invalid():
    # New coverage: non-timeout transport failures land in the generic except branch.
    with patch(
        "httpx.AsyncClient.post",
        side_effect=httpx.ConnectError("refused"),
    ):
        priority, source = _run(get_ai_priority("s", "b"))
    assert priority is TicketPriority.MEDIUM
    assert source == "score_invalid"


# ─── Triage queue ──────────────────────────────────────────────────────────


def _make_ticket(user_id: str, priority: TicketPriority) -> Ticket:
    return Ticket(
        id=str(uuid.uuid4()),
        userId=user_id,
        subject="Subject",
        body="B" * 10,
        priority=priority,
        status=TicketStatus.OPEN,
        sentiment_source="test",
        created_at="2026-05-20T00:00:00Z",
    )


def test_triage_queue_sorts_critical_first():
    tickets_service.tickets.append(_make_ticket("u1", TicketPriority.LOW))
    tickets_service.tickets.append(_make_ticket("u1", TicketPriority.CRITICAL))
    tickets_service.tickets.append(_make_ticket("u1", TicketPriority.HIGH))

    queue = TicketService.get_triage_queue()
    assert [t.priority for t in queue] == [
        TicketPriority.CRITICAL,
        TicketPriority.HIGH,
        TicketPriority.LOW,
    ]


def test_triage_queue_empty_returns_empty_list():
    assert TicketService.get_triage_queue() == []


def test_triage_queue_stable_within_same_priority():
    # New coverage: ties keep insertion order, so the agent sees the earliest-filed first.
    first = _make_ticket("u1", TicketPriority.HIGH)
    second = _make_ticket("u2", TicketPriority.HIGH)
    tickets_service.tickets.extend([first, second])
    queue = TicketService.get_triage_queue()
    assert [t.id for t in queue] == [first.id, second.id]


# ─── Pagination + per-user scoping ─────────────────────────────────────────


def test_get_tickets_first_page_respects_limit():
    for _ in range(3):
        tickets_service.tickets.append(_make_ticket("user_01", TicketPriority.LOW))
    result = TicketService.get_tickets("user_01", page=1, limit=2)
    assert len(result.tickets) == 2
    assert result.pagination.totalTickets == 3
    assert result.pagination.totalPages == 2
    assert result.pagination.currentPage == 1


def test_get_tickets_second_page_returns_remainder():
    for _ in range(3):
        tickets_service.tickets.append(_make_ticket("user_01", TicketPriority.LOW))
    result = TicketService.get_tickets("user_01", page=2, limit=2)
    assert len(result.tickets) == 1


def test_get_tickets_page_past_end_is_empty():
    # New coverage: paginating past the end should return empty tickets but valid totals.
    for _ in range(2):
        tickets_service.tickets.append(_make_ticket("user_01", TicketPriority.LOW))
    result = TicketService.get_tickets("user_01", page=5, limit=2)
    assert result.tickets == []
    assert result.pagination.totalTickets == 2


def test_get_tickets_is_scoped_to_user():
    tickets_service.tickets.append(_make_ticket("user_01", TicketPriority.LOW))
    tickets_service.tickets.append(_make_ticket("user_01", TicketPriority.LOW))
    tickets_service.tickets.append(_make_ticket("user_02", TicketPriority.LOW))
    result = TicketService.get_tickets("user_01")
    assert result.pagination.totalTickets == 2
    assert all(t.userId == "user_01" for t in result.tickets)


def test_get_tickets_empty_for_unknown_user():
    result = TicketService.get_tickets("nobody")
    assert result.tickets == []
    assert result.pagination.totalTickets == 0
    assert result.pagination.totalPages == 1


# ─── Status state machine ──────────────────────────────────────────────────


def test_status_open_to_in_progress_is_legal():
    t = _make_ticket("u1", TicketPriority.LOW)
    tickets_service.tickets.append(t)
    updated = TicketService.update_ticket_status(t.id, TicketStatus.IN_PROGRESS)
    assert updated.status is TicketStatus.IN_PROGRESS
    assert updated.updated_at is not None


def test_status_in_progress_to_resolved_is_legal():
    t = _make_ticket("u1", TicketPriority.LOW)
    t.status = TicketStatus.IN_PROGRESS
    tickets_service.tickets.append(t)
    assert TicketService.update_ticket_status(t.id, TicketStatus.RESOLVED).status is TicketStatus.RESOLVED


def test_status_resolved_to_open_is_illegal():
    t = _make_ticket("u1", TicketPriority.LOW)
    t.status = TicketStatus.RESOLVED
    tickets_service.tickets.append(t)
    with pytest.raises(HTTPException) as exc:
        TicketService.update_ticket_status(t.id, TicketStatus.OPEN)
    assert exc.value.status_code == 422


def test_status_open_to_resolved_is_illegal():
    t = _make_ticket("u1", TicketPriority.LOW)
    tickets_service.tickets.append(t)
    with pytest.raises(HTTPException) as exc:
        TicketService.update_ticket_status(t.id, TicketStatus.RESOLVED)
    assert exc.value.status_code == 422


def test_status_unknown_ticket_is_404():
    # New coverage: state-machine vs. lookup-miss must produce distinct status codes.
    with pytest.raises(HTTPException) as exc:
        TicketService.update_ticket_status("does-not-exist", TicketStatus.IN_PROGRESS)
    assert exc.value.status_code == 404


# ─── Pydantic model validation ─────────────────────────────────────────────


def test_ticket_model_rejects_overlong_subject():
    with pytest.raises(ValidationError):
        TicketBase(subject="A" * 121, body="Valid body length.")


def test_ticket_model_rejects_short_body():
    with pytest.raises(ValidationError):
        TicketBase(subject="Valid Subject", body="Short")


def test_ticket_model_strips_script_via_validator():
    # New coverage: validator should drop dangerous tags *before* length checks fail.
    t = TicketBase(
        subject="Hi <script>x</script> there",
        body="A body that is long enough to pass.",
    )
    assert "<script>" not in t.subject
    assert t.subject == "Hi  there"


# ─── Dedup window behaviour ────────────────────────────────────────────────


def test_create_ticket_rejects_immediate_duplicate():
    data = TicketCreate(subject="Dup subject", body="A body long enough to validate.")
    with _mock_post(0.5):
        first = _run(TicketService.create_ticket(data, "user_01"))
        with pytest.raises(HTTPException) as exc:
            _run(TicketService.create_ticket(data, "user_01"))
    assert first.status is TicketStatus.OPEN
    assert exc.value.status_code == 409


def test_create_ticket_allows_resubmission_after_window_expires():
    # New coverage: the legacy suite never proved the dedup window actually closes.
    data = TicketCreate(subject="Dup subject 2", body="A body long enough to validate.")
    with _mock_post(0.5):
        first = _run(TicketService.create_ticket(data, "user_01"))

        # Backdate the stored hash beyond the dedup window.
        h = submission_hash("user_01", data.subject, data.body)
        tickets_service.submission_hashes[h] = (
            time.time() - tickets_service.DEDUP_WINDOW_SECONDS - 1
        )

        second = _run(TicketService.create_ticket(data, "user_01"))
    assert first.id != second.id


def test_create_ticket_persists_in_module_state():
    data = TicketCreate(subject="Persist me", body="Body long enough for the validator.")
    with _mock_post(0.5):
        created = _run(TicketService.create_ticket(data, "user_42"))
    assert created in tickets_service.tickets
    assert tickets_service.tickets[-1].userId == "user_42"
