# Phase 4 — Playwright E2E (Python)

End-to-end tests for Member D's admin slice. Drive a real browser against the React frontend, hitting the Python FastAPI backend.

## One-time setup

```bash
cd src/backend_python
.venv\Scripts\activate                # Windows
# source .venv/bin/activate           # macOS/Linux
pip install -r requirements.txt
python -m playwright install chromium
```

## Before each run — start both servers + seed

```bash
# Terminal 1 — backend
cd src/backend_python
.venv\Scripts\activate
python -m scripts.seed                # idempotent
uvicorn app.main:app --reload --port 8000

# Terminal 2 — frontend
cd src/frontend
npm install                           # only first time
npm run dev                           # http://localhost:5173

# Terminal 3 — run the specs
cd src/backend_python
pytest tests/playwright/ -v -m e2e
```

## What's in here

| File | Phase 2 Gherkin scenarios covered |
|---|---|
| `specs/test_auth.py` | AU-1 happy register, AU-2 happy login, AU-2 NFR-AU7 byte-identical error, AU-2 NFR-AU6 lockout |
| `specs/test_orders_list.py` | D-1 happy list, D-1 filter-by-status |
| `specs/test_orders_status.py` | D-2 happy transition, D-2 illegal transition, D-3 detail with items + customer |
| `specs/test_inventory.py` | D-4 low-stock flag, D-5 happy stock update, D-5 upper-bound rejection |

## Configuration via env vars

| Var | Default | Notes |
|---|---|---|
| `PYTHON_API_BASE` | `http://localhost:8000/api/v1` | Where the FastAPI backend listens |
| `FRONTEND_BASE` | `http://localhost:5173` | Where the React dev server listens |

## Run subsets

```bash
pytest tests/playwright/specs/test_auth.py -v -m e2e
pytest tests/playwright/ -v -m e2e -k lockout
pytest tests/playwright/ -v -m e2e --headed                # see the browser
pytest tests/playwright/ -v -m e2e --slowmo=500            # slow down for debugging
pytest tests/playwright/ -v -m e2e --browser firefox       # different browser
```

## Why the `e2e` marker

`pytest -m "not e2e"` runs only unit + integration suites — fast, no browser needed.
`pytest -m e2e` runs only browser specs. Useful in CI for separate jobs.

## Seed dependency

The auth specs that exercise admin-only routes use `admin@example.com / admin123` from `scripts/seed.py`. The seed is idempotent — safe to re-run.

The order-list / order-detail tests depend on the 3 seeded orders. If the 15-min stale-pending sweep has cancelled the PENDING order during a long-running session, **re-run the seed** before re-running the specs.

## Why we don't use Playwright's `request_context` fixture

We use `httpx` instead via the `api_client` fixture. Reasons:
- `httpx` accepts `json=` kwarg directly; Playwright's APIRequestContext needs `data=json.dumps(...)`.
- We don't need cookie sharing between API and browser (JWT in `localStorage`, not cookies).
- One library, one mental model.
