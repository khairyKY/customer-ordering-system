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


def _ensure_product(db, *, id_: str, name: str, sku: str, stock: int, price: float) -> None:
    if db.get(Product, id_):
        return
    db.add(Product(id=id_, name=name, sku=sku, stock=stock, price=price))


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
        OrderItem(product_id="PROD-001", product_name="Wireless Mouse",
                  quantity=1, unit_price=25.0, total_price=25.0),
        OrderItem(product_id="PROD-002", product_name="Mechanical Keyboard",
                  quantity=1, unit_price=75.0, total_price=75.0),
    ])
    db.add(o)


def run() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        _ensure_user(db, email="admin@example.com", password="admin123", role=Role.ADMIN.value)
        _ensure_user(db, email="alice@example.com", password="Sup3rPass!", role=Role.CUSTOMER.value)

        products = [
            ("PROD-001", "Wireless Mouse",       "MS-001", 30, 25.00),
            ("PROD-002", "Mechanical Keyboard",  "KB-002", 15, 89.00),
            ("PROD-003", "27\" Gaming Monitor",  "MN-003",  3, 320.00),
            ("PROD-004", "USB-C Hub",            "HB-004", 50, 35.00),
            ("PROD-005", "Webcam HD",            "WC-005",  4, 45.00),
            ("PROD-006", "Noise-Cancelling Headset", "HS-006", 12, 120.00),
        ]
        for pid, name, sku, stock, price in products:
            _ensure_product(db, id_=pid, name=name, sku=sku, stock=stock, price=price)

        _ensure_order(db, id_="ord_pending_1", status_=OrderStatus.PENDING.value, age=timedelta(minutes=5))
        _ensure_order(db, id_="ord_processing_1", status_=OrderStatus.PROCESSING.value, age=timedelta(hours=2))
        _ensure_order(db, id_="ord_delivered_1", status_=OrderStatus.DELIVERED.value, age=timedelta(days=3))

        db.commit()
        log.info("seed complete")
    finally:
        db.close()


if __name__ == "__main__":
    run()
