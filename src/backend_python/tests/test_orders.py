"""Orders + inventory + sweep tests — covers Phase 2 Gherkin D-1..D-6 + HR-8."""

from datetime import datetime, timedelta, timezone

import pytest

from app.models import Order, OrderStatus, Payment, PaymentStatus, Product
from app.services import orders_service
from app.services.sweep_service import sweep_stale_pending


# ─── Unit: transition matrix (Phase 2 §3.2.2) ──────────────────────────────

@pytest.mark.parametrize("from_,to", [
    ("PENDING", "CONFIRMED"),
    ("PENDING", "CANCELLED"),
    ("CONFIRMED", "PROCESSING"),
    ("CONFIRMED", "CANCELLED"),
    ("PROCESSING", "SHIPPED"),
    ("PROCESSING", "CANCELLED"),
    ("SHIPPED", "DELIVERED"),
    ("DELIVERED", "REFUNDED"),
])
def test_validate_transition_legal(from_, to):
    assert orders_service.validate_transition(from_, to) is True


@pytest.mark.parametrize("from_,to", [
    ("DELIVERED", "PENDING"),
    ("CANCELLED", "PENDING"),
    ("REFUNDED", "PENDING"),
    ("PENDING", "SHIPPED"),
    ("SHIPPED", "PENDING"),
    ("SHIPPED", "PROCESSING"),
])
def test_validate_transition_illegal(from_, to):
    assert orders_service.validate_transition(from_, to) is False


# ─── HTTP: GET /orders (D-1) ────────────────────────────────────────────────

def test_list_orders_default_pagination(client, db, admin_headers):
    for i in range(25):
        db.add(Order(
            id=f"ord_{i:03d}", status=OrderStatus.PENDING.value, customer_id="alice",
            subtotal=100.0, tax=10.0, total=110.0, shipping_address={},
            placed_at=datetime(2026, 5, 1, tzinfo=timezone.utc) + timedelta(days=i),
        ))
    db.commit()

    r = client.get("/api/v1/orders", headers=admin_headers)
    assert r.status_code == 200
    body = r.json()
    assert len(body["orders"]) == 20
    assert body["pagination"] == {"page": 1, "limit": 20, "total_count": 25, "total_pages": 2}


def test_list_orders_page_2(client, db, admin_headers):
    for i in range(25):
        db.add(Order(
            id=f"ord_{i:03d}", status=OrderStatus.PENDING.value, customer_id="alice",
            subtotal=100.0, tax=10.0, total=110.0, shipping_address={},
            placed_at=datetime(2026, 5, 1, tzinfo=timezone.utc) + timedelta(days=i),
        ))
    db.commit()

    r = client.get("/api/v1/orders?page=2&limit=20", headers=admin_headers)
    assert r.status_code == 200
    assert len(r.json()["orders"]) == 5


def test_list_orders_filter_by_status(client, db, admin_headers):
    for i in range(5):
        db.add(Order(id=f"p_{i}", status=OrderStatus.PENDING.value, customer_id="a",
                     subtotal=100.0, tax=10.0, total=110.0, shipping_address={}))
    for i in range(3):
        db.add(Order(id=f"d_{i}", status=OrderStatus.DELIVERED.value, customer_id="a",
                     subtotal=100.0, tax=10.0, total=110.0, shipping_address={}))
    db.commit()

    r = client.get("/api/v1/orders?status=PENDING", headers=admin_headers)
    assert r.json()["pagination"]["total_count"] == 5


# ─── HTTP: GET /orders/{id} (D-3) ───────────────────────────────────────────

