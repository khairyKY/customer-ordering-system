"""Inventory HTTP surface. Admin-only."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import CurrentUser, require_admin
from app.schemas import InventoryListResponse, ProductOut, UpdateStockRequest
from app.services import inventory_service

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get(
    "",
    response_model=InventoryListResponse,
    summary="List products with low_stock flag",
)
def list_inventory(
    db: Session = Depends(get_db),
    _admin: CurrentUser = Depends(require_admin),
) -> InventoryListResponse:
    products = inventory_service.find_all(db)
    return InventoryListResponse(products=[ProductOut(**p) for p in products])


@router.patch(
    "/{product_id}",
    response_model=ProductOut,
    summary="Update stock quantity",
)
def update_stock(
    product_id: str,
    payload: UpdateStockRequest,
    db: Session = Depends(get_db),
    _admin: CurrentUser = Depends(require_admin),
) -> ProductOut:
    product = inventory_service.update_stock(db, product_id=product_id, stock=payload.stock)
    return ProductOut(**product)
