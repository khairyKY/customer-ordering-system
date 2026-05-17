"""POM for /admin/inventory. Backs Phase 2 Stories D-4, D-5."""

from playwright.sync_api import Locator, expect

from .base_page import BasePage


class InventoryPage(BasePage):
    def __init__(self, page) -> None:
        super().__init__(page)
        self.table: Locator        = page.locator('[data-testid="inventory-table"]')
        self.rows: Locator         = page.locator('[data-testid="product-row"]')
        self.modal: Locator        = page.locator('[data-testid="stock-modal"]')
        self.stock_input: Locator  = page.locator('[data-testid="stock-input"]')
        self.save_button: Locator  = page.locator('[data-testid="stock-save"]')
        self.stock_error: Locator  = page.locator('[data-testid="stock-error"]')

    def goto(self) -> None:
        self.goto_path("/admin/inventory")
        expect(self.table).to_be_visible(timeout=5000)

    def open_edit_modal(self, product_id: str) -> None:
        self.page.locator(f'[data-testid="edit-{product_id}"]').click()
        expect(self.modal).to_be_visible()

    def set_stock(self, value) -> None:
        self.stock_input.fill(str(value))

    def save(self) -> None:
        self.save_button.click()

    def stock_of(self, product_id: str) -> str:
        return (
            self.page.locator(f'[data-testid="stock-{product_id}"]').text_content() or ""
        ).strip()

    def expect_low_stock_badge(self, product_id: str) -> None:
        expect(
            self.page.locator(f'[data-testid="low-stock-{product_id}"]')
        ).to_be_visible()

    def expect_no_low_stock_badge(self, product_id: str) -> None:
        expect(
            self.page.locator(f'[data-testid="low-stock-{product_id}"]')
        ).to_have_count(0)

    def expect_modal_error_contains(self, text: str) -> None:
        expect(self.stock_error).to_contain_text(text, ignore_case=True)
