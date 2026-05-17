"""Webhook endpoint where Member B POSTs payment.success events.

Returns 202 Accepted regardless of internal state — idempotent producer contract.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas import PaymentSuccessEvent
from app.services.sweep_service import handle_payment_success

router = APIRouter(prefix="/events", tags=["events"])


@router.post(
    "/payment.success",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Receive Member B's payment.success event",
)
def receive_payment_success(
    event: PaymentSuccessEvent,
    db: Session = Depends(get_db),
) -> dict:
    handle_payment_success(db, event.model_dump())
    return {"received": True}
