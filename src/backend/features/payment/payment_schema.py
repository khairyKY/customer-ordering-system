from pydantic import BaseModel, Field, field_validator
import uuid
import re

class PaymentRequest(BaseModel):
    """
    REQ_EC_1, REQ_EC_2, REQ_EC_4 Padlocks
    Structurally impossible to violate boundaries at input layer.
    """
    amount: float = Field(..., gt=0, description="Amount must be positive (REQ_EC_1)")
    promoCode: str | None = Field(None, max_length=20, description="Max 20 characters")
    idempotencyKey: str = Field(..., description="REQ_EC_2: UUID format")
    cartTotal: float = Field(..., ge=0, description="Cart total cannot be negative (REQ_EC_2 Padlock)")

    @field_validator('amount')
    @classmethod
    def validate_amount_precision(cls, v: float) -> float:
        if round(v, 2) != v:
            raise ValueError('Max 2 decimal places')
        return v

    @field_validator('promoCode')
    @classmethod
    def validate_promo_code(cls, v: str | None) -> str | None:
        if v and not re.match(r'^[a-zA-Z0-9]*$', v):
            raise ValueError('Alphanumeric only')
        return v

    @field_validator('idempotencyKey')
    @classmethod
    def validate_idempotency_key(cls, v: str) -> str:
        try:
            uuid.UUID(v)
        except ValueError:
            raise ValueError('Invalid Idempotency Key format (REQ_EC_2)')
        return v
