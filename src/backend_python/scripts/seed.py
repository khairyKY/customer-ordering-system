"""Idempotent demo seed. Run with:

    python -m scripts.seed
"""

import logging
from datetime import datetime, timedelta, timezone

from app.db import Base, SessionLocal, engine
from app.models import (
    Order,
    OrderItem,
    OrderStatus,
    Product,
    Role,
    User,
)
from app.security import hash_password

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger("seed")


def _ensure_user(db, *, email: str, password: str, role: str) -> None:
    if db.query(User).filter_by(email=email).first():
        return
    db.add(User(email=email, password_hash=hash_password(password), role=role))


def _ensure_product(db, *, id_: str, name: str, sku: str, stock: int, price: float, image_url: str | None = None) -> None:
    if db.get(Product, id_):
        return
    db.add(Product(id=id_, name=name, sku=sku, stock=stock, price=price, image_url=image_url))


def _ensure_order(db, *, id_: str, status_: str, age: timedelta) -> None:
    if db.get(Order, id_):
        return
    o = Order(
        id=id_,
        status=status_,
        customer_id="alice-uuid-placeholder",
        customer_email="alice@example.com",
        customer_phone="+201234567890",
        subtotal=100.0,
        discount=0.0,
        tax=10.0,
        shipping_cost=5.0,
        total=115.0,
        shipping_address={
            "street": "1 Main", "city": "Cairo", "state": "C",
            "zip": "12345", "country": "EG",
        },
        placed_at=datetime.now(timezone.utc) - age,
    )
    o.items.extend([
        OrderItem(product_id="e1a9c2f0-7b3b-4e1e-9a9a-9a9a9a9a9a9a",
                  product_name="NVIDIA GeForce RTX 5090 Founders Edition",
                  quantity=1, unit_price=25.0, total_price=25.0),
        OrderItem(product_id="c1e9a2b0-7f3f-4c1c-9e9e-9e9e9e9e9e9e",
                  product_name="Logitech G Pro X Superlight 2",
                  quantity=1, unit_price=75.0, total_price=75.0),
    ])
    db.add(o)


def run() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        _ensure_user(db, email="admin@example.com", password="admin123", role=Role.ADMIN.value)
        _ensure_user(db, email="alice@example.com", password="Sup3rPass!", role=Role.CUSTOMER.value)
        # Used by the Playwright E2E tickets specs (customer creates a ticket;
        # agent triages). Passwords match tests/conftest.py for parity.
        _ensure_user(db, email="customer@example.com", password="custPass!1", role=Role.CUSTOMER.value)
        _ensure_user(db, email="agent@example.com",    password="agntPass!1", role=Role.AGENT.value)

        # Load the full product catalog from catalog_seed.json.
        # All products are now defined there — no more hard-coded demo products.
        import json, os
        seed_path = os.path.join(os.path.dirname(__file__), "..", "..", "database", "catalog_seed.json")
        if os.path.exists(seed_path):
            with open(seed_path, "r") as f:
                catalog = json.load(f)
            for p in catalog:
                sku = p.get("specs", {}).get("model", p["id"][:8])
                _ensure_product(db, id_=p["id"], name=p["name"], sku=sku,
                                stock=p.get("stock", 10), price=p["price"],
                                image_url=p.get("image_url"))
            log.info("loaded %d products from catalog_seed.json", len(catalog))

        _ensure_order(db, id_="ord_pending_1", status_=OrderStatus.PENDING.value, age=timedelta(minutes=5))
        _ensure_order(db, id_="ord_processing_1", status_=OrderStatus.PROCESSING.value, age=timedelta(hours=2))
        _ensure_order(db, id_="ord_delivered_1", status_=OrderStatus.DELIVERED.value, age=timedelta(days=3))

        db.commit()
        log.info("seed complete")
    finally:
        db.close()


if __name__ == "__main__":
    run()
