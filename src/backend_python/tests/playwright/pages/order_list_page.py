"""POM for /admin/orders. Backs Phase 2 Story D-1."""

from typing import Literal

from playwright.sync_api import Locator, expect

from .base_page import BasePage

OrderStatus = Literal[
    "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED",
    "DELIVERED", "CANCELLED", "REFUNDED",
]


class OrderListPage(BasePage):
    def __init__(self, page) -> None:
        super().__init__(page)
        self.table: Locator           = page.locator('[data-testid="orders-table"]')
        self.rows: Locator            = page.locator('[data-testid="order-row"]')
        self.status_filter: Locator   = page.locator('[data-testid="status-filter"]')
        self.pagination_info: Locator = page.locator('[data-testid="pagination-info"]')
        self.next_button: Locator     = page.locator('[data-testid="page-next"]')
        self.prev_button: Locator     = page.locator('[data-testid="page-prev"]')

    def goto(self) -> None:
        self.goto_path("/admin/orders")
        expect(self.status_filter).to_be_visible()

    def filter_by_status(self, status: OrderStatus) -> None:
        # Playwright sync API exposes `expect_response` (context manager),
        # not `wait_for_response` — must wrap the action that triggers the fetch.
        with self.page.expect_response(
            lambda r: "/api/v1/orders" in r.url and r.status == 200,
            timeout=3000,
        ):
            self.status_filter.select_option(status)

    def click_row_by_status(self, status: OrderStatus) -> None:
        self.page.locator(
            f'[data-testid="order-row"][data-status="{status}"]'
        ).first.click()

    def click_first_row(self) -> None:
        self.rows.first.click()

    def expect_at_least_one_row(self) -> None:
        # Use first row visibility — `to_have_count` is finicky with seed-dependent data
        expect(self.rows.first).to_be_visible(timeout=5000)

    def expect_pagination_contains(self, text: str) -> None:
        expect(self.pagination_info).to_contain_text(text)
