"""Payment Page Object Model.

Encapsulates UI selectors and actions for the Payment slice.
Converted from the JavaScript POM `tests/e2e/pages/payment.page.js`.
"""

from __future__ import annotations

import os

from playwright.sync_api import Page

FRONTEND_BASE = os.getenv("FRONTEND_BASE", "http://localhost:5173")


class PaymentPage:
    """Selectors and actions for the checkout/payment form."""

    def __init__(self, page: Page) -> None:
        self.page = page
        self.card_number_input = page.locator('input[name="cardNumber"]')
        self.expiry_input = page.locator('input[name="expiry"]')
        self.cvv_input = page.locator('input[name="cvv"]')
        self.promo_input = page.locator('input[name="promoCode"]')
        self.submit_button = page.locator('button[type="submit"]')
        self.success_message = page.locator(".payment-success")
        self.error_message = page.locator(".payment-error")
        self.total_display = page.locator(".total-amount")

    def goto(self) -> None:
        # Targets the single-form /payment view that mirrors this POM's
        # selectors (input[name="cardNumber"] etc.). The shipped purchase
        # flow at /checkout is a 7-step wizard with a different surface
        # area — see src/frontend/src/pages/QuickPaymentPage.jsx for the
        # rationale and the documented split.
        self.page.goto(f"{FRONTEND_BASE}/payment")

    def fill_payment_details(
        self,
        *,
        card_number: str,
        expiry: str,
        cvv: str,
        promo_code: str | None = None,
    ) -> None:
        self.card_number_input.fill(card_number)
        self.expiry_input.fill(expiry)
        self.cvv_input.fill(cvv)
        if promo_code:
            self.promo_input.fill(promo_code)

    def submit(self) -> None:
        self.submit_button.click()

    def get_final_total(self) -> str:
        return self.total_display.inner_text()
