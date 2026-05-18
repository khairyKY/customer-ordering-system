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

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import select, update
from app.db import get_db
from app.models import Order, OrderItem, OrderStatus, PaymentMethod
from app.schemas import PaymentMethodCreate, PaymentMethodOut
from app.dependencies import CurrentUser, get_current_user

router = APIRouter(prefix="/payment", tags=["payment"])
log = logging.getLogger(__name__)


class CartItemModel(BaseModel):
    product_id: str
    product_name: str | None = None
    name: str | None = None
    quantity: int
    unit_price: float | None = None
    price: float | None = None

class PaymentRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Post-tax total to charge (USD)")
    cartTotal: float = Field(..., gt=0, description="Server-side cart snapshot")
    promoCode: str | None = Field(default=None, description="Optional promo code")
    idempotencyKey: str = Field(..., min_length=1, description="UUID v4 for idempotency")
    items: list[CartItemModel] = []
    shipping: dict = {}
    customerEmail: str = "guest@example.com"
    customerId: str = "guest"


class PaymentResponse(BaseModel):
    status: str = "SUCCESS"
    total: float
    transactionId: str


@router.post("/process", response_model=PaymentResponse)
def process_payment(body: PaymentRequest, db: Session = Depends(get_db)):
    txn_id = str(uuid.uuid4())
    log.info(
        "payment_stub: amount=%.2f promo=%s idempotency=%s txn=%s",
        body.amount, body.promoCode, body.idempotencyKey, txn_id,
    )

    if body.items:
        customer_id = body.customerId
        subtotal = sum((item.unit_price or item.price or 0.0) * item.quantity for item in body.items)
        tax = max(0, body.amount - subtotal)

        order = Order(
            id=txn_id,
            status=OrderStatus.PENDING.value,
            customer_id=customer_id,
            customer_email=body.customerEmail,
            subtotal=subtotal,
            tax=tax,
            total=body.amount,
            shipping_address=body.shipping
        )
        for item in body.items:
            unit_price = item.unit_price or item.price or 0.0
            order.items.append(OrderItem(
                order_id=txn_id,
                product_id=item.product_id,
                product_name=item.product_name or item.name or "Unknown",
                quantity=item.quantity,
                unit_price=unit_price,
                total_price=unit_price * item.quantity
            ))
        db.add(order)
        db.commit()

    return PaymentResponse(
        status="SUCCESS",
        total=body.amount,
        transactionId=txn_id,
    )

@router.get("/methods", response_model=list[PaymentMethodOut])
def get_payment_methods(db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    return db.scalars(select(PaymentMethod).where(PaymentMethod.customer_id == user.user_id)).all()

@router.post("/methods", response_model=PaymentMethodOut)
def add_payment_method(payload: PaymentMethodCreate, db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    token = "tok_mock_" + str(uuid.uuid4())
    last4 = payload.card_number[-4:]
    
    existing = db.scalars(select(PaymentMethod).where(PaymentMethod.customer_id == user.user_id)).all()
    
    pm = PaymentMethod(
        customer_id=user.user_id,
        brand=payload.brand,
        last4=last4,
        exp_month=payload.exp_month,
        exp_year=payload.exp_year,
        token=token,
        is_default=len(existing) == 0
    )
    db.add(pm)
    db.commit()
    db.refresh(pm)
    return pm

@router.put("/methods/{method_id}/default")
def set_default_payment_method(method_id: str, db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    # unset others
    db.execute(update(PaymentMethod).where(PaymentMethod.customer_id == user.user_id).values(is_default=False))
    # set this
    db.execute(update(PaymentMethod).where(PaymentMethod.id == method_id, PaymentMethod.customer_id == user.user_id).values(is_default=True))
    db.commit()
    return {"status": "SUCCESS"}
