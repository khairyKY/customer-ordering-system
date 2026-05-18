"""In-memory cart service — migrated from the deprecated Node/Express backend.

Replaces: src/backend/controllers/cartController.js + routes/cartRoutes.js
Endpoints:
    GET    /api/v1/cart
    POST   /api/v1/cart/add         { product_id, quantity? }
    PUT    /api/v1/cart/update      { product_id, new_quantity }
    DELETE /api/v1/cart/remove      { product_id }
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.models import Product

router = APIRouter(prefix="/cart", tags=["cart"])

TAX_RATE = 0.10

# ── In-memory cart (session-scoped, mirrors the Node version) ────────────────
_cart: dict = {
    "id": "dev-session-cart",
    "sessionId": "dev-session",
    "items": [],
    "subtotal": 0.0,
    "tax": 0.0,
    "total": 0.0,
}


def _recalc():
    _cart["subtotal"] = sum(i["total_price"] for i in _cart["items"])
    _cart["tax"] = round(_cart["subtotal"] * TAX_RATE, 2)
    _cart["total"] = round(_cart["subtotal"] + _cart["tax"], 2)


def _find_product(product_id: str) -> dict | None:
    db: Session = SessionLocal()
    try:
        p = db.query(Product).filter(Product.id == product_id).first()
        if not p:
            return None
        return {"id": p.id, "name": p.name, "price": p.price, "stock": p.stock, "sku": p.sku}
    finally:
        db.close()


# ── Schemas ──────────────────────────────────────────────────────────────────

class AddItemBody(BaseModel):
    product_id: str
    quantity: int = Field(default=1, ge=1)

class UpdateItemBody(BaseModel):
    product_id: str
    new_quantity: int

class RemoveItemBody(BaseModel):
    product_id: str


# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("")
def get_cart():
    return _cart


@router.post("/add", status_code=201)
def add_item(body: AddItemBody):
    product = _find_product(body.product_id)
    if not product:
        raise HTTPException(404, detail={"error": "Product not found"})

    existing = next((i for i in _cart["items"] if i["product_id"] == body.product_id), None)
    current_qty = existing["quantity"] if existing else 0

    if current_qty + body.quantity > product["stock"]:
        raise HTTPException(400, detail={"error": "Insufficient stock"})

    if existing:
        existing["quantity"] += body.quantity
        existing["total_price"] = round(existing["quantity"] * product["price"], 2)
    else:
        _cart["items"].append({
            "id": str(uuid.uuid4()),
            "product_id": product["id"],
            "product_name": product["name"],
            "sku": product.get("sku", f"SKU-{product['id'][:8]}"),
            "unit_price": product["price"],
            "quantity": body.quantity,
            "total_price": round(product["price"] * body.quantity, 2),
        })

    _recalc()
    return _cart


@router.put("/update")
def update_item(body: UpdateItemBody):
    product = _find_product(body.product_id)
    existing = next((i for i in _cart["items"] if i["product_id"] == body.product_id), None)

    if not existing:
        raise HTTPException(404, detail={"error": "Item not in cart"})

    if product and body.new_quantity > product["stock"]:
        raise HTTPException(400, detail={"error": "Insufficient stock"})

    if body.new_quantity <= 0:
        _cart["items"] = [i for i in _cart["items"] if i["product_id"] != body.product_id]
    else:
        existing["quantity"] = body.new_quantity
        existing["total_price"] = round(existing["quantity"] * existing["unit_price"], 2)

    _recalc()
    return {"success": True, "cart": _cart}


@router.delete("/remove")
def remove_item(body: RemoveItemBody):
    _cart["items"] = [i for i in _cart["items"] if i["product_id"] != body.product_id]
    _recalc()
    return {"success": True, "cart": _cart}
