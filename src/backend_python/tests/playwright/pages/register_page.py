"""POM for /admin/register. Backs Phase 2 Story AU-1."""

from playwright.sync_api import Locator, expect

from .base_page import BasePage


class RegisterPage(BasePage):
    def __init__(self, page) -> None:
        super().__init__(page)
        self.email_input: Locator    = page.locator('[data-testid="register-email"]')
        self.password_input: Locator = page.locator('[data-testid="register-password"]')
        self.submit_label: Locator   = page.locator('[data-testid="register-submit"]')
        self.error_message: Locator  = page.locator('[data-testid="register-error"]')

    def goto(self) -> None:
        self.goto_path("/admin/register")
        expect(self.email_input).to_be_visible()

    def fill_form(self, email: str, password: str) -> None:
        self.email_input.fill(email)
        self.password_input.fill(password)

    def submit(self) -> None:
        self.submit_label.click()

    def expect_error_contains(self, text: str) -> None:
        expect(self.error_message).to_contain_text(text, ignore_case=True)
