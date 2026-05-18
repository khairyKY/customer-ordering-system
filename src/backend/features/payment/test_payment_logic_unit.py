"""Additional unit tests for payment_logic.py.

Complements test_payment.py with extra boundary coverage for the pure
tax/discount math and input validation.
"""

import pytest

from .payment_logic import calculate_total, validate_payment_input


# ─── calculate_total ────────────────────────────────────────────────────────

def test_calculate_total_discount_equal_to_subtotal_is_zero():
    # Max(0, 50 - 50) = 0; 0 * 1.10 = 0
    assert calculate_total(50.0, 50.0) == 0.00


def test_calculate_total_partial_discount():
    # Max(0, 100 - 25) = 75; 75 * 1.10 = 82.5
    assert calculate_total(100.0, 25.0) == 82.50


def test_calculate_total_large_value():
    assert calculate_total(10_000.0, 0) == 11_000.00


def test_calculate_total_zero_subtotal():
    assert calculate_total(0.0, 0.0) == 0.00


def test_calculate_total_negative_discount_increases_total():
    # No discount-sign guard exists: Max(0, 100 - (-10)) = 110; 110 * 1.10 = 121
    assert calculate_total(100.0, -10.0) == 121.00


# ─── validate_payment_input ─────────────────────────────────────────────────

def test_validate_payment_input_happy_path():
    assert validate_payment_input({"amount": 100, "idempotencyKey": "key-1"}) is True


def test_validate_payment_input_rejects_zero_amount():
    with pytest.raises(ValueError, match="InvalidAmountError"):
        validate_payment_input({"amount": 0, "idempotencyKey": "key-1"})


def test_validate_payment_input_rejects_missing_amount():
    with pytest.raises(ValueError, match="InvalidAmountError"):
        validate_payment_input({"idempotencyKey": "key-1"})