def test_get_order_detail(client, db, admin_headers):
    db.add(Order(
        id="ord_abc", status=OrderStatus.PROCESSING.value, customer_id="alice",
        customer_email="alice@example.com", customer_phone="+201234567890",
        subtotal=100.0, tax=10.0, total=110.0,
        shipping_address={"city": "Cairo"},
    ))
    db.commit()

    r = client.get("/api/v1/orders/ord_abc", headers=admin_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["id"] == "ord_abc"
    assert body["shipping_address"]["city"] == "Cairo"
    assert body["customer_email"] == "alice@example.com"


def test_get_order_404(client, admin_headers):
    r = client.get("/api/v1/orders/missing", headers=admin_headers)
    assert r.status_code == 404


# ─── HTTP: PATCH /orders/{id}/status (D-2) ──────────────────────────────────

def test_update_status_happy(client, db, admin_headers):
    db.add(Order(id="ord_p", status=OrderStatus.PENDING.value, customer_id="a",
                 subtotal=100.0, tax=10.0, total=110.0, shipping_address={}))
    db.commit()

    r = client.patch("/api/v1/orders/ord_p/status", json={"status": "CONFIRMED"}, headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["status"] == "CONFIRMED"


def test_update_status_illegal_transition_422(client, db, admin_headers):
    db.add(Order(id="ord_done", status=OrderStatus.DELIVERED.value, customer_id="a",
                 subtotal=100.0, tax=10.0, total=110.0, shipping_address={}))
    db.commit()

    r = client.patch("/api/v1/orders/ord_done/status", json={"status": "PENDING"}, headers=admin_headers)
    assert r.status_code == 422


def test_update_status_unknown_value_422(client, db, admin_headers):
    db.add(Order(id="ord_p", status=OrderStatus.PENDING.value, customer_id="a",
                 subtotal=100.0, tax=10.0, total=110.0, shipping_address={}))
    db.commit()

    r = client.patch("/api/v1/orders/ord_p/status", json={"status": "HACKED"}, headers=admin_headers)
    assert r.status_code == 422


def test_update_status_empty_body_422(client, db, admin_headers):
    db.add(Order(id="ord_p", status=OrderStatus.PENDING.value, customer_id="a",
                 subtotal=100.0, tax=10.0, total=110.0, shipping_address={}))
    db.commit()

    r = client.patch("/api/v1/orders/ord_p/status", json={}, headers=admin_headers)
    assert r.status_code == 422


# ─── HTTP: inventory (D-4, D-5) ─────────────────────────────────────────────

def test_inventory_list_with_low_stock_flag(client, db, admin_headers):
    db.add(Product(id="P1", name="Mouse", sku="MS-1", stock=3))
    db.add(Product(id="P2", name="Keyboard", sku="KB-1", stock=40))
    db.commit()

    r = client.get("/api/v1/inventory", headers=admin_headers)
    by_id = {p["id"]: p for p in r.json()["products"]}
    assert by_id["P1"]["low_stock"] is True
    assert by_id["P2"]["low_stock"] is False


@pytest.mark.parametrize("bad_stock", [-10, 3.7, 999_999])
def test_update_stock_rejects_invalid(client, db, admin_headers, bad_stock):
    db.add(Product(id="P1", name="Mouse", sku="MS-1", stock=10))
    db.commit()

    r = client.patch("/api/v1/inventory/P1", json={"stock": bad_stock}, headers=admin_headers)
    assert r.status_code == 422


def test_update_stock_happy(client, db, admin_headers):
    db.add(Product(id="P1", name="Mouse", sku="MS-1", stock=2))
    db.commit()

    r = client.patch("/api/v1/inventory/P1", json={"stock": 50}, headers=admin_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["stock"] == 50
    assert body["low_stock"] is False


# ─── Sweep service (D-6, HR-8) ──────────────────────────────────────────────

def test_sweep_cancels_stale_pending(db):
    db.add(Order(
        id="ord_stale", status=OrderStatus.PENDING.value, customer_id="a",
        subtotal=100.0, tax=10.0, total=110.0, shipping_address={},
        placed_at=datetime.now(timezone.utc) - timedelta(minutes=16),
    ))
    db.commit()

    result = sweep_stale_pending(db)
    assert "ord_stale" in result["cancelled"]
    assert db.get(Order, "ord_stale").status == OrderStatus.CANCELLED.value


def test_sweep_advances_paid_stale_to_confirmed(db):
    """HR-8 padlock — paid orders must NOT be cancelled by the sweep."""
    db.add(Order(
        id="ord_paid", status=OrderStatus.PENDING.value, customer_id="a",
        subtotal=100.0, tax=10.0, total=110.0, shipping_address={},
        placed_at=datetime.now(timezone.utc) - timedelta(minutes=16),
    ))
    db.add(Payment(order_id="ord_paid", status=PaymentStatus.SUCCESS.value, amount=110.0))
    db.commit()

    result = sweep_stale_pending(db)
    assert "ord_paid" in result["confirmed"]
    assert db.get(Order, "ord_paid").status == OrderStatus.CONFIRMED.value


def test_sweep_skips_fresh_orders(db):
    db.add(Order(
        id="ord_fresh", status=OrderStatus.PENDING.value, customer_id="a",
        subtotal=100.0, tax=10.0, total=110.0, shipping_address={},
        placed_at=datetime.now(timezone.utc),
    ))
    db.commit()

    assert sweep_stale_pending(db) == {"cancelled": [], "confirmed": []}
    assert db.get(Order, "ord_fresh").status == OrderStatus.PENDING.value


def test_payment_success_webhook_advances_pending(client, db):
    db.add(Order(
        id="ord_xyz", status=OrderStatus.PENDING.value, customer_id="a",
        subtotal=100.0, tax=10.0, total=110.0, shipping_address={},
    ))
    db.commit()

    r = client.post("/api/v1/events/payment.success", json={
        "order_id": "ord_xyz",
        "payment_id": "pay_999",
        "idempotency_key": "idem-1",
        "amount": 110.0,
        "occurred_at": "2026-05-15T10:00:00Z",
    })
    assert r.status_code == 202
    assert db.get(Order, "ord_xyz").status == OrderStatus.CONFIRMED.value


def test_payment_success_webhook_is_idempotent(client, db):
    """Same idempotency_key replayed → no duplicate audit log."""
    db.add(Order(
        id="ord_xyz", status=OrderStatus.PENDING.value, customer_id="a",
        subtotal=100.0, tax=10.0, total=110.0, shipping_address={},
    ))
    db.commit()

    payload = {
        "order_id": "ord_xyz", "payment_id": "pay_999",
        "idempotency_key": "idem-1", "amount": 110.0,
        "occurred_at": "2026-05-15T10:00:00Z",
    }
    client.post("/api/v1/events/payment.success", json=payload)
    client.post("/api/v1/events/payment.success", json=payload)  # replay

    from app.models import AuditLog
    audit_entries = db.query(AuditLog).filter_by(order_id="ord_xyz").all()
    assert len(audit_entries) == 1  # only one entry despite two webhook calls
