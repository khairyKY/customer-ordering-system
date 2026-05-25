"""Product catalog router — migrated from the deprecated Node/Express backend.

Replaces: src/backend/controllers/productController.js + routes/productRoutes.js
Reads from the `products` table (seeded by scripts/seed.py).

Endpoints:
    GET /api/v1/products          → list all products
    GET /api/v1/products/{id}     → single product detail
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.models import Product

router = APIRouter(prefix="/products", tags=["catalog"])


def _db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("")
def list_products():
    db: Session = SessionLocal()
    try:
        rows = db.query(Product).order_by(Product.name).all()
        return [
            {
                "id": p.id,
                "name": p.name,
                "sku": p.sku,
                "price": p.price,
                "stock": p.stock,
                "category": _guess_category(p.name),
                "image_url": p.image_url or f"https://placehold.co/600x400?text={p.name.replace(' ', '+')[:20]}",
            }
            for p in rows
        ]
    finally:
        db.close()


@router.get("/{product_id}")
def get_product(product_id: str):
    db: Session = SessionLocal()
    try:
        p = db.query(Product).filter(Product.id == product_id).first()
        if not p:
            raise HTTPException(404, detail={"error": "Product not found"})
        return {
            "id": p.id,
            "name": p.name,
            "sku": p.sku,
            "price": p.price,
            "stock": p.stock,
            "category": _guess_category(p.name),
            "image_url": p.image_url or f"https://placehold.co/600x400?text={p.name.replace(' ', '+')[:20]}",
        }
    finally:
        db.close()


def _guess_category(name: str) -> str:
    """Derive a category label from the product name for frontend filtering."""
    nl = name.lower()
    if any(k in nl for k in ("rtx", "geforce", "radeon", "gpu")):
        return "GPU"
    if any(k in nl for k in ("ryzen", "core i", "cpu", "processor")):
        return "CPU"
    if any(k in nl for k in ("motherboard", "z790", "x670", "mainboard")):
        return "Motherboard"
    if any(k in nl for k in ("ddr", "ram", "memory", "vengeance", "trident")):
        return "Memory"
    if any(k in nl for k in ("ssd", "nvme", "storage", "wd black", "western digital", "samsung 990", "crucial t7", "sn850")):
        return "Storage"
    if any(k in nl for k in ("monitor", "oled", "ultrawide", "odyssey", "ultragear")):
        return "Monitors"
    return "Peripherals"
