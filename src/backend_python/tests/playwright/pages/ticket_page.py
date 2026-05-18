"""Ticket Page Object Model (customer ticket-creation form).

Converted from the JavaScript POM `TicketPage.pom.js`.
"""

from __future__ import annotations

import os

from playwright.sync_api import Page

FRONTEND_BASE = os.getenv("FRONTEND_BASE", "http://localhost:5173")


class TicketPage:
    """Selectors and actions for the customer ticket-creation page."""

    def __init__(self, page: Page) -> None:
        self.page = page
        self.subject_input = page.locator('input[name="subject"]')
        self.body_input = page.locator('textarea[name="body"]')
        self.submit_button = page.locator('button[type="submit"]')
        self.success_message = page.locator(".alert-success")
        self.error_message = page.locator(".alert-error")

    def navigate(self) -> None:
        self.page.goto(f"{FRONTEND_BASE}/tickets/new")

    def submit_ticket(self, subject: str, body: str) -> None:
        self.subject_input.fill(subject)
        self.body_input.fill(body)
        self.submit_button.click()
