"""Cron sweep + payment.success event handler.

sweep_stale_pending(db)
    Find PENDING orders older than STALE_THRESHOLD_MINUTES; advance to CONFIRMED
    if a SUCCESS Payment exists (HR-8 padlock), otherwise CANCEL (REQ_EC_5).

handle_payment_success(db, payload)
    Member B's webhook subscriber. Idempotent on idempotency_key.
"""

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.exceptions import DomainError
from app.models import Order, OrderStatus, Payment, PaymentStatus
from app.services import orders_service
from app.settings import settings


def sweep_stale_pending(db: Session) -> dict:
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=settings.STALE_THRESHOLD_MINUTES)

    stale = (
        db.execute(
            select(Order).where(
                Order.status == OrderStatus.PENDING.value, Order.placed_at < cutoff
            )
        )
        .scalars()
        .all()
    )

    cancelled: list[str] = []
    confirmed: list[str] = []

    for order in stale:
        payment = db.execute(
            select(Payment).where(
                Payment.order_id == order.id,
                Payment.status == PaymentStatus.SUCCESS.value,
            )
        ).scalar_one_or_none()

        try:
            if payment is not None:
                orders_service.update_status(
                    db,
                    order_id=order.id,
                    new_status=OrderStatus.CONFIRMED.value,
                    actor="system",
                    reason="payment_confirmed_late",
                )
                confirmed.append(order.id)
            else:
                orders_service.update_status(
                    db,
                    order_id=order.id,
                    new_status=OrderStatus.CANCELLED.value,
                    actor="system",
                    reason="stale_pending_timeout",
                )
                cancelled.append(order.id)
        except DomainError:
            # Race protection — another writer moved this order. Skip silently.
            continue

    return {"cancelled": cancelled, "confirmed": confirmed}


def handle_payment_success(db: Session, payload: dict) -> None:
    order_id = payload["order_id"]
    idempotency_key = payload.get("idempotency_key")

    order = db.get(Order, order_id)
    if order is None:
        return  # unknown order — silent no-op
    if order.status != OrderStatus.PENDING.value:
        return  # reordering safety — sweep may have already advanced/cancelled

    try:
        orders_service.update_status(
            db,
            order_id=order_id,
            new_status=OrderStatus.CONFIRMED.value,
            actor="system",
            reason="payment_success",
            idempotency_key=idempotency_key,
        )
    except DomainError:
        return
