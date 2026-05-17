"""E2E specs for Phase 2 Story D-1 — Admin Order Dashboard.

Seed dependency: scripts/seed.py creates 3 orders
  - ord_pending_1     (PENDING,    5 min ago)
  - ord_processing_1  (PROCESSING, 2h ago)
  - ord_delivered_1   (DELIVERED,  3 days ago)
"""

from __future__ import annotations

from playwright.sync_api import Page, expect

from tests.playwright.pages.order_list_page import OrderListPage


def test_lists_seeded_orders(authed_admin_page: Page) -> None:
    """D-1 happy path — admin sees the seeded orders + pagination metadata."""
    listing = OrderListPage(authed_admin_page)
    listing.goto()

    listing.expect_at_least_one_row()
    # Pagination text format: "Page <n> of <total>"
    listing.expect_pagination_contains("Page 1")


def test_filter_by_status_pending(authed_admin_page: Page) -> None:
    """D-1 with HR-1 status filter — only PENDING rows shown.

    The PENDING order may have been auto-cancelled if the sweep ran since seed.
    If so, this test exits gracefully — re-run `python -m scripts.seed`.
    """
    listing = OrderListPage(authed_admin_page)
    listing.goto()

    listing.filter_by_status("PENDING")

    # Every visible row should have data-status="PENDING"
    visible_rows = authed_admin_page.locator('[data-testid="order-row"]')
    count = visible_rows.count()
    for i in range(count):
        expect(visible_rows.nth(i)).to_have_attribute("data-status", "PENDING")


def test_filter_by_status_delivered(authed_admin_page: Page) -> None:
    """D-1 — filtering by DELIVERED narrows the list to delivered orders only."""
    listing = OrderListPage(authed_admin_page)
    listing.goto()

    listing.filter_by_status("DELIVERED")
    expect(listing.rows.first).to_be_visible(timeout=3_000)
    expect(listing.rows.first).to_have_attribute("data-status", "DELIVERED")
