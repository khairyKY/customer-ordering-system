"""Orders HTTP surface. All endpoints require admin role."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import CurrentUser, require_admin
from app.schemas import (
    OrderDetail,
    OrderListResponse,
    OrderSummary,
    Pagination,
    StatusUpdateResponse,
    UpdateStatusRequest,
)
from app.services import orders_service

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get(
    "",
    response_model=OrderListResponse,
    summary="List orders (paginated, placed_at DESC)",
)
def list_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status", min_length=1, max_length=20),
    db: Session = Depends(get_db),
    _admin: CurrentUser = Depends(require_admin),
) -> OrderListResponse:
    result = orders_service.find_all(db, page=page, limit=limit, status_filter=status_filter)
    return OrderListResponse(
        orders=[OrderSummary.model_validate(o) for o in result["orders"]],
        pagination=Pagination(**result["pagination"]),
    )


@router.get(
    "/{order_id}",
    response_model=OrderDetail,
    summary="Get full order detail with line items",
)
def get_order(
    order_id: str,
    db: Session = Depends(get_db),
    _admin: CurrentUser = Depends(require_admin),
) -> OrderDetail:
    order = orders_service.find_by_id(db, order_id)
    return OrderDetail.model_validate(order)


@router.patch(
    "/{order_id}/status",
    response_model=StatusUpdateResponse,
    summary="Update order status (admin manual)",
)
def update_status(
    order_id: str,
    payload: UpdateStatusRequest,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(require_admin),
) -> StatusUpdateResponse:
    order = orders_service.update_status(
        db,
        order_id=order_id,
        new_status=payload.status,
        actor=admin.user_id,
    )
    return StatusUpdateResponse.model_validate(order)
