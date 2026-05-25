"""One-time script: populate image_url in catalog_seed.json.

Strategy (two-pass)
-------------------
Pass 1 — fast: plain HTTP GET + BeautifulSoup for og:image from manufacturer pages
         that serve static HTML (NVIDIA, ASUS, MSI, G.Skill, Razer…).

Pass 2 — JS pages: for any product that still has a placeholder after Pass 1, launch
         a Playwright/Chromium headless browser so JavaScript executes and og:image
         is present in the rendered DOM. Covers Corsair, Logitech.

Usage (from src/backend_python/):
    python -m scripts.fetch_product_images

Run once, commit catalog_seed.json, then reseed:
    python -m scripts.seed
"""

from __future__ import annotations

import json
import os
import sys
import time

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import requests
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

# ---------------------------------------------------------------------------
# Manufacturer / retailer product page URLs — keyed by exact product name.
# ---------------------------------------------------------------------------
PRODUCT_PAGES: dict[str, str] = {
    # NVIDIA
    "NVIDIA GeForce RTX 5090 Founders Edition": (
        "https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/"
    ),
    # ASUS
    "ASUS ROG Strix GeForce RTX 4080 Super": (
        "https://rog.asus.com/graphics-cards/graphics-cards/rog-strix/rog-strix-rtx4080s-o16g-gaming/"
    ),
    "ASUS ROG Swift OLED PG27AQDM": (
        "https://rog.asus.com/monitors/27-to-31-5-inches/rog-swift-oled-pg27aqdm/"
    ),
    "ASUS ROG Strix B650E-F Gaming WiFi": (
        "https://rog.asus.com/motherboards/rog-strix/rog-strix-b650e-f-gaming-wifi/"
    ),
    "ASUS TUF Gaming GeForce RTX 4090 OC": (
        "https://www.asus.com/motherboards-components/graphics-cards/tuf-gaming/tuf-rtx4090-o24g-gaming/"
    ),
    # MSI
    "MSI MEG Z790 GODLIKE": (
        "https://www.msi.com/Motherboard/MEG-Z790-GODLIKE"
    ),
    "MSI GeForce RTX 4080 Super Gaming X Slim": (
        "https://www.msi.com/Graphics-Card/GeForce-RTX-4080-SUPER-16G-GAMING-X-SLIM"
    ),
    # G.Skill
    "G.Skill Trident Z5 RGB 64GB (2x32GB) DDR5-6400": (
        "https://www.gskill.com/product/165/390/1655781413/F5-6400J3239G32GX2-TZ5RK"
    ),
    "G.Skill Trident Z5 RGB 32GB (2x16GB) DDR5-6000": (
        "https://www.gskill.com/product/165/374/1674817763/F5-6000J3038F16GX2-TZ5RK"
    ),
    # Corsair
    "Corsair Vengeance RGB 32GB (2x16GB) DDR5-6000": (
        "https://www.corsair.com/us/en/p/memory/cmh32gx5m2b6000c30/vengeance-rgb-ddr5-32gb-2x16gb-ddr5-dram-6000mhz-c30-memory-kit-black-cmh32gx5m2b6000c30"
    ),
    "Corsair iCUE H150i Elite LCD XT AIO": (
        "https://www.corsair.com/us/en/p/cpu-coolers/cw-9060071-ww/icue-h150i-elite-lcd-xt-display-liquid-cpu-cooler-cw-9060071-ww"
    ),
    "Corsair K100 RGB Mechanical Gaming Keyboard": (
        "https://www.corsair.com/us/en/p/keyboards/ch-912a01a-na/k100-rgb-mechanical-gaming-keyboard-ch-912a01a-na"
    ),
    "Corsair HS80 RGB Wireless Headset": (
        "https://www.corsair.com/us/en/p/gaming-headsets/ca-9011235-na/hs80-rgb-wireless-premium-gaming-headset-with-spatial-audio-ca-9011235-na"
    ),
    # Logitech
    "Logitech G Pro X Superlight 2": (
        "https://www.logitechg.com/en-us/products/gaming-mice/pro-x2-superlight-wireless-mouse.910-006632.html"
    ),
    "Logitech G502 X Plus": (
        "https://www.logitechg.com/en-us/products/gaming-mice/g502-x-plus-wireless-gaming-mouse.910-006164.html"
    ),
    "Logitech G Pro X 2 Lightspeed Gaming Headset": (
        "https://www.logitechg.com/en-us/products/gaming-audio/gpro-x2-gaming-headset.981-001260.html"
    ),
    "Logitech G915 TKL Wireless Gaming Keyboard": (
        "https://www.logitechg.com/en-us/products/gaming-keyboards/g915-tkl-wireless.920-009536.html"
    ),
    "Logitech G733 Lightspeed Wireless Headset": (
        "https://www.logitechg.com/en-us/products/gaming-audio/g733-rgb-wireless-headset.981-000864.html"
    ),
    "Logitech MX Master 3S": (
        "https://www.logitech.com/en-us/products/mice/mx-master-3s.910-006556.html"
    ),
    # Razer
    "Razer Huntsman V3 Pro": (
        "https://www.razer.com/gaming-keyboards/razer-huntsman-v3-pro"
    ),
    "Razer Basilisk V3 Pro": (
        "https://www.razer.com/gaming-mice/razer-basilisk-v3-pro/RZ01-04620100-R3U1"
    ),
    "Razer BlackWidow V4 Pro": (
        "https://www.razer.com/gaming-keyboards/razer-blackwidow-v4-pro/RZ03-04610100-R3U1"
    ),
}

