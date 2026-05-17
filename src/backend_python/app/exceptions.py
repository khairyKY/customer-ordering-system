"""Domain exception classes + global exception handlers.

Services raise DomainError subclasses. The handlers below convert them into
consistent JSON responses without each route needing try/except.
"""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


# ─── Base + subclasses ──────────────────────────────────────────────────────

class DomainError(Exception):
    """Base for all domain errors. http_status + code are HTTP response data."""

    http_status: int = 400
    code: str = "DOMAIN_ERROR"

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


# Auth

class EmailAlreadyExistsError(DomainError):
    http_status = 409
    code = "EMAIL_EXISTS"

    def __init__(self):
        super().__init__("Email already registered")


class InvalidCredentialsError(DomainError):
    """Generic — used for wrong email AND wrong password (NFR-AU7)."""

    http_status = 401
    code = "INVALID_CREDENTIALS"

    def __init__(self):
        super().__init__("Invalid credentials")


class AccountLockedError(DomainError):
    http_status = 423
    code = "ACCOUNT_LOCKED"

    def __init__(self, minutes_remaining: int):
        super().__init__(f"Account locked. Try again in {minutes_remaining} minutes")


# Orders

class OrderNotFoundError(DomainError):
    http_status = 404
    code = "ORDER_NOT_FOUND"

    def __init__(self, order_id: str):
        super().__init__(f"Order not found: {order_id}")


class IllegalTransitionError(DomainError):
    http_status = 422
    code = "INVALID_TRANSITION"

    def __init__(self, from_status: str, to_status: str):
        super().__init__(f"Invalid status transition: {from_status} -> {to_status}")
        self.from_status = from_status
        self.to_status = to_status


# Inventory

class ProductNotFoundError(DomainError):
    http_status = 404
    code = "PRODUCT_NOT_FOUND"

    def __init__(self, product_id: str):
        super().__init__(f"Product not found: {product_id}")


# ─── Handler registration ───────────────────────────────────────────────────

async def _domain_handler(_: Request, exc: DomainError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.http_status,
        content={"error": exc.message, "code": exc.code},
    )


def register_handlers(app: FastAPI) -> None:
    app.add_exception_handler(DomainError, _domain_handler)
