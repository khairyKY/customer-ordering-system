"""Unit tests for app/security.py — password hashing + JWT primitives.

Pure unit tests: exercise the crypto functions directly, no DB or HTTP.
"""

from datetime import datetime, timedelta, timezone

import pytest
from jose import jwt

from app.security import (
    TokenError,
    hash_password,
    sign_token,
    verify_password,
    verify_token,
)
from app.settings import settings


# ─── password hashing ───────────────────────────────────────────────────────

def test_hash_password_differs_from_plaintext():
    hashed = hash_password("S3curePass!")
    assert hashed != "S3curePass!"
    assert isinstance(hashed, str) and hashed


def test_hash_password_produces_bcrypt_hash():
    assert hash_password("anything").startswith("$2")


def test_verify_password_round_trip():
    hashed = hash_password("S3curePass!")
    assert verify_password("S3curePass!", hashed) is True


def test_verify_password_rejects_wrong_password():
    hashed = hash_password("S3curePass!")
    assert verify_password("wrong-password", hashed) is False


def test_hash_password_is_salted():
    # Same plaintext hashed twice yields different hashes (random salt).
    assert hash_password("samepw") != hash_password("samepw")


# ─── token signing ──────────────────────────────────────────────────────────

def test_sign_token_returns_token_and_expiry():
    token, expires_at = sign_token(user_id="u1", role="admin")
    assert isinstance(token, str) and token.count(".") == 2
    assert isinstance(expires_at, datetime)
    assert expires_at > datetime.now(timezone.utc)


def test_signed_token_round_trips_through_verify():
    token, _ = sign_token(user_id="u1", role="admin")
    payload = verify_token(token)
    assert payload["sub"] == "u1"
    assert payload["role"] == "admin"


def test_signed_token_carries_iat_and_exp():
    token, _ = sign_token(user_id="u2", role="customer")
    payload = verify_token(token)
    assert "iat" in payload and "exp" in payload


# ─── token verification failures ────────────────────────────────────────────

def test_verify_token_rejects_garbage():
    with pytest.raises(TokenError) as exc:
        verify_token("not-a-real-jwt")
    assert exc.value.code == "INVALID"


def test_verify_token_rejects_tampered_token():
    token, _ = sign_token(user_id="u1", role="customer")
    tampered = token[:-2] + ("aa" if not token.endswith("aa") else "bb")
    with pytest.raises(TokenError) as exc:
        verify_token(tampered)
    assert exc.value.code == "INVALID"


def test_verify_token_rejects_expired_token():
    past = datetime.now(timezone.utc) - timedelta(hours=1)
    expired = jwt.encode(
        {
            "sub": "u1", "role": "admin",
            "iat": int((past - timedelta(minutes=5)).timestamp()),
            "exp": int(past.timestamp()),
        },
        settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM,
    )
    with pytest.raises(TokenError) as exc:
        verify_token(expired)
    assert exc.value.code == "EXPIRED"


def test_verify_token_rejects_missing_claim():
    now = datetime.now(timezone.utc)
    incomplete = jwt.encode(
        {  # no 'role' claim
            "sub": "u1", "iat": int(now.timestamp()),
            "exp": int((now + timedelta(hours=1)).timestamp()),
        },
        settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM,
    )
    with pytest.raises(TokenError) as exc:
        verify_token(incomplete)
    assert exc.value.code == "INVALID"


def test_token_error_exposes_code():
    err = TokenError("boom", code="EXPIRED")
    assert err.code == "EXPIRED"
    assert str(err) == "boom"
