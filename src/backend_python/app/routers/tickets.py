"""Tickets / support — HTTP surface (Member C).

Endpoints:

* ``POST   /api/v1/tickets``                — customer creates a ticket
* ``GET    /api/v1/tickets``                — customer lists own tickets
* ``GET    /api/v1/tickets/triage``         — agent/admin only
* ``PATCH  /api/v1/tickets/{id}/status``    — agent/admin only

Auth is the canonical JWT bearer flow (`app.dependencies.get_current_user`),
unifying this slice with the rest of the backend_python core.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status

from app.dependencies import CurrentUser, get_current_user, require_agent
from app.schemas import (
    Ticket,
    TicketCreate,
    TicketListResponse,
    TicketUpdateStatus,
)
from app.services.tickets_service import TicketService

router = APIRouter(prefix="/tickets", tags=["tickets"])


@router.post(
    "",
    response_model=Ticket,
    status_code=status.HTTP_201_CREATED,
)
async def create_ticket(
    data: TicketCreate,
    user: CurrentUser = Depends(get_current_user),
) -> Ticket:
    return await TicketService.create_ticket(data, user.user_id)


@router.get("", response_model=TicketListResponse)
def list_tickets(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    user: CurrentUser = Depends(get_current_user),
) -> TicketListResponse:
    return TicketService.get_tickets(user.user_id, page=page, limit=limit)


@router.get(
    "/triage",
    response_model=list[Ticket],
    dependencies=[Depends(require_agent)],
)
def triage_queue() -> list[Ticket]:
    return TicketService.get_triage_queue()


@router.patch(
    "/{ticket_id}/status",
    response_model=Ticket,
    dependencies=[Depends(require_agent)],
)
def update_status(ticket_id: str, data: TicketUpdateStatus) -> Ticket:
    return TicketService.update_ticket_status(ticket_id, data.status)
