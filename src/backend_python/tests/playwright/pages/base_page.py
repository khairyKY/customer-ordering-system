"""Shared base for all page objects — frontend navigation only."""

import os

from playwright.sync_api import Page

FRONTEND_BASE = os.getenv("FRONTEND_BASE", "http://localhost:5173")


class BasePage:
    """All POMs inherit. Subclasses override .goto() with the slice path."""

    def __init__(self, page: Page) -> None:
        self.page = page

    def goto_path(self, path: str) -> None:
        self.page.goto(f"{FRONTEND_BASE}{path}")
