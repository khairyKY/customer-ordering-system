"""Payment processing stub — accepts the checkout frontend's payload and
returns a SUCCESS response with a generated transaction UUID.

This is a Phase 4 stub. In production, this would integrate with Stripe,
PayPal, or Member B's payment gateway.

Endpoint:
    POST /api/v1/payment/process
"""

from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/payment", tags=["payment"])
log = logging.getLogger(__name__)


class PaymentRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Post-tax total to charge (USD)")
    cartTotal: float = Field(..., gt=0, description="Server-side cart snapshot")
    promoCode: str | None = Field(default=None, description="Optional promo code")
    idempotencyKey: str = Field(..., min_length=1, description="UUID v4 for idempotency")


class PaymentResponse(BaseModel):
    status: str = "SUCCESS"
    total: float
    transactionId: str


@router.post("/process", response_model=PaymentResponse)
def process_payment(body: PaymentRequest):
    txn_id = str(uuid.uuid4())
    log.info(
        "payment_stub: amount=%.2f promo=%s idempotency=%s txn=%s",
        body.amount, body.promoCode, body.idempotencyKey, txn_id,
    )
    return PaymentResponse(
        status="SUCCESS",
        total=body.amount,
        transactionId=txn_id,
    )
