"""POM for /admin/orders/{id}. Backs Phase 2 Stories D-2, D-3."""

from playwright.sync_api import Locator, expect

from .base_page import BasePage


class OrderDetailPage(BasePage):
    def __init__(self, page) -> None:
        super().__init__(page)
        self.detail_container: Locator = page.locator('[data-testid="order-detail"]')
        self.total: Locator            = page.locator('[data-testid="order-total"]')
        self.customer_email: Locator   = page.locator('[data-testid="customer-email"]')
        self.customer_phone: Locator   = page.locator('[data-testid="customer-phone"]')
        self.items: Locator            = page.locator('[data-testid="order-item"]')
        self.terminal_state: Locator   = page.locator('[data-testid="terminal-state"]')

    def goto(self, order_id: str) -> None:
        self.goto_path(f"/admin/orders/{order_id}")
        expect(self.detail_container).to_be_visible(timeout=5000)

    def change_status_to(self, new_status: str) -> None:
        """Click the transition button + wait for the PATCH response.

        Playwright sync API exposes `expect_response` (context manager), not
        `wait_for_response` — must wrap the action that triggers the fetch.
        """
        with self.page.expect_response(
            lambda r: "/status" in r.url and r.request.method == "PATCH",
            timeout=3000,
        ):
            self.page.locator(f'[data-testid="transition-to-{new_status}"]').click()

    def expect_status_is(self, status: str) -> None:
        """The StatusBadge data-testid changes with the status; wait for the new one."""
        expect(
            self.page.locator(f'[data-testid="status-{status}"]').first
        ).to_be_visible(timeout=3000)

    def expect_transition_unavailable(self, status: str) -> None:
        """Asserts a transition button is NOT present (e.g. PENDING → SHIPPED is illegal)."""
        expect(
            self.page.locator(f'[data-testid="transition-to-{status}"]')
        ).to_have_count(0)
