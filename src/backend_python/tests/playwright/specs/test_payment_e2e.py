"""E2E specs for the Payment slice (Pyramid: E2E layer).

Converted from `tests/e2e/payment.spec.js`. Drives a real browser against the
React frontend. Auto-marked `e2e` by tests/playwright/conftest.py.

Prereqs (see tests/playwright/README.md):
    - backend running on :8000, frontend dev server on :5173
    - `python -m playwright install chromium`
"""

from __future__ import annotations

from playwright.sync_api import Page, expect

from tests.playwright.pages.payment_page import PaymentPage

_VALID_CARD = {"card_number": "4242424242424242", "expiry": "12/26", "cvv": "123"}


def test_successful_standard_payment(page: Page) -> None:
    """Validation: success path — a standard payment is processed."""
    payment = PaymentPage(page)
    payment.goto()

    payment.fill_payment_details(**_VALID_CARD)
    payment.submit()

    expect(payment.success_message).to_be_visible()
    expect(payment.success_message).to_contain_text("Payment Successful")


def test_rejects_duplicate_submission(page: Page) -> None:
    """Validation: user trust — the submit button locks after the first click."""
    payment = PaymentPage(page)
    payment.goto()

    payment.fill_payment_details(**_VALID_CARD)
    payment.submit()

    # Optimistic-UI padlock: the button disables on the first click.
    expect(payment.submit_button).to_be_disabled()
    expect(payment.success_message).to_be_visible()


def test_validation_error_for_malformed_promo_code(page: Page) -> None:
    """Validation: clarity — a non-alphanumeric promo code is rejected."""
    payment = PaymentPage(page)
    payment.goto()

    payment.fill_payment_details(**_VALID_CARD, promo_code="INVALID-!@#")
    payment.submit()

    expect(payment.error_message).to_be_visible()
    expect(payment.error_message).to_contain_text("Alphanumeric only")
