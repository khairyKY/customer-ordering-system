"""Integration tests for the payment slice (Pyramid: Integration layer).

Exercises the real HTTP -> router -> DB flow of the current FastAPI payment
implementation (``app/routers/payment.py``) via the TestClient + in-memory
SQLite fixtures from ``conftest.py``.

Endpoints covered:
    POST /api/v1/payment/process            (public checkout stub)
    GET  /api/v1/payment/methods            (auth)
    POST /api/v1/payment/methods            (auth)
    PUT  /api/v1/payment/methods/{id}/default (auth)
"""

import uuid

_PROCESS = "/api/v1/payment/process"
_METHODS = "/api/v1/payment/methods"


def _key() -> str:
    return str(uuid.uuid4())


# ─── POST /payment/process ──────────────────────────────────────────────────

def test_process_payment_success_returns_txn(client):
    r = client.post(_PROCESS, json={
        "amount": 55.0, "cartTotal": 50.0, "idempotencyKey": _key(),
    })
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "SUCCESS"
    assert body["total"] == 55.0
    assert body["transactionId"]


def test_process_payment_rejects_non_positive_amount(client):
    r = client.post(_PROCESS, json={
        "amount": 0, "cartTotal": 50.0, "idempotencyKey": _key(),
    })
    assert r.status_code == 422, r.text


def test_process_payment_persists_order_when_items_present(client, db):
    from app.models import Order

    txn = client.post(_PROCESS, json={
        "amount": 21.98,
        "cartTotal": 19.98,
        "idempotencyKey": _key(),
        "customerId": "guest",
        "items": [
            {"product_id": "PROD-001", "product_name": "USB Cable",
             "quantity": 2, "unit_price": 9.99},
        ],
    }).json()["transactionId"]

    order = db.get(Order, txn)
    assert order is not None
    assert order.total == 21.98
    # tax = amount - subtotal = 21.98 - (2 * 9.99) = 2.00
    assert round(order.subtotal, 2) == 19.98
    assert round(order.tax, 2) == 2.00
    assert len(order.items) == 1
    assert order.items[0].product_id == "PROD-001"
    assert order.items[0].total_price == 19.98


def test_process_payment_without_items_creates_no_order(client, db):
    from app.models import Order

    before = len(db.query(Order).all())
    r = client.post(_PROCESS, json={
        "amount": 30.0, "cartTotal": 30.0, "idempotencyKey": _key(),
    })
    assert r.status_code == 200, r.text
    assert len(db.query(Order).all()) == before


def test_process_payment_distinct_keys_yield_distinct_txns(client):
    t1 = client.post(_PROCESS, json={"amount": 10.0, "cartTotal": 10.0, "idempotencyKey": _key()}).json()
    t2 = client.post(_PROCESS, json={"amount": 20.0, "cartTotal": 20.0, "idempotencyKey": _key()}).json()
    assert t1["transactionId"] != t2["transactionId"]


# ─── /payment/methods (auth-protected) ──────────────────────────────────────

def test_get_methods_requires_auth(client):
    r = client.get(_METHODS)
    assert r.status_code in (401, 403), r.text


def test_add_method_tokenizes_and_stores_last4(client, customer_headers):
    r = client.post(_METHODS, json={
        "card_number": "4242424242424242",
        "exp_month": 12, "exp_year": 2030, "cvv": "123", "brand": "VISA",
    }, headers=customer_headers)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["last4"] == "4242"
    assert body["brand"] == "VISA"
    # first method for a user becomes the default
    assert body["is_default"] is True


def test_first_method_is_default_second_is_not(client, customer_headers):
    first = client.post(_METHODS, json={
        "card_number": "4242424242424242", "exp_month": 1, "exp_year": 2031,
        "cvv": "123", "brand": "VISA",
    }, headers=customer_headers).json()
    second = client.post(_METHODS, json={
        "card_number": "5555555555554444", "exp_month": 2, "exp_year": 2032,
        "cvv": "456", "brand": "MASTERCARD",
    }, headers=customer_headers).json()

    assert first["is_default"] is True
    assert second["is_default"] is False


def test_set_default_moves_default_flag(client, customer_headers):
    first = client.post(_METHODS, json={
        "card_number": "4242424242424242", "exp_month": 1, "exp_year": 2031,
        "cvv": "123", "brand": "VISA",
    }, headers=customer_headers).json()
    second = client.post(_METHODS, json={
        "card_number": "5555555555554444", "exp_month": 2, "exp_year": 2032,
        "cvv": "456", "brand": "MASTERCARD",
    }, headers=customer_headers).json()

    r = client.put(f"{_METHODS}/{second['id']}/default", headers=customer_headers)
    assert r.status_code == 200, r.text

    methods = {m["id"]: m for m in client.get(_METHODS, headers=customer_headers).json()}
    assert methods[second["id"]]["is_default"] is True
    assert methods[first["id"]]["is_default"] is False


def test_methods_are_scoped_per_user(client, customer_headers, customer2_headers):
    client.post(_METHODS, json={
        "card_number": "4242424242424242", "exp_month": 1, "exp_year": 2031,
        "cvv": "123", "brand": "VISA",
    }, headers=customer_headers)

    # customer2 sees none of customer1's methods
    r = client.get(_METHODS, headers=customer2_headers)
    assert r.status_code == 200, r.text
    assert r.json() == []
