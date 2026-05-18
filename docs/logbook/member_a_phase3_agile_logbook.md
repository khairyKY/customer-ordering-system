# Phase 3 Agile Logbook — Member A (Khairy)
**Slice:** Checkout & Shopping Cart System + Catalog
**Phase:** 3 — Implementation
**Status:** ✅ Complete

> Reconstructed from git history and repository artifacts (2026-05-18). Verify against the slice owner's records before submission.

---

## Sprint Goals

| Sprint | Goal | Status |
|---|---|---|
| Sprint 1+2 | Ship the cart CRUD loop, product grid, and checkout button | ✅ Done |
| Sprint 3.1 | UI standardization sweep — adopt the centralized component library | ✅ Done |
| Sprint 3.2 | Absorb the catalog slice and consolidate documentation | ✅ Done |

**Phase 3 Objective:** Deliver the checkout/cart vertical slice as working code — UI, API, and store layer — and bring it into compliance with the centralized UI component library.

---

## Daily Standup Notes

### 2026-05-10 — Cart Loop Shipped
- **Done:** Express backend live; cart CRUD (`GET/POST/PUT/DELETE`) with stock validation and 10% tax recalculation; product grid with 6 mock items; "Proceed to Checkout" button with empty-cart guard.
- **Doing:** UI library compliance review.
- **Blockers:** None.

### 2026-05-13 — UI Standardization Sweep
- **Done:** 100% compliance with the `<Button>` / `<Card>` / `<Input>` component library across `ProductGrid.jsx`, `CartWidget.jsx`, `App.jsx`. Zero raw HTML tags remain in component files.
- **Doing:** Relocating rogue phase documentation.
- **Blockers:** None.

### 2026-05-15 — Repository Standardization
- **Done:** Rogue phase folders standardized and relocated (commit `chore(repo): standardize and relocate rogue phase documentation`).
- **Doing:** Absorbing the catalog slice per Scrum Master assignment.
- **Blockers:** TDP failing-test artifacts for cart/checkout not yet committed — audit-trail gap deferred to Phase 4 (see `combined_phase3.md` §1.4).

---

## Phase 3 Deliverables Checklist

- [x] Cart CRUD endpoints with stock validation — `src/backend/`
- [x] Product catalog endpoint — `GET /api/products`
- [x] Checkout button with empty-cart guard
- [x] UI component library — 100% compliance, zero raw HTML
- [x] 10% tax recalculated on every cart mutation
- [ ] TDP failing-test audit trail — deferred to Phase 4 (known gap)
