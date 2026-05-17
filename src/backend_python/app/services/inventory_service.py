"""Inventory domain logic. Writes are RFC-D001 sandboxed."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.exceptions import ProductNotFoundError
from app.models import Product

LOW_STOCK_THRESHOLD = 5


def _decorate(p: Product) -> dict:
    return {
        "id": p.id,
        "name": p.name,
        "sku": p.sku,
        "stock": p.stock,
        "low_stock": p.stock < LOW_STOCK_THRESHOLD,
    }


def find_all(db: Session) -> list[dict]:
    rows = db.execute(select(Product).order_by(Product.name)).scalars().all()
    return [_decorate(p) for p in rows]


def update_stock(db: Session, *, product_id: str, stock: int) -> dict:
    product = db.get(Product, product_id)
    if product is None:
        raise ProductNotFoundError(product_id)
    product.stock = stock
    db.commit()
    db.refresh(product)
    return _decorate(product)
