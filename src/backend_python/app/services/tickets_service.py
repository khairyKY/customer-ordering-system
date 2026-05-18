"""Tickets / support slice — service layer (Member C).

Ported from the previous standalone FastAPI app at ``src/backend/features/tickets/``
into the canonical backend_python core. Behaviour is preserved:

* SHA-256 dedup over ``user_id:subject:body`` with a 600s window.
* Optional sentiment-based priority via HuggingFace, with a 5s timeout and a
  ``MEDIUM`` fallback on any failure.
* Status state machine: ``OPEN → IN_PROGRESS → RESOLVED``.

Storage is intentionally in-memory: the slice was specified that way in Phase 1
and the existing tests assume it. Persistence is a follow-up if/when the slice
needs to survive a process restart.
"""

from __future__ import annotations

import hashlib
import math
import time
import uuid
from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import HTTPException, status

from app.schemas import (
    Ticket,
    TicketCreate,
    TicketListResponse,
    TicketPagination,
    TicketPriority,
    TicketStatus,
)

# ─── Module state ──────────────────────────────────────────────────────────

tickets: list[Ticket] = []
submission_hashes: dict[str, float] = {}

_PRIORITY_ORDER: dict[TicketPriority, int] = {
    TicketPriority.CRITICAL: 0,
    TicketPriority.HIGH: 1,
    TicketPriority.MEDIUM: 2,
    TicketPriority.LOW: 3,
}

_VALID_TRANSITIONS: dict[TicketStatus, list[TicketStatus]] = {
    TicketStatus.OPEN: [TicketStatus.IN_PROGRESS],
    TicketStatus.IN_PROGRESS: [TicketStatus.RESOLVED],
    TicketStatus.RESOLVED: [],
}

DEDUP_WINDOW_SECONDS = 600
HF_TIMEOUT_SECONDS = 5.0
HF_API_URL = (
    "https://api-inference.huggingface.co/models/"
    "distilbert-base-uncased-finetuned-sst-2-english"
)


# ─── Pure helpers ──────────────────────────────────────────────────────────


def submission_hash(user_id: str, subject: str, body: str) -> str:
    """SHA-256 over ``user_id:subject:body`` — stable across runs."""
    return hashlib.sha256(f"{user_id}:{subject}:{body}".encode()).hexdigest()


def score_to_priority(score: float) -> TicketPriority:
    """Map a sentiment score in [0.0, 1.0] to a ticket priority.

    Boundaries (closed-on-the-right): <0.25 CRITICAL, <0.50 HIGH,
    <0.75 MEDIUM, >=0.75 LOW.
    """
    if score < 0.25:
        return TicketPriority.CRITICAL
    if score < 0.50:
        return TicketPriority.HIGH
    if score < 0.75:
        return TicketPriority.MEDIUM
    return TicketPriority.LOW


def _now_iso() -> str:
    return datetime.now(tz=timezone.utc).isoformat().replace("+00:00", "Z")


# ─── HuggingFace adapter ───────────────────────────────────────────────────


async def get_ai_priority(subject: str, body: str) -> tuple[TicketPriority, str]:
    """Call HuggingFace sentiment; fall back to MEDIUM on any failure.

    Returns ``(priority, sentiment_source)`` where ``sentiment_source`` is one
    of ``hf_model``, ``fallback`` (transport/HTTP failure), or
    ``score_invalid`` (malformed JSON).
    """
    try:
        async with httpx.AsyncClient(timeout=HF_TIMEOUT_SECONDS) as client:
            response = await client.post(
                HF_API_URL,
                json={"inputs": f"{subject} {body}"},
            )
            if response.status_code != 200:
                return TicketPriority.MEDIUM, "fallback"

            result: Any = response.json()
            if not result or not isinstance(result, list) or not result[0]:
                return TicketPriority.MEDIUM, "score_invalid"

            sentiment = result[0][0]
            score = sentiment.get("score") if isinstance(sentiment, dict) else None
            if not isinstance(score, (int, float)) or math.isnan(score):
                return TicketPriority.MEDIUM, "score_invalid"

            return score_to_priority(float(score)), "hf_model"

    except httpx.TimeoutException:
        return TicketPriority.MEDIUM, "fallback"
    except Exception:  # noqa: BLE001 — defensive: any adapter failure → fallback
        return TicketPriority.MEDIUM, "score_invalid"


# ─── Service ───────────────────────────────────────────────────────────────


class TicketService:
    """Stateless namespace; in-memory storage lives at module scope above."""

    @staticmethod
    async def create_ticket(data: TicketCreate, user_id: str) -> Ticket:
        # 1. Deduplication
        h = submission_hash(user_id, data.subject, data.body)
        now = time.time()
        existing = submission_hashes.get(h)
        if existing is not None and now - existing < DEDUP_WINDOW_SECONDS:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Duplicate submission detected",
            )
        submission_hashes[h] = now

        # 2. AI priority (with graceful fallback)
        priority, sentiment_source = await get_ai_priority(data.subject, data.body)

        # 3. Persist
        ticket = Ticket(
            id=str(uuid.uuid4()),
            userId=user_id,
            subject=data.subject,
            body=data.body,
            priority=priority,
            status=TicketStatus.OPEN,
            sentiment_source=sentiment_source,
            created_at=_now_iso(),
        )
        tickets.append(ticket)
        return ticket

    @staticmethod
    def get_tickets(user_id: str, page: int = 1, limit: int = 10) -> TicketListResponse:
        owned = [t for t in tickets if t.userId == user_id]
        total = len(owned)
        total_pages = math.ceil(total / limit) if total else 1
        start = (page - 1) * limit
        return TicketListResponse(
            tickets=owned[start : start + limit],
            pagination=TicketPagination(
                totalTickets=total,
                totalPages=total_pages,
                currentPage=page,
                limit=limit,
            ),
        )

    @staticmethod
    def get_triage_queue() -> list[Ticket]:
        return sorted(tickets, key=lambda t: _PRIORITY_ORDER[t.priority])

    @staticmethod
    def update_ticket_status(ticket_id: str, new_status: TicketStatus) -> Ticket:
        ticket = next((t for t in tickets if t.id == ticket_id), None)
        if ticket is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found",
            )
        if new_status not in _VALID_TRANSITIONS.get(ticket.status, []):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid status transition",
            )
        ticket.status = new_status
        ticket.updated_at = _now_iso()
        return ticket

    # Used by tests/fixtures to clear in-memory state between cases.
    @staticmethod
    def reset() -> None:
        tickets.clear()
        submission_hashes.clear()
