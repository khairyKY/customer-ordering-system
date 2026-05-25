"""One-time script: populate image_url in catalog_seed.json.

Strategy (two-pass)
-------------------
Pass 1 — fast: plain HTTP GET + BeautifulSoup for og:image from manufacturer pages
         that serve static HTML (NVIDIA, ASUS, EVGA, Logitech, SteelSeries, WD, Noctua…).

Pass 2 — JS pages: for any product that still has a placeholder after Pass 1, launch
         a Playwright/Chromium headless browser so JavaScript executes and og:image
         is present in the rendered DOM. Covers AMD, Intel, Samsung, Corsair, GIGABYTE,
         G.Skill, Crucial, ZOTAC, Lian Li.

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
    # AMD — JS-rendered, will use Playwright
    "AMD Ryzen 9 7950X3D": (
        "https://www.amd.com/en/products/processors/desktop/ryzen-9/amd-ryzen-9-7950x3d.html"
    ),
    "AMD Ryzen 7 7800X3D": (
        "https://www.amd.com/en/products/processors/desktop/ryzen-7/amd-ryzen-7-7800x3d.html"
    ),
    # Intel — JS-rendered, will use Playwright
    "Intel Core i9-14900K": (
        "https://www.intel.com/content/www/us/en/products/sku/236772/"
        "intel-core-i9-processor-14900k-36m-cache-up-to-6-00-ghz/specifications.html"
    ),
    "Intel Core i7-14700K": (
        "https://www.intel.com/content/www/us/en/products/sku/236775/"
        "intel-core-i7-processor-14700k-33m-cache-up-to-5-60-ghz/specifications.html"
    ),
    # Motherboards
    "GIGABYTE X670E AORUS Master": (
        "https://www.gigabyte.com/Motherboard/X670E-AORUS-MASTER-rev-10"
    ),
    # Memory — Corsair uses JS; G.Skill uses JS
    "G.Skill Trident Z5 RGB 64GB (2x32GB) DDR5-6400": (
        "https://www.gskill.com/product/165/390/1655781413/F5-6400J3239G32GX2-TZ5RK"
    ),
    "Corsair Vengeance RGB 32GB (2x16GB) DDR5-6000": (
        "https://www.corsair.com/us/en/p/memory/cmh32gx5m2b6000c30/"
        "vengeance-rgb-ddr5-32gb-2x16gb-ddr5-dram-6000mhz-c30-memory-kit-black-cmh32gx5m2b6000c30"
    ),
    # Storage
    "Samsung 990 Pro 4TB NVMe SSD": (
        "https://semiconductor.samsung.com/us/consumer-storage/internal-ssd/990-pro/"
    ),
    "Crucial T705 2TB PCIe Gen5 NVMe SSD": (
        "https://www.crucial.com/ssd/t705/ct2000t705ssd3"
    ),
    # Peripherals
    "Logitech G Pro X Superlight 2": (
        "https://www.logitechg.com/en-us/products/gaming-mice/"
        "pro-x2-superlight-wireless-mouse.910-006632.html"
    ),
    # GPU
    "ZOTAC Gaming GeForce RTX 4070 Ti Super": (
        "https://www.zotac.com/us/product/graphics_card/"
        "zotac-gaming-geforce-rtx-4070-ti-super-16gb-gddr6x-trinity-oc"
    ),
    # PSU
    "EVGA SuperNOVA 1000 G7 PSU": (
        "https://www.evga.com/products/product.aspx?pn=220-G7-1000-X1"
    ),
    # Cases
    "Lian Li O11 Dynamic EVO Case": (
        "https://lian-li.com/product/pc-o11-dynamic-evo/"
    ),
    # Storage
    "Western Digital Black SN850X 2TB": (
        "https://www.westerndigital.com/products/internal-drives/wd-black-sn850x-nvme-ssd"
    ),
    # Coolers
    "Corsair iCUE H150i Elite LCD XT AIO": (
        "https://www.corsair.com/us/en/p/cpu-coolers/cw-9060071-ww/"
        "icue-h150i-elite-lcd-xt-display-liquid-cpu-cooler-cw-9060071-ww"
    ),
    # Monitors
    "ASUS ROG Swift OLED PG27AQDM": (
        "https://rog.asus.com/monitors/27-to-31-5-inches/rog-swift-oled-pg27aqdm/"
    ),
    # Keyboards
    "SteelSeries Apex Pro TKL (2023)": (
        "https://steelseries.com/gaming-keyboards/apex-pro-tkl"
    ),
    # Monitors
    "Samsung Odyssey Neo G9 G95NA": (
        "https://www.samsung.com/us/televisions-home-theater/monitors/odyssey/"
        "49-odyssey-neo-g9-dual-uhd-gaming-monitor-ls49cg954snxza/"
    ),
    # Coolers
    "Noctua NH-D15 Chromax Black": (
        "https://noctua.at/en/products/cpu-cooler-retail/nh-d15-chromax-black"
    ),
    # Demo products (PROD-001..006)
    "Wireless Mouse": (
        "https://www.logitechg.com/en-us/products/gaming-mice/g305-lightspeed-wireless-gaming-mouse.910-005280.html"
    ),
    "Mechanical Keyboard": (
        "https://www.corsair.com/us/en/p/keyboards/ch-9109114-na/k70-rgb-mk-2-mechanical-gaming-keyboard-ch-9109114-na"
    ),
    '27" Gaming Monitor': (
        "https://rog.asus.com/monitors/27-to-31-5-inches/rog-swift-pg279qm/"
    ),
    "USB-C Hub": (
        "https://www.anker.com/products/a8380-usb-c-hub"
    ),
    "Webcam HD": (
        "https://www.logitech.com/en-us/products/webcams/c920s-pro-hd-webcam.960-001257.html"
    ),
    "Noise-Cancelling Headset": (
        "https://www.steelseries.com/gaming-headsets/arctis-nova-pro-wireless"
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
