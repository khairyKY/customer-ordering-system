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


@pytest.fixture(scope="session")
def admin_token() -> str:
    """Login as the seeded admin user. Requires `python -m scripts.seed`."""
    with httpx.Client(base_url=BACKEND_BASE, timeout=10) as c:
        r = c.post(
            "/auth/login",
            json={"email": "admin@example.com", "password": "admin123"},
        )
    assert r.status_code == 200, (
        f"Admin login failed ({r.status_code}). Did you run `python -m scripts.seed`?"
    )
    return r.json()["token"]


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
    """Page with localStorage explicitly cleared. Use for tests that exercise login flow."""
    page.add_init_script("localStorage.clear()")
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


# ─── pytest configuration ──────────────────────────────────────────────────

def pytest_collection_modifyitems(config, items):
    """Auto-mark every spec in this folder with @pytest.mark.e2e."""
    for item in items:
        if "tests/playwright/" in item.nodeid.replace("\\", "/"):
            item.add_marker(pytest.mark.e2e)
