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
                "category": p.category or _guess_category(p.name),
                "image_url": p.image_url or f"https://placehold.co/600x400?text={p.name.replace(' ', '+')[:20]}",
                "specs": p.specs,
                "spec_snippet": _generate_spec_snippet(p.category or _guess_category(p.name), p.specs),
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
            "category": p.category or _guess_category(p.name),
            "image_url": p.image_url or f"https://placehold.co/600x400?text={p.name.replace(' ', '+')[:20]}",
            "specs": p.specs,
            "spec_snippet": _generate_spec_snippet(p.category or _guess_category(p.name), p.specs),
        }
    finally:
        db.close()


def _generate_spec_snippet(category: str | None, specs: dict | None) -> str | None:
    if not specs:
        return None
    if category == "GPU":
        return specs.get("vram") or specs.get("boost_clock")
    elif category == "CPU":
        cores = specs.get("cores")
        threads = specs.get("threads")
        if cores and threads:
            return f"{cores}, {threads}"
        return specs.get("cores") or specs.get("max_turbo")
    elif category == "Memory":
        speed = specs.get("speed")
        latency = specs.get("latency")
        if speed and latency:
            return f"{speed}, {latency}"
        return speed
    elif category == "Storage":
        read_speed = specs.get("read_speed")
        interface = specs.get("interface")
        if read_speed and interface:
            return f"{read_speed}, {interface}"
        return read_speed or interface
    elif category == "Motherboard":
        socket = specs.get("socket")
        ram = specs.get("ram_support")
        if socket and ram:
            return f"{socket}, {ram}"
        return socket
    elif category == "Monitors":
        panel = specs.get("panel")
        refresh = specs.get("refresh_rate")
        if panel and refresh:
            return f"{panel}, {refresh}"
        return panel or refresh
    # Default fallback: get the first couple of values
    non_model_vals = [v for k, v in specs.items() if k not in ("brand", "model")]
    if non_model_vals:
        return ", ".join(str(v) for v in non_model_vals[:2])
    return None


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
