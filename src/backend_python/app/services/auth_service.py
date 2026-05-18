"""Auth domain logic — register, login, lockout enforcement."""

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.exceptions import (
    AccountLockedError,
    EmailAlreadyExistsError,
    InvalidCredentialsError,
)
from app.models import Role, User
from app.security import hash_password, sign_token, verify_password
from app.settings import settings


def register(db: Session, email: str, password: str) -> User:
    normalized = email.lower().strip()
    existing = db.execute(select(User).where(User.email == normalized)).scalar_one_or_none()
    if existing is not None:
        raise EmailAlreadyExistsError()

    user = User(
        email=normalized,
        password_hash=hash_password(password),
        role=Role.CUSTOMER.value,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def login(db: Session, email: str, password: str) -> tuple[User, str, datetime]:
    normalized = email.lower().strip()
    user = db.execute(select(User).where(User.email == normalized)).scalar_one_or_none()

    # Lockout short-circuit — skip bcrypt entirely (NFR-AU4 timing + defense)
    if user and user.locked_until and user.locked_until > datetime.now(timezone.utc):
        minutes_left = max(1, int((user.locked_until - datetime.now(timezone.utc)).total_seconds() / 60))
        raise AccountLockedError(minutes_left)

    # User-enumeration defense: same error for wrong email OR wrong password
    if user is None or not verify_password(password, user.password_hash):
        if user is not None:
            _record_failure(db, user)
        raise InvalidCredentialsError()

    # Success — clear counter, issue token
    user.failed_login_count = 0
    user.locked_until = None
    db.commit()

    token, expires_at = sign_token(user_id=user.id, role=user.role)
    return user, token, expires_at


def _record_failure(db: Session, user: User) -> None:
    user.failed_login_count += 1
    if user.failed_login_count >= settings.LOCKOUT_THRESHOLD:
        user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=settings.LOCKOUT_DURATION_MINUTES)
    db.commit()


def update_password(db: Session, user_id: str, current_password: str, new_password: str) -> None:
    user = db.get(User, user_id)
    if not user or not verify_password(current_password, user.password_hash):
        raise InvalidCredentialsError()
    user.password_hash = hash_password(new_password)
    db.commit()


def forgot_password(email: str) -> None:
    # Mock backend endpoint logging for Forgot Password flow
    import logging
    import uuid
    log = logging.getLogger(__name__)
    token = str(uuid.uuid4())
    log.info(f"MOCK_EMAIL_SEND: Reset token generated for {email}. Token: {token}")
