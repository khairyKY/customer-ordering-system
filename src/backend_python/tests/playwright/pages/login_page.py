"""POM for /admin/login. Backs Phase 2 Story AU-2."""

from playwright.sync_api import Locator, expect

from .base_page import BasePage


class LoginPage(BasePage):
    def __init__(self, page) -> None:
        super().__init__(page)
        self.email_input: Locator    = page.locator('[data-testid="login-email"]')
        self.password_input: Locator = page.locator('[data-testid="login-password"]')
        self.submit_label: Locator   = page.locator('[data-testid="login-submit"]')
        self.error_message: Locator  = page.locator('[data-testid="login-error"]')

    def goto(self) -> None:
        self.goto_path("/admin/login")
        expect(self.email_input).to_be_visible()

    def fill_credentials(self, email: str, password: str) -> None:
        self.email_input.fill(email)
        self.password_input.fill(password)

    def submit(self) -> None:
        # Click the data-testid span; bubbles up to the parent <Button>
        self.submit_label.click()

    def expect_error_contains(self, text: str) -> None:
        expect(self.error_message).to_contain_text(text, ignore_case=True)

    def get_error_text(self) -> str:
        return (self.error_message.text_content() or "").strip()
