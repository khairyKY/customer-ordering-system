"""Payment integration tests (Pyramid: Integration layer).

Converted from `tests/integration/payment.integration.test.js`. Exercises the
real Schema -> Controller -> Logic flow of the Python payment slice via
`process_payment`.

Note vs the JS original: the Python `process_payment` takes a flat dict and the
schema enforces a valid UUID `idempotencyKey`, so these tests use real UUIDs.
"""

import uuid

import pytest
from pydantic import ValidationError

from .payment_controller import process_payment


@pytest.mark.asyncio
async def test_flows_through_schema_controller_logic():
    """A valid request flows Schema -> Controller -> Logic and succeeds."""
    request = {
        "amount": 50.00,
        "idempotencyKey": str(uuid.uuid4()),
        "cartTotal": 50.00,
    }

    result = await process_payment(request)

    assert result["status"] == "SUCCESS"
    assert result["total"] == 55.00  # 50 * 1.10
    assert result["transactionId"]


@pytest.mark.asyncio
async def test_blocks_invalid_data_at_schema_boundary():
    """Invalid data is rejected at the schema boundary before reaching logic."""
    invalid_request = {
        "amount": -10,  # REQ_EC_1 violation — schema enforces amount > 0
        "idempotencyKey": str(uuid.uuid4()),
        "cartTotal": 100,
    }

    with pytest.raises(ValidationError):
        await process_payment(invalid_request)


@pytest.mark.asyncio
async def test_maintains_state_isolation_across_attempts():
    """Distinct payment attempts produce distinct transactions and totals."""
    req1 = {"amount": 10, "idempotencyKey": str(uuid.uuid4()), "cartTotal": 10}
    req2 = {"amount": 20, "idempotencyKey": str(uuid.uuid4()), "cartTotal": 20}

    res1 = await process_payment(req1)
    res2 = await process_payment(req2)

    assert res1["transactionId"] != res2["transactionId"]
    assert res1["total"] == 11.0
    assert res2["total"] == 22.0
