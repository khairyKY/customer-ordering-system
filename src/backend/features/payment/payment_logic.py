"""
REQ_PAY_01, REQ_EC_1, REQ_EC_4 Implementation in Python.
"""

def calculate_total(subtotal: float, discount: float) -> float:
    if subtotal < 0:
        raise ValueError("InvalidAmountError")

    # REQ_EC_4: Promo Floor at $0.00
    discounted_subtotal = max(0.0, subtotal - discount)
    
    # REQ_PAY_01: 10% Tax Calculation
    total = discounted_subtotal * 1.10
    
    # Return rounded to 2 decimal places to avoid floating point issues in tests
    return round(total, 2)

def validate_payment_input(data: dict) -> bool:
    if not data.get("amount") or data.get("amount") <= 0:
        raise ValueError("InvalidAmountError")
    if not data.get("idempotencyKey"):
        raise ValueError("MissingIdempotencyKey")
    return True
