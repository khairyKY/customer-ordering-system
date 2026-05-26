# Dev-Cosmic Ordering System (COS)
**Production-Grade Vertical Slice E-Commerce Platform**

[![CI/CD Status](https://img.shields.io/badge/CI%2FCD-Playwright-brightgreen)](.github/workflows/playwright.yml)
[![Tech Stack](https://img.shields.io/badge/Stack-FastAPI%20%2B%20React-blue)](https://fastapi.tiangolo.com/)

## 1. Project Overview
The Dev-Cosmic Ordering System (COS) is a high-fidelity, polyglot hardware retail platform designed for E-JUST CSE323. It utilizes a **Feature-Based Vertical Slicing** architecture to ensure modular ownership and 100% design consistency via a centralized design system.

### Core Architecture
- **Frontend:** React 18 + Vite + Tailwind CSS + Framer Motion.
- **Backend:** FastAPI (Python 3.11+) + SQLAlchemy + SQLite.
- **Security:** Pure-ASGI Semantic Perimeter Defense + PII Redaction Middleware.
- **Validation:** 70/20/10 Testing Pyramid (Pytest & Playwright POM).

---

## 2. Quick Start (Local Setup)

> **What gets shipped in the repo:**
> The product catalog (including all 22 product names, prices, specs **and verified image URLs**) lives in [`src/database/catalog_seed.json`](src/database/catalog_seed.json) and is committed. The seed script loads it into a fresh SQLite DB (`cos.db`).
>
> `cos.db` itself is **not** committed (it's in `.gitignore`) — every contributor builds their own from the seed file. This guarantees that every fresh clone gets the same product images and specs that the rest of the team sees.

### 2.1 Backend Engine (FastAPI)

> **First time on a clean clone?** Skip to `requirements.txt`.
> **Pulling new changes onto an existing checkout?** **Delete `cos.db` first** — the model schema evolves with the codebase, and a stale DB will silently keep old data and an old schema (rows already there are never overwritten by `_ensure_product`). Always delete + reseed after a pull that touches `app/models.py` or `catalog_seed.json`.

#### Command Prompt (CMD)
```cmd
cd src/backend_python

:: First-time setup
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

:: Reset and seed the database
if exist cos.db del cos.db
python -m scripts.seed
:: Expected output: "INFO loaded 22 products from catalog_seed.json"

:: Boot the API on :8000
uvicorn app.main:app --port 8000 --reload
```

#### PowerShell (Windows)
```powershell
cd src/backend_python

# First-time setup
python -m venv .venv
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Reset and seed the database
Remove-Item -Force cos.db -ErrorAction SilentlyContinue
python -m scripts.seed
# Expected output: "INFO loaded 22 products from catalog_seed.json"

# Boot the API on :8000
uvicorn app.main:app --port 8000 --reload
```

#### Bash / WSL / macOS / Linux
```bash
cd src/backend_python

# First-time setup
python -m venv .venv
source .venv/bin/activate          # Windows Git-Bash: source .venv/Scripts/activate
pip install -r requirements.txt

# Reset and seed the database
rm -f cos.db
python -m scripts.seed
# Expected output: "INFO loaded 22 products from catalog_seed.json"

# Boot the API on :8000
uvicorn app.main:app --port 8000 --reload
```

### 2.2 UI Interface (React)
```bash
cd src/frontend
npm install
npm run dev          # serves on http://localhost:5173 by default
```

### 2.3 Sanity Check — are images really loading?

With both servers running, hit the catalog endpoint:

```bash
curl http://127.0.0.1:8000/api/v1/products | python -m json.tool | head -20
```

Every product's `image_url` should point to a real manufacturer or retailer CDN (e.g. `dlcdnwebimgs.asus.com`, `resource.logitechg.com`, `assets.corsair.com`, `c1.neweggimages.com`, `notebookcheck.net`). If you see `placehold.co` URLs, your DB is out of date — go back and run the **delete `cos.db` + reseed** step above.

Open http://localhost:5173/ and the storefront should render product cards with real photos, not grey placeholder boxes.

### 2.4 Optional — re-running the image fetcher

You only need [`scripts/fetch_product_images.py`](src/backend_python/scripts/fetch_product_images.py) if you've **added new products** to `catalog_seed.json` and want it to auto-scrape their `og:image` from manufacturer pages. The script needs Playwright's headless Chromium:

```bash
playwright install chromium
python -m scripts.fetch_product_images
```

It writes results back into `catalog_seed.json`. Commit the JSON, then everyone else's next seed picks up the new URLs automatically — no need for them to run the fetcher themselves.

---

## 2.5 Default seed accounts

The seed populates four accounts so you can log in immediately:

| Email                    | Password    | Role     |
|--------------------------|-------------|----------|
| `admin@example.com`      | `admin123`  | admin    |
| `alice@example.com`      | `Sup3rPass!`| customer |
| `customer@example.com`   | `custPass!1`| customer |
| `agent@example.com`      | `agntPass!1`| agent    |

---

## 3. Operational Zones (4-Zone Routing)
The application is logically segmented into four distinct operational sectors:

1.  **🌌 Public Storefront:** Product discovery, high-fidelity catalog browsing, and hero CTAs.
2.  **🛒 Checkout Funnel:** Session-based cart management, tax calculation (10%), and secure payment handoff.
3.  **👤 User Account:** Secure HS256 JWT-authenticated access to order history and profile settings.
4.  **🛡️ Admin Panel:** Role-gated interface for order fulfillment, inventory management, and system auditing.

---

## 4. Academic Compliance
This project satisfies all requirements for the CSE323 final deliverable. All design artifacts (SSDs, Activity Diagrams, Traceability Heatmaps) are located in the `docs/` directory.
