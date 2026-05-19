"""All Pydantic v2 request/response schemas.

Keep these in one file for quick navigation — there are < 30 of them total.
"""

import re
from datetime import datetime
from enum import Enum
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

# ─── Auth ───────────────────────────────────────────────────────────────────

RoleLiteral = Literal["customer", "agent", "admin"]


class RegisterRequest(BaseModel):
    email: EmailStr
    password: Annotated[str, Field(min_length=8, max_length=128)]


class LoginRequest(BaseModel):
    email: EmailStr
    password: Annotated[str, Field(min_length=1, max_length=128)]


class UserPublic(BaseModel):
    """The user shape every response uses. password_hash is intentionally absent."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    role: RoleLiteral


class RegisterResponse(BaseModel):
    user_id: str
    email: str
    role: RoleLiteral


class LoginResponse(BaseModel):
    token: str
    expires_at: datetime
    user: UserPublic


class UpdatePasswordRequest(BaseModel):
    current_password: str
    new_password: Annotated[str, Field(min_length=8, max_length=128)]


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


# ─── Orders ─────────────────────────────────────────────────────────────────

OrderStatusLiteral = Literal[
    "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED",
]


class UpdateStatusRequest(BaseModel):
    """Pydantic Literal rejects any non-enum value (blocks 'HACKED' attack)."""

    status: OrderStatusLiteral


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    product_id: str
    product_name: str
    quantity: int
    unit_price: float
    total_price: float


class OrderSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    status: str
    subtotal: float
    tax: float
    total: float
    placed_at: datetime


class OrderDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    status: str
    customer_id: str
    customer_email: str | None = None
    customer_phone: str | None = None
    subtotal: float
    discount: float
    tax: float
    shipping_cost: float
    total: float
    shipping_address: dict
    placed_at: datetime
    updated_at: datetime
    items: list[OrderItemOut]


class Pagination(BaseModel):
    page: int
    limit: int
    total_count: int
    total_pages: int


class OrderListResponse(BaseModel):
    orders: list[OrderSummary]
    pagination: Pagination


class StatusUpdateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    status: str
    updated_at: datetime


# ─── Inventory ──────────────────────────────────────────────────────────────

class UpdateStockRequest(BaseModel):
    """Padlocks: integer type via int annotation, ge=0 + le=100000 enforce bounds."""

    stock: Annotated[int, Field(ge=0, le=100_000, strict=True)]


class ProductOut(BaseModel):
    id: str
    name: str
    sku: str
    stock: int
    low_stock: bool


class InventoryListResponse(BaseModel):
    products: list[ProductOut]


# ─── Events ─────────────────────────────────────────────────────────────────

class PaymentSuccessEvent(BaseModel):
    """Phase 2 §5.4 cross-slice event contract."""

    order_id: Annotated[str, Field(min_length=1)]
    payment_id: Annotated[str, Field(min_length=1)]
    idempotency_key: Annotated[str, Field(min_length=1)]
    amount: Annotated[float, Field(ge=0)]
    occurred_at: datetime


class PaymentMethodCreate(BaseModel):
    card_number: Annotated[str, Field(min_length=13, max_length=19)]
    exp_month: int
    exp_year: int
    cvv: str
    brand: str = "VISA"


class PaymentMethodOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    brand: str
    last4: str
    exp_month: int
    exp_year: int
    is_default: bool


# ─── Tickets (Member C slice) ───────────────────────────────────────────────


class TicketPriority(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class TicketStatus(str, Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"


_SCRIPT_RE = re.compile(r"<script\b[^>]*>([\s\S]*?)</script>", re.IGNORECASE)
_ANY_TAG_RE = re.compile(r"<[^>]*>")


def sanitize_html(text: str) -> str:
    """Strip <script>…</script> blocks first, then any remaining HTML tags.

    Used by both request validation (`TicketBase.sanitize_fields`) and the
    service layer when raw strings need cleaning. Pure function: no IO.
    """
    text = _SCRIPT_RE.sub("", text)
    text = _ANY_TAG_RE.sub("", text)
    return text.strip()


class TicketBase(BaseModel):
    subject: Annotated[str, Field(min_length=5, max_length=120)]
    body: Annotated[str, Field(min_length=10, max_length=2000)]

    @field_validator("subject", "body")
    @classmethod
    def _sanitize(cls, v: str) -> str:
        return sanitize_html(v)


class TicketCreate(TicketBase):
    pass


class TicketUpdateStatus(BaseModel):
    status: TicketStatus


class Ticket(TicketBase):
    id: str
    userId: str
    priority: TicketPriority
    status: TicketStatus
    sentiment_source: str
    created_at: str
    updated_at: str | None = None


class TicketPagination(BaseModel):
    totalTickets: int
    totalPages: int
    currentPage: int
    limit: int


class TicketListResponse(BaseModel):
    tickets: list[Ticket]
    pagination: TicketPagination
