import hashlib
import time
import uuid
import httpx
import math
from datetime import datetime
from typing import List, Dict, Optional
from fastapi import HTTPException
from .models import Ticket, TicketCreate, TicketPriority, TicketStatus, TicketListResponse, PaginationInfo

# In-memory storage
tickets: List[Ticket] = []
submission_hashes: Dict[str, float] = {}  # hash -> timestamp

PRIORITY_ORDER = {
    TicketPriority.CRITICAL: 0,
    TicketPriority.HIGH: 1,
    TicketPriority.MEDIUM: 2,
    TicketPriority.LOW: 3
}

HF_API_URL = "https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english"

async def get_ai_priority(subject: str, body: str):
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                HF_API_URL,
                json={"inputs": f"{subject} {body}"}
            )
            if response.status_code != 200:
                return TicketPriority.MEDIUM, "fallback"
            
            result = response.json()
            # Result is usually a list of lists: [[{"label": "...", "score": ...}, ...]]
            if not result or not isinstance(result, list) or not result[0]:
                return TicketPriority.MEDIUM, "score_invalid"
            
            # The model usually returns multiple labels, we take the top one
            sentiment = result[0][0]
            score = sentiment.get("score")
            
            if score is None or not isinstance(score, (int, float)):
                return TicketPriority.MEDIUM, "score_invalid"
            
            # Priority mapping: score < 0.25 → CRITICAL, < 0.50 → HIGH, < 0.75 → MEDIUM, >= 0.75 → LOW
            if score < 0.25:
                return TicketPriority.CRITICAL, "hf_model"
            elif score < 0.50:
                return TicketPriority.HIGH, "hf_model"
            elif score < 0.75:
                return TicketPriority.MEDIUM, "hf_model"
            else:
                return TicketPriority.LOW, "hf_model"
                
    except httpx.TimeoutException:
        return TicketPriority.MEDIUM, "fallback"
    except Exception:
        return TicketPriority.MEDIUM, "score_invalid"

class TicketService:
    @staticmethod
    async def create_ticket(data: TicketCreate, user_id: str) -> Ticket:
        # 1. Deduplication Check
        hash_input = f"{user_id}:{data.subject}:{data.body}".encode()
        h = hashlib.sha256(hash_input).hexdigest()
        
        now = time.time()
        if h in submission_hashes:
            if now - submission_hashes[h] < 600:
                raise HTTPException(status_code=409, detail="Duplicate submission detected")
        
        submission_hashes[h] = now
        
        # 2. AI Priority
        priority, sentiment_source = await get_ai_priority(data.subject, data.body)
        
        # 3. Save
        new_ticket = Ticket(
            id=str(uuid.uuid4()),
            userId=user_id,
            subject=data.subject,
            body=data.body,
            priority=priority,
            status=TicketStatus.OPEN,
            sentiment_source=sentiment_source,
            created_at=datetime.now().isoformat() + "Z"
        )
        
        tickets.append(new_ticket)
        return new_ticket

    @staticmethod
    def get_tickets(user_id: str, page: int = 1, limit: int = 10) -> TicketListResponse:
        user_tickets = [t for t in tickets if t.userId == user_id]
        total_tickets = len(user_tickets)
        total_pages = math.ceil(total_tickets / limit) if total_tickets > 0 else 1
        
        start = (page - 1) * limit
        end = start + limit
        paginated_tickets = user_tickets[start:end]
        
        return TicketListResponse(
            tickets=paginated_tickets,
            pagination=PaginationInfo(
                totalTickets=total_tickets,
                totalPages=total_pages,
                currentPage=page,
                limit=limit
            )
        )

    @staticmethod
    def get_triage_queue() -> List[Ticket]:
        # Sort by priority (CRITICAL -> HIGH -> MEDIUM -> LOW)
        return sorted(tickets, key=lambda t: PRIORITY_ORDER[t.priority])

    @staticmethod
    def update_ticket_status(ticket_id: str, new_status: TicketStatus) -> Ticket:
        ticket = next((t for t in tickets if t.id == ticket_id), None)
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        # State machine: OPEN -> IN_PROGRESS -> RESOLVED
        valid_transitions = {
            TicketStatus.OPEN: [TicketStatus.IN_PROGRESS],
            TicketStatus.IN_PROGRESS: [TicketStatus.RESOLVED],
            TicketStatus.RESOLVED: []
        }
        
        if new_status not in valid_transitions.get(ticket.status, []):
            raise HTTPException(status_code=422, detail="Invalid status transition")
        
        ticket.status = new_status
        ticket.updated_at = datetime.now().isoformat() + "Z"
        return ticket
