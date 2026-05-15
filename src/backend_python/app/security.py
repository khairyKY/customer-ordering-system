"""Crypto primitives — password hashing + JWT.

Single source of truth. Routes/services import from here; nothing else touches passlib or jose.
"""

from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.settings import settings

_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=settings.BCRYPT_ROUNDS)


class TokenError(Exception):
    """Raised by verify_token. .code in {EXPIRED, INVALID}."""

    def __init__(self, message: str, code: str):
        super().__init__(message)
        self.code = code


def hash_password(plaintext: str) -> str:
    return _pwd.hash(plaintext)


def verify_password(plaintext: str, hashed: str) -> bool:
    return _pwd.verify(plaintext, hashed)


def sign_token(*, user_id: str, role: str) -> tuple[str, datetime]:
    """Sign a JWT. Returns (token, expires_at). Lifetime = settings.JWT_LIFETIME_SECONDS."""
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(seconds=settings.JWT_LIFETIME_SECONDS)
    payload = {
        "sub": user_id,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return token, expires_at


def verify_token(token: str) -> dict:
    """Return decoded payload or raise TokenError."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except jwt.ExpiredSignatureError as e:
        raise TokenError("Token expired", code="EXPIRED") from e
    except JWTError as e:
        raise TokenError("Invalid token", code="INVALID") from e

    for claim in ("sub", "role", "iat", "exp"):
        if claim not in payload:
            raise TokenError(f"Missing claim: {claim}", code="INVALID")

    return payload
