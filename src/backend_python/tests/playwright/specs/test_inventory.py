"""E2E specs for Phase 2 Stories D-4 and D-5.

D-4: Low-stock flag — products with stock < 5 must show a LOW STOCK badge.
D-5: Update stock — happy path + client-side padlock enforcement (HR-4, NEG-4, NEG-5).

Seed dependency (catalog_seed.json):
    c1e9a2b0-7f3f-4c1c-9e9e-9e9e9e9e9e9e  stock=30   (Logitech G Pro X Superlight 2 — OK)
    c5e3a6b4-1f7f-8c5c-3e3e-3e3e3e3e3e3e  stock=3    (MSI MEG Z790 GODLIKE — LOW)
"""

from __future__ import annotations

from playwright.sync_api import Page, expect

from tests.playwright.pages.inventory_page import InventoryPage

# Stable catalog IDs
_HIGH_STOCK = "c1e9a2b0-7f3f-4c1c-9e9e-9e9e9e9e9e9e"  # stock=30
_LOW_STOCK  = "c5e3a6b4-1f7f-8c5c-3e3e-3e3e3e3e3e3e"  # stock=3


def test_low_stock_flag_visible_for_low_products(authed_admin_page: Page) -> None:
    """D-4 — MSI MEG Z790 GODLIKE (stock=3) shows the LOW STOCK badge."""
    inv = InventoryPage(authed_admin_page)
    inv.goto()

    inv.expect_low_stock_badge(_LOW_STOCK)


def test_high_stock_product_has_no_low_stock_badge(authed_admin_page: Page) -> None:
    """D-4 — Logitech G Pro X Superlight 2 (stock=30) shows no LOW STOCK badge."""
    inv = InventoryPage(authed_admin_page)
    inv.goto()

    inv.expect_no_low_stock_badge(_HIGH_STOCK)


def test_happy_stock_update_within_bounds(authed_admin_page: Page) -> None:
    """D-5 — admin updates stock to a valid value (50)."""
    inv = InventoryPage(authed_admin_page)
    inv.goto()

    inv.open_edit_modal(_LOW_STOCK)
    inv.set_stock(50)
    inv.save()

    # Modal closes, table reflects the new stock, no LOW badge anymore
    expect(inv.modal).to_have_count(0, timeout=3_000)
    assert inv.stock_of(_LOW_STOCK) == "50"
    inv.expect_no_low_stock_badge(_LOW_STOCK)


def test_rejects_stock_over_upper_bound(authed_admin_page: Page) -> None:
    """D-5 + HR-4 — entering 999_999 triggers the client-side cap (<=100000) message."""
    inv = InventoryPage(authed_admin_page)
    inv.goto()

    inv.open_edit_modal(_HIGH_STOCK)
    inv.set_stock(999_999)
    inv.save()

    # Modal stays open with the validation error
    expect(inv.modal).to_be_visible()
    inv.expect_modal_error_contains("100,000")


def test_rejects_negative_stock(authed_admin_page: Page) -> None:
    """D-5 + NEG-4 — entering -10 is blocked client-side before the request fires."""
    inv = InventoryPage(authed_admin_page)
    inv.goto()

    inv.open_edit_modal(_HIGH_STOCK)
    inv.set_stock(-10)
    inv.save()

    expect(inv.modal).to_be_visible()
    inv.expect_modal_error_contains(">= 0")
