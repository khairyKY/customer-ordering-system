# Phase 1 Agile Logbook — Member A (Khairy)
**Slice:** Checkout & Shopping Cart System + Catalog (Reassigned 2026-05-16)
**Phase:** 1 — Requirement Discovery & Traceability
**Status:** ✅ Complete

---

## Sprint Goals

| Sprint | Goal | Status |
|---|---|---|
| Sprint 1 | Initialize Express backend, define cart API, establish frontend-backend communication | ✅ Done |
| Sprint 2 | Add product catalog endpoints, stock validation, quantity controls, and Checkout Button | ✅ Done |

**Phase 1 Objective:** Discover all actors, edge cases, and requirements for the Checkout & Shopping Cart vertical slice. Establish traceability from user stories to implementation plan.

---

## Daily Standup Notes

### 2026-05-10 — Sprint 1 Kickoff
- **Done:** Project initialized. Express server live at `localhost:3001`. `GET /api/cart` and `POST /api/cart/add` functional with in-memory store.
- **Doing:** Connecting frontend `CartWidget.jsx` to backend via Axios.
- **Blockers:** None.

### 2026-05-10 — Sprint 2 Complete
- **Done:** Product catalog endpoint (`GET /api/products` — 6 mock items). Cart now supports `PUT /update` and `DELETE /remove`. Stock validation enforced. Tax rate locked at 10%.
- **Doing:** UI compliance sweep — replacing raw `<button>` / `<input>` tags with component library.
- **Blockers:** None.

### 2026-05-10 — UI Standardization Sweep Complete
- **Done:** 100% compliance with `<Button>`, `<Card>` component library across `ProductGrid.jsx`, `CartWidget.jsx`, and `App.jsx`. Global search confirms zero raw HTML tags in component files.
- **Doing:** Writing Phase 1 requirements report.
- **Blockers:** None.

### 2026-05-13 — Phase 1 Requirements Published
- **Done:** `docs/requirements/requirements_report_member_a.md` published. Actor classifications, 5 edge cases (stale-cart ghost, price-hacker, double-clicker, invalid promo, address-overflow), and traceability matrix complete.
- **Doing:** Integrating into combined Phase 1 document.
- **Blockers:** None.

### 2026-05-16 — Catalog Ownership Absorbed
- **Done:** Scrum Master assigned Catalog slice to Member A. `productController.js` already serves 6 mock products — slice is functionally in progress.
- **Doing:** Updating CONTEXT.md and this logbook to reflect expanded ownership.
- **Blockers:** RFC-D001 from Member D (requests write access to `Product.stock`) — pending Member A sign-off.

---

## Phase 1 Deliverables Checklist

- [x] Actor classification (Primary, Supporting, Offstage) — see `combined_phase1.md §1.1`
- [x] 5 persona-driven edge cases identified — see `docs/requirements/member_a_edge_cases.md`
- [x] Traceability matrix (FE-01, BE-01, DB-01) — see `docs/requirements/requirements_report_member_a.md §3`
- [x] Functional requirements: `GET /api/cart`, `POST /api/cart/add`, `PUT /api/cart/update`, `DELETE /api/cart/remove`, `GET /api/products`
- [x] Tax rate global mandate confirmed: **10%**
- [x] UI component library established: `src/frontend/src/components/ui/`
- [ ] Formal Gherkin scenarios (optional for A-tier — DoD checklists serve as equivalent)
- [ ] Failing test artifacts committed (TDP Criterion 1 audit trail — deferred to Phase 4)
