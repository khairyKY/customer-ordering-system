"""FastAPI deps — JWT verification + role gates.

Mirrors the Node middleware exports:
    protectRoute      → get_current_user
    adminGuard        → require_admin
    agentGuard        → require_agent
    customerGuard     → require_customer

Privilege hierarchy: admin >= agent >= customer.
"""

from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status

from app.security import TokenError, verify_token


@dataclass(frozen=True)
class CurrentUser:
    user_id: str
    role: str


def _extract_bearer(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "Authentication required", "code": "AUTH_REQUIRED"},
        )
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "Invalid Authorization header format", "code": "AUTH_HEADER_INVALID"},
        )
    return parts[1]


def get_current_user(authorization: Annotated[str | None, Header()] = None) -> CurrentUser:
    token = _extract_bearer(authorization)
    try:
        payload = verify_token(token)
    except TokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": str(e), "code": e.code},
        )
    return CurrentUser(user_id=payload["sub"], role=payload["role"])


def _role_gate(allowed: set[str]):
    def _dep(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if user.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"error": "Insufficient permissions", "code": "FORBIDDEN"},
            )
        return user

    return _dep


require_admin = _role_gate({"admin"})
require_agent = _role_gate({"agent", "admin"})
require_customer = _role_gate({"customer", "agent", "admin"})
