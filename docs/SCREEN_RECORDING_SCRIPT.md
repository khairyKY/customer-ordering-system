# Screen Recording Script — Final UI Demonstration

**Project:** CSE323 Customer Ordering System (COS)
**Target length:** ~8 minutes
**Recording tool:** any screen recorder (OBS / Xbox Game Bar / Loom)

## Pre-flight checklist (do before hitting record)

1. Backend running:
   ```powershell
   cd src\backend_python
   .\.venv\Scripts\activate
   python -m scripts.seed
   uvicorn app.main:app --reload --port 8000
   ```
2. Frontend running:
   ```powershell
   cd src\frontend
   npm run dev
   ```
3. Browser open at `http://localhost:5173`, window maximized, zoom 100%.
4. Have demo credentials ready: `admin@example.com / admin123` and
   `alice@example.com / Sup3rPass!`.
5. Clear browser `localStorage` (start logged out).

---

## Minute-by-minute script

### 0:00–0:30 — Intro
- **Say:** project name, team, that this is the COS final demo.
- **Show:** the storefront landing page.

### 0:30–1:30 — Public Storefront (Zone 1)
- **Click:** the Hero banner `[ ADD TO CART ]` button (adds the RTX 5090).
- **Say:** this is dynamic product lookup, resilient to seed-ID shifts.
- **Click:** a category filter chip — show case-insensitive category browsing.
- **Show:** the responsive product grid updating.

### 1:30–2:45 — Cart & Checkout (Zone 2)
- **Click:** the cart icon → open `CartPage`.
- **Action:** adjust an item quantity with the +/- controls.
- **Type:** promo code `DISCOUNT10` → **show** the success feedback UI.
- **Type:** an invalid promo (e.g. `INVALID-!@#`) → **show** the error feedback.
- **Click:** `Proceed to Checkout`.

### 2:45–3:45 — Payment (Member B slice)
- **Fill:** card `4242 4242 4242 4242`, expiry `12/26`, CVV `123`.
- **Click:** Submit → **show** the "Payment Successful" message.
- **Say:** the submit button locks on click — idempotent double-submit defense.

### 3:45–4:45 — Auth (Member D slice)
- **Click:** Register → create a new customer account.
- **Say:** mention Bcrypt hashing and HS256 JWT.
- **Action:** log out, then log in as `admin@example.com`.
- **Optional:** show a failed login → generic "Invalid credentials" (no user enumeration).

### 4:45–6:00 — Admin Panel (Zone 4, Member D slice)
- **Navigate:** to the Admin Orders list.
- **Click:** a status filter → show filter-by-status.
- **Click:** into an order → `OrderDetailPage` with items + customer.
- **Click:** a `NeonButton` status-transition control → show a legal transition.
- **Say:** illegal transitions are rejected by the backend transition matrix.

### 6:00–6:45 — Inventory
- **Show:** the Inventory page; point out a `low_stock` flagged product.
- **Action:** update a stock quantity → show the value persist.

### 6:45–7:30 — Security demo (optional but high-value)
- **Show:** a terminal `curl` POST with an email + password in the body.
- **Show:** the server log line — PII appears as `[REDACTED]`.
- **Show:** a `curl` POST containing "ignore all previous instructions" →
  the API returns `400 PROMPT_INJECTION_BLOCKED`.

### 7:30–8:00 — Wrap-up
- **Say:** recap the four zones and the vertical-slice ownership.
- **Show:** the FastAPI Swagger UI at `http://localhost:8000/docs`.
- **End** the recording.

---

## Tips
- Move the cursor slowly and pause ~1s after each click so the viewer can follow.
- If a seeded order was swept (15-min stale-pending sweep), re-run
  `python -m scripts.seed` before recording the Admin section.
- Record audio narration in one pass; do not stop/start mid-section.
