"""Triage Page Object Model (agent triage queue).

Converted from the JavaScript POM `TriagePage.pom.js`. The original JS had a
malformed `locator(...)` call in `updateStatus`; this version fixes it with a
correctly interpolated `data-ticket-id` selector.
"""

from __future__ import annotations

import os

from playwright.sync_api import Locator, Page

FRONTEND_BASE = os.getenv("FRONTEND_BASE", "http://localhost:5173")


class TriagePage:
    """Selectors and actions for the agent triage queue."""

    def __init__(self, page: Page) -> None:
        self.page = page
        self.ticket_rows = page.locator(".triage-row")
        self.priority_cells = page.locator(".priority-cell")
        self.status_dropdown = page.locator('select[name="status"]')

    def navigate(self) -> None:
        self.page.goto(f"{FRONTEND_BASE}/tickets/triage")

    def row_for(self, ticket_id: str) -> Locator:
        return self.page.locator(f'[data-ticket-id="{ticket_id}"]')

    def update_status(self, ticket_id: str, status: str) -> None:
        row = self.row_for(ticket_id)
        row.locator('select[name="status"]').select_option(status)

    def get_top_ticket_priority(self) -> str:
        return self.priority_cells.first.inner_text()
