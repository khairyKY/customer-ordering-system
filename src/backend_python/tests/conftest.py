"""Shared fixtures — fresh in-memory SQLite per test, full isolation."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base, get_db
from app.main import app


@pytest.fixture
def test_engine():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,  # share single connection across threads (FastAPI testclient)
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    engine.dispose()


@pytest.fixture
def session_factory(test_engine):
    return sessionmaker(bind=test_engine, autocommit=False, autoflush=False)


@pytest.fixture
def db(session_factory):
    session = session_factory()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(session_factory):
    """TestClient with the in-memory DB injected via dependency override."""

    def _override_get_db():
        s = session_factory()
        try:
            yield s
        finally:
            s.close()

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def admin_headers(client, db):
    """Create an admin user directly + login through HTTP, return Bearer header dict."""
    from app.models import Role, User
    from app.security import hash_password

    db.add(User(
        email="admin@example.com",
        password_hash=hash_password("admin123"),
        role=Role.ADMIN.value,
    ))
    db.commit()

    r = client.post("/api/v1/auth/login", json={
        "email": "admin@example.com", "password": "admin123",
    })
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


def _login_as(client, db, *, email: str, password: str, role: str) -> dict[str, str]:
    """Helper: register a user with the given role, log in, return Bearer header."""
    from app.models import Role, User
    from app.security import hash_password

    db.add(User(email=email, password_hash=hash_password(password), role=role))
    db.commit()
    r = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


@pytest.fixture
def customer_headers(client, db):
    from app.models import Role
    return _login_as(client, db, email="customer@example.com", password="custPass!1", role=Role.CUSTOMER.value)


@pytest.fixture
def customer2_headers(client, db):
    from app.models import Role
    return _login_as(client, db, email="customer2@example.com", password="custPass!2", role=Role.CUSTOMER.value)


@pytest.fixture
def agent_headers(client, db):
    from app.models import Role
    return _login_as(client, db, email="agent@example.com", password="agntPass!1", role=Role.AGENT.value)


@pytest.fixture
def jwt_user_id(client):
    """Decode the user_id out of a Bearer header (tests assert userId on tickets)."""

    def _decoder(headers: dict[str, str]) -> str:
        from app.security import verify_token
        token = headers["Authorization"].split(" ", 1)[1]
        return verify_token(token)["sub"]

    return _decoder


@pytest.fixture(autouse=True)
def _reset_tickets_storage():
    """Tickets storage is module-level in-memory; reset between every test."""
    from app.services.tickets_service import TicketService
    TicketService.reset()
    yield
    TicketService.reset()
