import time
from .payment_schema import PaymentRequest
from .payment_logic import calculate_total

# Mock Database Storage for Testing Idempotency
mock_payments = {}

async def process_payment(data: dict):
    try:
        # 1. Validate Input (Step 2 Padlock)
        validated_data = PaymentRequest(**data)
    except Exception as e:
        # In a real FastAPI app, this would be handled by request validation
        raise e

    # 2. Check Idempotency (REQ_EC_2)
    if validated_data.idempotencyKey in mock_payments:
        existing = mock_payments[validated_data.idempotencyKey]
        return {
            "isDuplicate": True, 
            "transactionId": existing["id"]
        }

    # 3. Logic Execution (REQ_PAY_01, REQ_EC_4)
    discount = 0.0  # Simplified for basic slice audit
    final_total = calculate_total(validated_data.amount, discount)

    # 4. Record Payment
    transaction_id = f"tx_{int(time.time() * 1000)}"
    mock_payments[validated_data.idempotencyKey] = {
        "id": transaction_id, 
        **validated_data.model_dump()
    }

    return {
        "status": "SUCCESS", 
        "total": final_total, 
        "transactionId": transaction_id
    }
