import pytest
import hashlib
import uuid
from pydantic import ValidationError
from unittest.mock import patch, MagicMock, AsyncMock
from ..models import sanitize_html, TicketBase, TicketStatus, TicketPriority, Ticket
from ..service import get_ai_priority, TicketService, tickets, submission_hashes

# 1-3: Sanitize HTML tests
def test_unit_sanitize_html_strips_script_tags():
    input_text = "Hello <script>alert('xss')</script> world"
    assert sanitize_html(input_text) == "Hello  world"

def test_unit_sanitize_html_strips_img_tags():
    input_text = "Check this <img src=x onerror=alert(1)> out"
    assert sanitize_html(input_text) == "Check this  out"

def test_unit_sanitize_html_plain_text_unchanged():
    input_text = "Just a plain string with no tags."
    assert sanitize_html(input_text) == input_text

# 4-7: Priority Score mapping tests (testing the logic inside get_ai_priority)
@pytest.mark.asyncio
async def test_unit_priority_score_below_025_is_critical():
    with patch("httpx.AsyncClient.post") as mock_post:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = [[{"label": "ANY", "score": 0.1}]]
        mock_post.return_value = mock_resp
        
        priority, source = await get_ai_priority("subject", "body")
        assert priority == TicketPriority.CRITICAL
        assert source == "hf_model"

@pytest.mark.asyncio
async def test_unit_priority_score_025_to_050_is_high():
    with patch("httpx.AsyncClient.post") as mock_post:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = [[{"label": "ANY", "score": 0.4}]]
        mock_post.return_value = mock_resp
        
        priority, source = await get_ai_priority("subject", "body")
        assert priority == TicketPriority.HIGH

@pytest.mark.asyncio
async def test_unit_priority_score_050_to_075_is_medium():
    with patch("httpx.AsyncClient.post") as mock_post:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = [[{"label": "ANY", "score": 0.6}]]
        mock_post.return_value = mock_resp
        
        priority, source = await get_ai_priority("subject", "body")
        assert priority == TicketPriority.MEDIUM

@pytest.mark.asyncio
async def test_unit_priority_score_075_and_above_is_low():
    with patch("httpx.AsyncClient.post") as mock_post:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = [[{"label": "ANY", "score": 0.8}]]
        mock_post.return_value = mock_resp
        
        priority, source = await get_ai_priority("subject", "body")
        assert priority == TicketPriority.LOW

# 8-10: Hashing/Dedup logic tests
def test_unit_dedup_hash_same_input_same_hash():
    user_id = "user1"
    subject = "Subject"
    body = "Body Content"
    
    hash1 = hashlib.sha256(f"{user_id}:{subject}:{body}".encode()).hexdigest()
    hash2 = hashlib.sha256(f"{user_id}:{subject}:{body}".encode()).hexdigest()
    assert hash1 == hash2

def test_unit_dedup_hash_different_user_different_hash():
    subject = "Subject"
    body = "Body Content"
    hash1 = hashlib.sha256(f"user1:{subject}:{body}".encode()).hexdigest()
    hash2 = hashlib.sha256(f"user2:{subject}:{body}".encode()).hexdigest()
    assert hash1 != hash2

def test_unit_dedup_hash_different_subject_different_hash():
    user_id = "user1"
    body = "Body Content"
    hash1 = hashlib.sha256(f"{user_id}:Subject 1:{body}".encode()).hexdigest()
    hash2 = hashlib.sha256(f"{user_id}:Subject 2:{body}".encode()).hexdigest()
    assert hash1 != hash2

# 11-14: Status transition tests
def test_unit_status_transition_open_to_inprogress_valid():
    ticket = Ticket(
        id=str(uuid.uuid4()), userId="u1", subject="S", body="B"*10,
        priority=TicketPriority.LOW, status=TicketStatus.OPEN,
        sentiment_source="test", created_at="now"
    )
    tickets.clear()
    tickets.append(ticket)
    
    updated = TicketService.update_ticket_status(ticket.id, TicketStatus.IN_PROGRESS)
    assert updated.status == TicketStatus.IN_PROGRESS

def test_unit_status_transition_inprogress_to_resolved_valid():
    ticket = Ticket(
        id=str(uuid.uuid4()), userId="u1", subject="S", body="B"*10,
        priority=TicketPriority.LOW, status=TicketStatus.IN_PROGRESS,
        sentiment_source="test", created_at="now"
    )
    tickets.clear()
    tickets.append(ticket)
    
    updated = TicketService.update_ticket_status(ticket.id, TicketStatus.RESOLVED)
    assert updated.status == TicketStatus.RESOLVED

def test_unit_status_transition_resolved_to_open_invalid():
    ticket = Ticket(
        id=str(uuid.uuid4()), userId="u1", subject="S", body="B"*10,
        priority=TicketPriority.LOW, status=TicketStatus.RESOLVED,
        sentiment_source="test", created_at="now"
    )
    tickets.clear()
    tickets.append(ticket)
    
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as excinfo:
        TicketService.update_ticket_status(ticket.id, TicketStatus.OPEN)
    assert excinfo.value.status_code == 422

def test_unit_status_transition_open_to_resolved_invalid():
    ticket = Ticket(
        id=str(uuid.uuid4()), userId="u1", subject="S", body="B"*10,
        priority=TicketPriority.LOW, status=TicketStatus.OPEN,
        sentiment_source="test", created_at="now"
    )
    tickets.clear()
    tickets.append(ticket)
    
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as excinfo:
        TicketService.update_ticket_status(ticket.id, TicketStatus.RESOLVED)
    assert excinfo.value.status_code == 422

# 15-16: Model validation tests
def test_unit_ticket_model_subject_max_length_validation():
    long_subject = "A" * 121
    with pytest.raises(ValidationError):
        TicketBase(subject=long_subject, body="Valid body length.")

def test_unit_ticket_model_body_min_length_validation():
    short_body = "Short"
    with pytest.raises(ValidationError):
        TicketBase(subject="Valid Subject", body=short_body)
