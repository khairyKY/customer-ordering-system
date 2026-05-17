import pytest
from .payment_logic import calculate_total, validate_payment_input
from .payment_controller import process_payment
from .payment_schema import PaymentRequest
from pydantic import ValidationError

def test_calculate_total_req_pay_01():
    # REQ_PAY_01: Should calculate exactly 10% tax on subtotal
    assert calculate_total(100.00, 0) == 110.00

def test_calculate_total_precision():
    # REQ_PAY_01: Should handle floating point precision ($19.99 case)
    # 19.99 * 1.10 = 21.989 -> 21.99
    assert calculate_total(19.99, 0) == 21.99

def test_calculate_total_req_ec_1():
    # REQ_EC_1: Should raise ValueError for negative subtotal
    with pytest.raises(ValueError, match="InvalidAmountError"):
        calculate_total(-1, 0)

def test_calculate_total_req_ec_4():
    # REQ_EC_4: Should apply promo floor at $0.00 for excessive discounts
    assert calculate_total(50, 60) == 0.00

def test_calculate_total_threshold():
    # Threshold: Should calculate correctly at the $0.01 minimum
    # 0.01 * 1.10 = 0.011 -> 0.01
    assert calculate_total(0.01, 0) == 0.01

def test_payment_schema_validation():
    valid_data = {
        "amount": 100.0,
        "idempotencyKey": "550e8400-e29b-41d4-a716-446655440000",
        "cartTotal": 100.0
    }
    
    # Boundary: Should reject non-positive amounts
    with pytest.raises(ValidationError):
        PaymentRequest(**{**valid_data, "amount": 0})
    
    # Threshold: Should reject amounts with > 2 decimal places
    with pytest.raises(ValidationError):
        PaymentRequest(**{**valid_data, "amount": 10.001})
    
    # Extreme: Should reject malformed UUIDs for idempotency
    with pytest.raises(ValidationError):
        PaymentRequest(**{**valid_data, "idempotencyKey": "not-a-uuid"})
    
    # Extreme: Should reject non-alphanumeric promo codes
    with pytest.raises(ValidationError):
        PaymentRequest(**{**valid_data, "promoCode": "PROMO-123!"})
    
    # Threshold: Should reject promo codes > 20 characters
    with pytest.raises(ValidationError):
        PaymentRequest(**{**valid_data, "promoCode": "A" * 21})

@pytest.mark.asyncio
async def test_idempotency_req_ec_2():
    payment_data = {
        "amount": 100.0,
        "idempotencyKey": "unique-key-123-python",
        "cartTotal": 100.0
    }
    
    first_call = await process_payment(payment_data)
    second_call = await process_payment(payment_data)
    
    assert second_call.get("isDuplicate") is True
    assert second_call.get("transactionId") == first_call.get("transactionId")

def test_validate_payment_input_failure_paths():
    # Failure Path: Should handle missing idempotency key
    with pytest.raises(ValueError, match="MissingIdempotencyKey"):
        validate_payment_input({"amount": 100})
    
    # Failure Path: Should handle invalid amount
    with pytest.raises(ValueError, match="InvalidAmountError"):
        validate_payment_input({"amount": -5, "idempotencyKey": "key"})