# ---------------------------------------------------------------------------
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,*/*;q=0.9",
    "Accept-Language": "en-US,en;q=0.9",
}

SEED_PATH = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "..", "database", "catalog_seed.json")
)


def _is_placeholder(url: str | None) -> bool:
    if not url:
        return True
    return "placehold.co" in url or "placeholder" in url.lower()


def _load():
    with open(SEED_PATH, "r", encoding="utf-8") as fh:
        return json.load(fh)


def _save(catalog):
    with open(SEED_PATH, "w", encoding="utf-8") as fh:
        json.dump(catalog, fh, indent=2, ensure_ascii=False)


def _extract_og(html: str) -> str | None:
    soup = BeautifulSoup(html, "html.parser")
    for prop in ("og:image", "twitter:image", "og:image:url"):
        tag = soup.find("meta", property=prop) or soup.find("meta", attrs={"name": prop})
        if tag:
            content = tag.get("content", "").strip()
            if content.startswith("http"):
                return content
    return None


def _fetch_static(url: str) -> str | None:
    """Plain HTTP fetch — fast, no JS."""
    try:
        r = requests.get(url, headers=HEADERS, timeout=10, allow_redirects=True)
        if r.status_code == 200:
            return _extract_og(r.text)
    except Exception:
        pass
    return None


def _fetch_js(page, url: str) -> str | None:
    """Playwright page fetch — executes JavaScript, waits for og:image to appear."""
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=20_000)
        # Give JS a moment to inject meta tags
        page.wait_for_timeout(2000)
        content = page.evaluate("""() => {
            const selectors = [
                'meta[property="og:image"]',
                'meta[name="twitter:image"]',
                'meta[property="og:image:url"]',
            ];
            for (const sel of selectors) {
                const el = document.querySelector(sel);
                if (el && el.content && el.content.startsWith('http')) return el.content;
            }
            return null;
        }""")
        return content
    except PWTimeout:
        return None
    except Exception:
        return None


# ---------------------------------------------------------------------------

def run() -> None:
    if not os.path.exists(SEED_PATH):
        sys.exit(f"ERROR: catalog_seed.json not found at {SEED_PATH}")

    catalog = _load()
    pending = [p for p in catalog if _is_placeholder(p.get("image_url"))]
    already = len(catalog) - len(pending)

    print(f"catalog_seed.json: {len(catalog)} total | {already} already done | {len(pending)} to fetch\n")

    if not pending:
        print("All products already have real image URLs. Nothing to do.")
        return

    updated = 0
    failed  = 0

    # ---- Pass 1: static HTTP (fast) ----------------------------------------
    print("=== Pass 1: static HTTP ===")
    js_needed = []
    for product in pending:
        name = product["name"]
        url  = PRODUCT_PAGES.get(name)
        if not url:
            print(f"  NO_PAGE  {name[:55]}")
            js_needed.append(product)
            continue

        print(f"  {name[:52]}", end=" ... ", flush=True)
        img = _fetch_static(url)
        if img:
            product["image_url"] = img
            _save(catalog)
            updated += 1
            print(f"OK  {img[:65]}")
        else:
            js_needed.append(product)
            print("-> JS pass")
        time.sleep(0.3)

    # ---- Pass 2: Playwright for JS-heavy pages ------------------------------
    if js_needed:
        print(f"\n=== Pass 2: Playwright ({len(js_needed)} products) ===")
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            page    = browser.new_page()
            page.set_extra_http_headers({"Accept-Language": "en-US,en;q=0.9"})

            for product in js_needed:
                name = product["name"]
                url  = PRODUCT_PAGES.get(name)
                if not url:
                    print(f"  NO_PAGE  {name[:55]}")
                    failed += 1
                    continue

                print(f"  {name[:52]}", end=" ... ", flush=True)
                img = _fetch_js(page, url)
                if img:
                    product["image_url"] = img
                    _save(catalog)
                    updated += 1
                    print(f"OK  {img[:65]}")
                else:
                    failed += 1
                    print("FAILED")
                time.sleep(0.5)

            browser.close()

    print(f"\n{'=' * 60}")
    print(f"Done  updated={updated}  failed={failed}  already_had={already}")
    if failed:
        print(f"\n{failed} product(s) still have placeholders.")
        print("Re-run or manually update their image_url in catalog_seed.json.")
    print("\nNext steps:")
    print("  1. Spot-check a few image URLs in your browser")
    print("  2. git add src/database/catalog_seed.json && git commit")
    print("  3. Delete cos.db, then: python -m scripts.seed")


if __name__ == "__main__":
    run()
