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
```bash
# Navigate to the Python backend
cd src/backend_python

# Initialize environment
python -m venv .venv
.venv\Scripts\activate

# Install and Seed
pip install -r requirements.txt
python -m scripts.seed      # Populates product catalog

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
