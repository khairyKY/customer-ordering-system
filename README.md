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

### 2.1 Backend Engine (FastAPI)

#### Command Prompt (CMD) Setup
```cmd
# Navigate to the Python backend
cd src/backend_python

# Initialize environment
python -m venv .venv
.venv\Scripts\activate

# Install and Boot
pip install -r requirements.txt
python -m scripts.seed      # Populates product catalog
uvicorn app.main:app --port 8000 --reload
```

#### PowerShell Setup (Windows)
```powershell
# Navigate to the Python backend
cd src/backend_python

# Initialize environment
python -m venv .venv

# Enable script execution for this process (if blocked) and activate
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
.\.venv\Scripts\Activate.ps1

# Install requirements
pip install -r requirements.txt

# (Optional) Image Fetching & Playwright Setup
# The product catalog seed uses Playwright to fetch real product images from manufacturer websites.
# Install the headless Chromium dependency for Playwright:
playwright install chromium

# Run the image fetcher script to populate image URLs in catalog_seed.json:
python -m scripts.fetch_product_images

# Seed the database (replaces old cos.db if it exists)
python -m scripts.seed

# Boot Server
uvicorn app.main:app --port 8000 --reload
```

### 2.2 UI Interface (React)
```bash
# Navigate to the frontend
cd src/frontend

# Install and Boot
npm install
npm run dev -- --port 5173
```

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
