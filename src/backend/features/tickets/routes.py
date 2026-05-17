from fastapi import APIRouter, Depends, Query, Header, HTTPException, status
from typing import List, Optional
from .models import Ticket, TicketCreate, TicketUpdateStatus, TicketListResponse, TicketStatus
from .service import TicketService

router = APIRouter(prefix="/api/v1/tickets", tags=["tickets"])

# Mock Auth Dependency
def get_current_user(x_user_id: str = Header(..., alias="X-User-ID"), x_user_role: str = Header("customer", alias="X-User-Role")):
    return {"id": x_user_id, "role": x_user_role}

@router.post("", response_model=Ticket, status_code=status.HTTP_201_CREATED)
async def create_ticket(data: TicketCreate, user=Depends(get_current_user)):
    return await TicketService.create_ticket(data, user["id"])

@router.get("", response_model=TicketListResponse)
def get_tickets(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    user=Depends(get_current_user)
):
    return TicketService.get_tickets(user["id"], page, limit)

@router.get("/triage", response_model=List[Ticket])
def get_triage_queue(user=Depends(get_current_user)):
    if user["role"] not in ["agent", "admin"]:
        raise HTTPException(status_code=403, detail="Forbidden: Agent role required")
    return TicketService.get_triage_queue()

@router.patch("/{ticket_id}/status", response_model=Ticket)
def update_ticket_status(ticket_id: str, data: TicketUpdateStatus, user=Depends(get_current_user)):
    if user["role"] not in ["agent", "admin"]:
        raise HTTPException(status_code=403, detail="Forbidden: Agent role required")
    return TicketService.update_ticket_status(ticket_id, data.status)
