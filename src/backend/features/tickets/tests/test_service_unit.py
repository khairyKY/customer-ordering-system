"""Additional unit tests for the tickets service layer.

Complements test_unit.py with boundary coverage for get_ai_priority and
direct unit coverage of the triage-sort and pagination logic.
"""

import uuid
from unittest.mock import MagicMock, patch

import httpx
import pytest

from ..models import Ticket, TicketPriority, TicketStatus
from ..service import TicketService, get_ai_priority, submission_hashes, tickets


@pytest.fixture(autouse=True)
def clear_storage():
    """Reset in-memory storage before each test."""
    tickets.clear()
    submission_hashes.clear()


def _make_ticket(user_id: str, priority: TicketPriority) -> Ticket:
    return Ticket(
        id=str(uuid.uuid4()), userId=user_id, subject="S", body="B" * 10,
        priority=priority, status=TicketStatus.OPEN,
        sentiment_source="test", created_at="now",
    )


def _mock_score(score):
    resp = MagicMock()
    resp.status_code = 200
    resp.json.return_value = [[{"label": "ANY", "score": score}]]
    return resp


# ─── get_ai_priority — score boundaries ─────────────────────────────────────

@pytest.mark.asyncio
async def test_ai_priority_boundary_025_is_high():
    with patch("httpx.AsyncClient.post") as mock_post:
        mock_post.return_value = _mock_score(0.25)
        priority, source = await get_ai_priority("s", "b")
    assert priority == TicketPriority.HIGH
    assert source == "hf_model"


@pytest.mark.asyncio
async def test_ai_priority_boundary_050_is_medium():
    with patch("httpx.AsyncClient.post") as mock_post:
        mock_post.return_value = _mock_score(0.50)
        priority, _ = await get_ai_priority("s", "b")
    assert priority == TicketPriority.MEDIUM


@pytest.mark.asyncio
async def test_ai_priority_boundary_075_is_low():
    with patch("httpx.AsyncClient.post") as mock_post:
        mock_post.return_value = _mock_score(0.75)
        priority, _ = await get_ai_priority("s", "b")
    assert priority == TicketPriority.LOW


@pytest.mark.asyncio
async def test_ai_priority_non_200_falls_back_to_medium():
    bad = MagicMock()
    bad.status_code = 503
    with patch("httpx.AsyncClient.post") as mock_post:
        mock_post.return_value = bad
        priority, source = await get_ai_priority("s", "b")
    assert priority == TicketPriority.MEDIUM
    assert source == "fallback"


@pytest.mark.asyncio
async def test_ai_priority_empty_result_is_score_invalid():
    empty = MagicMock()
    empty.status_code = 200
    empty.json.return_value = []
    with patch("httpx.AsyncClient.post") as mock_post:
        mock_post.return_value = empty
        priority, source = await get_ai_priority("s", "b")
    assert priority == TicketPriority.MEDIUM
    assert source == "score_invalid"


@pytest.mark.asyncio
async def test_ai_priority_timeout_falls_back_to_medium():
    with patch("httpx.AsyncClient.post", side_effect=httpx.TimeoutException("t")):
        priority, source = await get_ai_priority("s", "b")
    assert priority == TicketPriority.MEDIUM
    assert source == "fallback"


# ─── triage queue sorting ───────────────────────────────────────────────────

def test_triage_queue_sorts_critical_first():
    tickets.append(_make_ticket("u1", TicketPriority.LOW))
    tickets.append(_make_ticket("u1", TicketPriority.CRITICAL))
    tickets.append(_make_ticket("u1", TicketPriority.HIGH))

    queue = TicketService.get_triage_queue()
    assert [t.priority for t in queue] == [
        TicketPriority.CRITICAL, TicketPriority.HIGH, TicketPriority.LOW,
    ]


def test_triage_queue_empty_returns_empty_list():
    assert TicketService.get_triage_queue() == []


# ─── get_tickets — pagination + scoping ─────────────────────────────────────

def test_get_tickets_first_page_respects_limit():
    for _ in range(3):
        tickets.append(_make_ticket("user_01", TicketPriority.LOW))

    result = TicketService.get_tickets("user_01", page=1, limit=2)
    assert len(result.tickets) == 2
    assert result.pagination.totalTickets == 3
    assert result.pagination.totalPages == 2
    assert result.pagination.currentPage == 1


def test_get_tickets_second_page_returns_remainder():
    for _ in range(3):
        tickets.append(_make_ticket("user_01", TicketPriority.LOW))

    result = TicketService.get_tickets("user_01", page=2, limit=2)
    assert len(result.tickets) == 1


def test_get_tickets_is_scoped_to_user():
    tickets.append(_make_ticket("user_01", TicketPriority.LOW))
    tickets.append(_make_ticket("user_01", TicketPriority.LOW))
    tickets.append(_make_ticket("user_02", TicketPriority.LOW))

    result = TicketService.get_tickets("user_01")
    assert result.pagination.totalTickets == 2
    assert all(t.userId == "user_01" for t in result.tickets)


def test_get_tickets_empty_for_unknown_user():
    result = TicketService.get_tickets("nobody")
    assert result.tickets == []
    assert result.pagination.totalTickets == 0
    assert result.pagination.totalPages == 1
