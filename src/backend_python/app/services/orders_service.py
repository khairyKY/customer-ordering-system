"""Order domain logic — transition matrix, pagination, audited mutations."""

import math
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.exceptions import IllegalTransitionError, OrderNotFoundError
from app.models import AuditLog, Order, OrderStatus

# 7×7 transition matrix from Phase 2 §3.2.2
_LEGAL: dict[str, set[str]] = {
    OrderStatus.PENDING.value: {OrderStatus.CONFIRMED.value, OrderStatus.CANCELLED.value},
    OrderStatus.CONFIRMED.value: {OrderStatus.PROCESSING.value, OrderStatus.CANCELLED.value},
    OrderStatus.PROCESSING.value: {OrderStatus.SHIPPED.value, OrderStatus.CANCELLED.value},
    OrderStatus.SHIPPED.value: {OrderStatus.DELIVERED.value},
    OrderStatus.DELIVERED.value: {OrderStatus.REFUNDED.value},
    OrderStatus.CANCELLED.value: set(),  # terminal
    OrderStatus.REFUNDED.value: set(),  # terminal
}


def validate_transition(from_status: str, to_status: str) -> bool:
    """Pure function — no DB. Used by routes AND the sweep service."""
    return to_status in _LEGAL.get(from_status, set())


def find_all(
    db: Session, *, page: int = 1, limit: int = 20, status_filter: str | None = None, customer_filter: str | None = None
) -> dict:
    base = select(Order)
    if status_filter:
        base = base.where(Order.status == status_filter)
    if customer_filter:
        base = base.where(Order.customer_id == customer_filter)

    total_count = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    total_pages = max(1, math.ceil(total_count / limit))

    rows = (
        db.execute(
            base.order_by(Order.placed_at.desc()).offset((page - 1) * limit).limit(limit)
        )
        .scalars()
        .all()
    )

    return {
        "orders": list(rows),
        "pagination": {
            "page": page,
            "limit": limit,
            "total_count": total_count,
            "total_pages": total_pages,
        },
    }


def find_by_id(db: Session, order_id: str) -> Order:
    order = db.get(Order, order_id)
    if order is None:
        raise OrderNotFoundError(order_id)
    return order


def update_status(
    db: Session,
    *,
    order_id: str,
    new_status: str,
    actor: str,
    reason: str = "admin_status_update",
    idempotency_key: str | None = None,
) -> Order:
    """Guarded status mutation with audit log. Idempotent on idempotency_key."""

    # Idempotency short-circuit
    if idempotency_key:
        existing = db.execute(
            select(AuditLog).where(AuditLog.idempotency_key == idempotency_key)
        ).scalar_one_or_none()
        if existing:
            return db.get(Order, existing.order_id)  # may be None if order deleted, accept that

    order = db.get(Order, order_id)
    if order is None:
        raise OrderNotFoundError(order_id)

    if not validate_transition(order.status, new_status):
        raise IllegalTransitionError(order.status, new_status)

    prev_status = order.status
    order.status = new_status
    order.updated_at = datetime.now(timezone.utc)

    db.add(
        AuditLog(
            order_id=order.id,
            from_status=prev_status,
            to_status=new_status,
            actor=actor,
            reason=reason,
            idempotency_key=idempotency_key,
        )
    )

    db.commit()
    db.refresh(order)
    return order
