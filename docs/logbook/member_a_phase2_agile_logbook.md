# Phase 2 Agile Logbook — Member A (Khairy)
**Slice:** Checkout & Shopping Cart System + Catalog
**Phase:** 2 — Design & Specification
**Status:** ✅ Complete

> Reconstructed from git history and repository artifacts (2026-05-18). Verify against the slice owner's records before submission.

---

## Sprint Goals

| Sprint | Goal | Status |
|---|---|---|
| Sprint 2.1 | Formalize persona edge cases into a requirements report | ✅ Done |
| Sprint 2.2 | Author the checkout UML Activity Diagram with decision points | ✅ Done |
| Sprint 2.3 | Lock the cart/catalog API contract and database schema | ✅ Done |

**Phase 2 Objective:** Translate the Phase 1 checkout/cart requirements into a concrete design — UML models, the checkout database schema, and a stable API contract for downstream consumers.

---

## Daily Standup Notes

### 2026-05-11 — Requirements Report Published
- **Done:** `docs/requirements/requirements_report_member_a.md` — actor classification and 5 AI-driven edge cases (ghost-inventory race, price-hacker injection, double-submission, invalid promo, address overflow).
- **Doing:** Drafting the checkout activity diagram.
- **Blockers:** None.

### 2026-05-13 — UML & Schema Drafted
- **Done:** Checkout UML Activity Diagram (Mermaid flowchart with auth / empty-cart / promo decision points) committed in `docs/requirements/member_a_edge_cases.md`. Checkout feature scope and database schema captured in `docs/architecture_v2/07-checkout-feature-scope.md` and `08-database-schema-checkout.md`.
- **Doing:** Finalizing the cart/catalog API contract.
- **Blockers:** None.

### 2026-05-14 — Ownership & API Contract Locked
- **Done:** Catalog ownership conflict resolved (commit `docs: resolve Auth and Catalog ownership conflicts`). Cart endpoints (`GET/POST/PUT/DELETE /api/cart*`) and `GET /api/products` confirmed as the public contract.
- **Doing:** Handing off to Phase 3 implementation.
- **Blockers:** None.

---

## Phase 2 Deliverables Checklist

- [x] Requirements report with actor classification — `requirements_report_member_a.md`
- [x] UML Activity Diagram with code decision points — `member_a_edge_cases.md`
- [x] Checkout feature scope — `architecture_v2/07-checkout-feature-scope.md`
- [x] Checkout database schema — `architecture_v2/08-database-schema-checkout.md`
- [x] Cart/catalog API contract (public surface defined)
- [x] Tax rate global mandate confirmed: **10%**
