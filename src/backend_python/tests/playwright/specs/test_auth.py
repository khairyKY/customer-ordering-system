"""E2E specs for Phase 2 Stories AU-1 and AU-2.

Coverage:
- AU-1: Successful registration → /admin/login
- AU-2: Successful login persists JWT + redirects (customer → /, admin would → /admin/orders)
- AU-2 NFR-AU7: Wrong email and wrong password produce byte-identical error
- AU-2 NFR-AU6: 5 failed attempts → 6th with correct password fails with lockout
"""

from __future__ import annotations

import re
import uuid

from playwright.sync_api import Page, expect

from tests.playwright.pages.login_page import LoginPage
from tests.playwright.pages.register_page import RegisterPage


def _unique_email() -> str:
    return f"test-{uuid.uuid4().hex[:8]}@example.com"


# ─── Story AU-1 — Registration ─────────────────────────────────────────────

def test_happy_register_redirects_to_login(fresh_page: Page) -> None:
    """Successful registration sends the user to /admin/login."""
    register = RegisterPage(fresh_page)
    register.goto()

    register.fill_form(_unique_email(), "S3curePass!")
    register.submit()

    fresh_page.wait_for_url(re.compile(r".*/admin/login.*"), timeout=5_000)


def test_register_rejects_existing_email(fresh_page: Page, test_customer) -> None:
    """Trying to register an already-taken email surfaces a 409 error message."""
    register = RegisterPage(fresh_page)
    register.goto()

    register.fill_form(test_customer["email"], "AnotherP4ssword!")
    register.submit()

    register.expect_error_contains("already")


# ─── Story AU-2 — Login ────────────────────────────────────────────────────

def test_happy_customer_login_persists_jwt(fresh_page: Page, test_customer) -> None:
    """Successful customer login → land on / and JWT persisted."""
    login = LoginPage(fresh_page)
    login.goto()

    login.fill_credentials(test_customer["email"], test_customer["password"])
    login.submit()

    # Customer redirects to / (Member A's cart). Admin would go to /admin/orders.
    fresh_page.wait_for_url(re.compile(r".*/(?!admin).*"), timeout=5_000)
    token = fresh_page.evaluate("() => localStorage.getItem('jwt')")
    assert token and len(token) > 20, "JWT not persisted in localStorage"


def test_wrong_email_byte_identical_to_wrong_password(
    fresh_page: Page, test_customer
) -> None:
    """NFR-AU7 — user-enumeration defense.

    The error text shown for wrong-email and wrong-password must be byte-identical.
    """
    login = LoginPage(fresh_page)

    # Wrong password
    login.goto()
    login.fill_credentials(test_customer["email"], "wrong-password")
    login.submit()
    expect(login.error_message).to_be_visible()
    error_wrong_password = login.get_error_text()

    # Non-existent email
    login.goto()
    login.fill_credentials("ghost@example.com", "anything-1234")
    login.submit()
    expect(login.error_message).to_be_visible()
    error_wrong_email = login.get_error_text()

    assert error_wrong_password == error_wrong_email, (
        f"Generic-error contract broken: "
        f"'{error_wrong_password}' != '{error_wrong_email}'"
    )
    assert "invalid credentials" in error_wrong_password.lower()


def test_lockout_after_5_failed_attempts(fresh_page: Page, test_customer) -> None:
    """NFR-AU6 — 5 failures and the 6th attempt with the correct password fails."""
    login = LoginPage(fresh_page)

    for _ in range(5):
        login.goto()
        login.fill_credentials(test_customer["email"], "wrong-pw")
        login.submit()
        login.expect_error_contains("invalid credentials")

    # 6th attempt — correct password, but account is locked
    login.goto()
    login.fill_credentials(test_customer["email"], test_customer["password"])
    login.submit()
    login.expect_error_contains("locked")
