"""Auth HTTP surface — register + login. Both are public (no auth required)."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas import (
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    UserPublic,
    UpdatePasswordRequest,
    ForgotPasswordRequest,
)
from app.services import auth_service
from app.dependencies import CurrentUser, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a customer account",
)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> RegisterResponse:
    user = auth_service.register(db, payload.email, payload.password)
    return RegisterResponse(user_id=user.id, email=user.email, role=user.role)


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Verify credentials and issue a JWT",
)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    user, token, expires_at = auth_service.login(db, payload.email, payload.password)
    return LoginResponse(
        token=token,
        expires_at=expires_at,
        user=UserPublic.model_validate(user),
    )


@router.put("/password/update", summary="Update user password")
def update_password(
    payload: UpdatePasswordRequest,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
) -> dict:
    auth_service.update_password(db, user.user_id, payload.current_password, payload.new_password)
    return {"status": "SUCCESS"}


@router.post("/password/forgot", summary="Forgot password mock endpoint")
def forgot_password(payload: ForgotPasswordRequest) -> dict:
    auth_service.forgot_password(payload.email)
    return {"status": "SUCCESS", "message": "If that email exists, a reset link has been sent."}
