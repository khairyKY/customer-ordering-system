# Dev-Cosmic Ordering System (COS)
**E-JUST CSE323 Software Engineering Project**

## 1. System Overview
A high-fidelity, polyglot vertical slice e-commerce platform.
- **Frontend:** React 18 (Vite) + Dev-Cosmic UI Library.
- **Backend:** FastAPI (Python 3.11+) + SQLite.

## 2. Quick Start (Production Setup)

### 2.1 Prerequisites
- Python 3.11+
- Node.js 18+

### 2.2 Backend Initialization
```bash
cd src/backend_python
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
python -m scripts.seed      # Seeds 25 products
uvicorn app.main:app --port 8000 --reload
```

### 2.3 Frontend Initialization
```bash
cd src/frontend
npm install
npm run dev -- --port 5173
```

## 3. Architecture & Standards
- **Model:** Feature-Based Vertical Slicing.
- **Design System:** Dev-Cosmic (Liquid Glassmorphism).
- **Test Mandate:** 70/20/10 Testing Pyramid (Pytest + Playwright).

## 4. Documentation
All project artifacts (Traceability, SSDs, V&V Statements) reside in the `docs/` directory.
