"""Unit tests for the payment slice schema (Pyramid: Unit layer).

These cover the *current* FastAPI payment implementation in
``app/routers/payment.py`` — specifically the ``PaymentRequest`` /
``CartItemModel`` Pydantic models, which carry the validation logic for the
checkout payload.

Note: the legacy ``payment_logic`` / ``payment_controller`` modules (tax math,
idempotency dedup, strict promo/UUID validation) were removed in the 2026-05-20
backend migration and the endpoint is now a stub. These tests assert what the
schema actually enforces today rather than the retired behavior.
"""

import pytest
from pydantic import ValidationError

from app.routers.payment import CartItemModel, PaymentRequest

_VALID = {
    "amount": 100.0,
    "cartTotal": 100.0,
    "idempotencyKey": "550e8400-e29b-41d4-a716-446655440000",
}


# ─── PaymentRequest: required fields & positivity constraints ───────────────

def test_payment_request_happy_path():
    req = PaymentRequest(**_VALID)
    assert req.amount == 100.0
    assert req.cartTotal == 100.0
    assert req.idempotencyKey == _VALID["idempotencyKey"]
    # documented defaults
    assert req.promoCode is None
    assert req.items == []
    assert req.customerEmail == "guest@example.com"
    assert req.customerId == "guest"


def test_payment_request_rejects_zero_amount():
    # Field(..., gt=0) — non-positive charge must be rejected.
    with pytest.raises(ValidationError):
        PaymentRequest(**{**_VALID, "amount": 0})


def test_payment_request_rejects_negative_amount():
    with pytest.raises(ValidationError):
        PaymentRequest(**{**_VALID, "amount": -5.0})


def test_payment_request_rejects_zero_cart_total():
    with pytest.raises(ValidationError):
        PaymentRequest(**{**_VALID, "cartTotal": 0})


def test_payment_request_rejects_missing_amount():
    payload = {k: v for k, v in _VALID.items() if k != "amount"}
    with pytest.raises(ValidationError):
        PaymentRequest(**payload)


def test_payment_request_rejects_missing_idempotency_key():
    payload = {k: v for k, v in _VALID.items() if k != "idempotencyKey"}
    with pytest.raises(ValidationError):
        PaymentRequest(**payload)


def test_payment_request_rejects_empty_idempotency_key():
    # Field(..., min_length=1) — empty string is invalid.
    with pytest.raises(ValidationError):
        PaymentRequest(**{**_VALID, "idempotencyKey": ""})


def test_payment_request_accepts_optional_promo_code():
    req = PaymentRequest(**{**_VALID, "promoCode": "SAVE10"})
    assert req.promoCode == "SAVE10"


# ─── CartItemModel: quantity / price flexibility ────────────────────────────

def test_cart_item_accepts_unit_price_alias_fields():
    item = CartItemModel(product_id="PROD-001", quantity=2, unit_price=9.99)
    assert item.quantity == 2
    assert item.unit_price == 9.99
    assert item.price is None


def test_cart_item_requires_product_id_and_quantity():
    with pytest.raises(ValidationError):
        CartItemModel(quantity=1)
    with pytest.raises(ValidationError):
        CartItemModel(product_id="PROD-001")


def test_payment_request_parses_nested_items():
    req = PaymentRequest(
        **{
            **_VALID,
            "items": [
                {"product_id": "PROD-001", "name": "Cable", "quantity": 3, "price": 5.0},
            ],
        }
    )
    assert len(req.items) == 1
    assert req.items[0].product_id == "PROD-001"
    assert req.items[0].quantity == 3
    assert req.items[0].price == 5.0
