"""E2E specs for Phase 2 Stories D-2 and D-3.

D-2: Update order status (legal transition path + UI shows only legal next states)
D-3: View order detail — items, customer contact, shipping address
"""

from __future__ import annotations

from playwright.sync_api import Page, expect

from tests.playwright.pages.order_detail_page import OrderDetailPage
from tests.playwright.pages.order_list_page import OrderListPage


def test_order_detail_shows_items_and_customer(authed_admin_page: Page) -> None:
    """D-3 happy path — full order detail surfaces items, customer email, address."""
    detail = OrderDetailPage(authed_admin_page)
    detail.goto("ord_processing_1")

    # Items list non-empty (seed creates 2 items per order)
    expect(detail.items.first).to_be_visible()
    # Customer contact populated by seed
    expect(detail.customer_email).to_contain_text("@")
    # Status badge for PROCESSING is rendered
    detail.expect_status_is("PROCESSING")


def test_pending_order_only_shows_legal_transitions(authed_admin_page: Page) -> None:
    """Story D-2 + Phase 2 §3.2.2 transition matrix.

    From PENDING the UI must offer CONFIRMED and CANCELLED only.
    SHIPPED / PROCESSING / DELIVERED transitions must NOT be present.
    """
    detail = OrderDetailPage(authed_admin_page)
    detail.goto("ord_pending_1")

    # Legal: must be present
    expect(
        authed_admin_page.locator('[data-testid="transition-to-CONFIRMED"]')
    ).to_be_visible()
    expect(
        authed_admin_page.locator('[data-testid="transition-to-CANCELLED"]')
    ).to_be_visible()

    # Illegal: must NOT be present
    detail.expect_transition_unavailable("SHIPPED")
    detail.expect_transition_unavailable("PROCESSING")
    detail.expect_transition_unavailable("DELIVERED")


def test_pending_to_confirmed_happy_path(authed_admin_page: Page, api_client) -> None:
    """Story D-2 — admin advances PENDING → CONFIRMED via the UI.

    Idempotency: re-seed first to ensure a PENDING order exists. We avoid mutating
    state across tests by creating an order via SQL would be cleaner, but the
    current scope uses the seeded order. If this test runs second on a fresh seed,
    the previous run will have already moved ord_pending_1 — accept that.
    """
    detail = OrderDetailPage(authed_admin_page)
    detail.goto("ord_pending_1")

    # If the seed has been mutated, the status badge will already not be PENDING.
    # Bail out gracefully — the test is meaningful only on a fresh seed.
    current_pending = authed_admin_page.locator('[data-testid="status-PENDING"]')
    if current_pending.count() == 0:
        import pytest
        pytest.skip(
            "ord_pending_1 has already been transitioned this seed cycle. "
            "Re-run `python -m scripts.seed` to reset."
        )

    detail.change_status_to("CONFIRMED")
    detail.expect_status_is("CONFIRMED")


def test_delivered_order_has_no_outgoing_admin_transitions_to_pending(
    authed_admin_page: Page,
) -> None:
    """Phase 2 transition matrix — DELIVERED → PENDING is illegal regression.

    UI must NOT expose a button for it. Only DELIVERED → REFUNDED is legal.
    """
    detail = OrderDetailPage(authed_admin_page)
    detail.goto("ord_delivered_1")

    # The only legal exit from DELIVERED is REFUNDED
    expect(
        authed_admin_page.locator('[data-testid="transition-to-REFUNDED"]')
    ).to_be_visible()
    detail.expect_transition_unavailable("PENDING")
    detail.expect_transition_unavailable("PROCESSING")
    detail.expect_transition_unavailable("CANCELLED")


def test_clicking_view_from_list_navigates_to_detail(authed_admin_page: Page) -> None:
    """List + detail integration — clicking a row's View link lands on detail."""
    listing = OrderListPage(authed_admin_page)
    listing.goto()

    # Click "View →" on the first row by following its href
    first_link = authed_admin_page.locator('[data-testid="order-row"] a').first
    href = first_link.get_attribute("href")
    assert href and "/admin/orders/" in href

    first_link.click()
    authed_admin_page.wait_for_url(lambda url: "/admin/orders/" in url and url.split("/admin/orders/")[1])
