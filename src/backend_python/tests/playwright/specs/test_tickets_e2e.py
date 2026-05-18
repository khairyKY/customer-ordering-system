"""E2E specs for the Tickets slice (Pyramid: E2E layer).

Converted from `src/frontend/features/tickets/tests/e2e/tickets.spec.js`.
Drives a real browser against the React frontend. Auto-marked `e2e` by
tests/playwright/conftest.py.
"""

from __future__ import annotations

from playwright.sync_api import Page, expect

from tests.playwright.pages.ticket_page import TicketPage
from tests.playwright.pages.triage_page import TriagePage


def test_customer_submits_valid_ticket(authed_customer_page: Page) -> None:
    """Customer submits a valid ticket and sees the success confirmation."""
    ticket_page = TicketPage(authed_customer_page)
    ticket_page.navigate()

    ticket_page.submit_ticket(
        "Valid Subject", "This is a valid ticket body of sufficient length."
    )

    expect(ticket_page.success_message).to_be_visible()
    expect(ticket_page.success_message).to_contain_text("Ticket created successfully")


def test_customer_submits_duplicate_ticket(authed_customer_page: Page) -> None:
    """A duplicate submission surfaces the duplicate-ticket error message."""
    ticket_page = TicketPage(authed_customer_page)
    ticket_page.navigate()

    ticket_page.submit_ticket("Duplicate Subject", "Body for duplicate test purpose.")
    expect(ticket_page.success_message).to_be_visible()

    ticket_page.submit_ticket("Duplicate Subject", "Body for duplicate test purpose.")
    expect(ticket_page.error_message).to_be_visible()
    expect(ticket_page.error_message).to_contain_text("Duplicate ticket")


def test_agent_views_triage_queue_sorted_by_priority(authed_agent_page: Page) -> None:
    """The agent triage queue surfaces the highest-priority ticket first."""
    triage_page = TriagePage(authed_agent_page)
    triage_page.navigate()

    top_priority = triage_page.get_top_ticket_priority()
    assert top_priority in ("CRITICAL", "HIGH")


def test_agent_updates_ticket_status(authed_agent_page: Page) -> None:
    """An agent advances a ticket from OPEN to IN_PROGRESS."""
    triage_page = TriagePage(authed_agent_page)
    triage_page.navigate()

    ticket_id = triage_page.ticket_rows.first.get_attribute("data-ticket-id")
    assert ticket_id, "expected at least one ticket row with a data-ticket-id"

    triage_page.update_status(ticket_id, "IN_PROGRESS")

    expect(
        triage_page.row_for(ticket_id).locator('select[name="status"]')
    ).to_have_value("IN_PROGRESS")
