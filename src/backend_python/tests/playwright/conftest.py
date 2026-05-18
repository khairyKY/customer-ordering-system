"""Shared fixtures for Phase 4 Playwright E2E specs.

Prereqs:
    pip install -r requirements.txt
    python -m playwright install chromium

Runtime (3 terminals):
    1. uvicorn app.main:app --reload --port 8000
    2. (in src/frontend) npm run dev   -> http://localhost:5173
    3. pytest tests/playwright/ -v -m e2e
"""

from __future__ import annotations

import json
import os
import uuid

import httpx
import pytest
from playwright.sync_api import Page

BACKEND_BASE = os.getenv("PYTHON_API_BASE", "http://localhost:8000/api/v1")
FRONTEND_BASE = os.getenv("FRONTEND_BASE", "http://localhost:5173")


# ─── HTTP setup helpers ─────────────────────────────────────────────────────

@pytest.fixture
def api_client():
    """httpx.Client targeted at the backend. Auto-closes."""
    with httpx.Client(base_url=BACKEND_BASE, timeout=10) as client:
        yield client


def _seeded_login(email: str, password: str, role_label: str) -> dict:
    """Login as a user that the seed script provisions; return the JSON body."""
    with httpx.Client(base_url=BACKEND_BASE, timeout=10) as c:
        r = c.post("/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, (
        f"{role_label} login failed ({r.status_code}). "
        f"Did you run `python -m scripts.seed`?"
    )
    return r.json()


@pytest.fixture(scope="session")
def admin_token() -> str:
    """Login as the seeded admin user. Requires `python -m scripts.seed`."""
    return _seeded_login("admin@example.com", "admin123", "Admin")["token"]


@pytest.fixture(scope="session")
def customer_token_and_user() -> tuple[str, dict]:
    """Login as the seeded customer user (used by the tickets E2E specs)."""
    body = _seeded_login("customer@example.com", "custPass!1", "Customer")
    return body["token"], body["user"]


@pytest.fixture(scope="session")
def agent_token_and_user() -> tuple[str, dict]:
    """Login as the seeded agent user (used by the triage E2E specs)."""
    body = _seeded_login("agent@example.com", "agntPass!1", "Agent")
    return body["token"], body["user"]


@pytest.fixture
def test_customer(api_client) -> dict[str, str]:
    """Register a fresh customer for this test; return credentials."""
    email = f"test-{uuid.uuid4().hex[:8]}@example.com"
    password = "S3curePass!"
    r = api_client.post(
        "/auth/register",
        json={"email": email, "password": password},
    )
    assert r.status_code == 201, f"Register failed: {r.status_code} {r.text}"
    return {"email": email, "password": password}


# ─── Browser page fixtures ──────────────────────────────────────────────────

@pytest.fixture
def fresh_page(page: Page) -> Page:
    """Page for tests that exercise the login flow.

    pytest-playwright already provides a fresh BrowserContext per test, so
    localStorage is empty at start. The previous implementation called
    `page.add_init_script("localStorage.clear()")`, which re-runs on EVERY
    navigation — including the one that follows a successful login — and
    wiped the JWT immediately after the app persisted it.
    """
    return page


@pytest.fixture
def authed_admin_page(page: Page, admin_token: str) -> Page:
    """Page with admin JWT pre-seeded in localStorage.

    The authStore reads JWT + user from localStorage on module init, so seeding
    both BEFORE the SPA boots makes us look fully logged-in immediately.
    """
    admin_user = {"id": "admin-seed", "email": "admin@example.com", "role": "admin"}
    init_script = (
        f"localStorage.setItem('jwt', {json.dumps(admin_token)});"
        f"localStorage.setItem('current_user', {json.dumps(json.dumps(admin_user))});"
    )
    page.add_init_script(init_script)
    return page


def _seed_localstorage(page: Page, token: str, user: dict) -> Page:
    init_script = (
        f"localStorage.setItem('jwt', {json.dumps(token)});"
        f"localStorage.setItem('current_user', {json.dumps(json.dumps(user))});"
    )
    page.add_init_script(init_script)
    return page


@pytest.fixture
def authed_customer_page(page: Page, customer_token_and_user) -> Page:
    """Page with the seeded customer JWT pre-seeded in localStorage."""
    token, user = customer_token_and_user
    return _seed_localstorage(page, token, user)


@pytest.fixture
def authed_agent_page(page: Page, agent_token_and_user) -> Page:
    """Page with the seeded agent JWT pre-seeded in localStorage."""
    token, user = agent_token_and_user
    return _seed_localstorage(page, token, user)


# ─── pytest configuration ──────────────────────────────────────────────────

def pytest_collection_modifyitems(config, items):
    """Auto-mark every spec in this folder with @pytest.mark.e2e."""
    for item in items:
        if "tests/playwright/" in item.nodeid.replace("\\", "/"):
            item.add_marker(pytest.mark.e2e)
