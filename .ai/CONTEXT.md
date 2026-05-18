# SYSTEM CONTEXT: CSE323 Customer Ordering System (COS)

**Current Focus:** Final submission preparation — presentation deck integration, CI pipeline repair, and deliverables verification against the CSE323 rubric.

## 1. MANDATE: AI-NATIVE VERTICAL SLICING
- **Architecture:** Feature-Based Vertical Slicing (Mandated by CSE322/323 Curriculum).
- **Human Role:** Orchestrator (Architect & Reviewer).
- **AI Role:** Labor (Logic Generation within boundaries).
- **Protocol:** Test-Driven Prompting (TDP) - Failing test MUST precede implementation.

## 2. DIRECTORY STRUCTURE
- `src/frontend/`: React/Tailwind code (Vertical slices under `features/`).
- `src/backend/`: Python feature slices — payment & tickets — with pytest suites. Began as a Node/Express prototype; now majority Python (a few legacy `.js` files remain).
- `src/backend_python/`: Canonical FastAPI backend (standardized project core).
- `src/database/`: Prisma models and migrations.
- `docs/`: All project documentation.

## Documentation Architecture
- **Requirements & Design:** All Phase 1 and Phase 2 documentation for ALL team members is permanently located in `docs/requirements/`.
- **Logbooks:** Individual activity logs reside in `docs/logbook/`.
- **Architectural Rules:** Core system standards are in `docs/architecture_v2/`.
- **Vault Integrity:** The rogue directories `md/`, `Phase 1/`, and `Phase 2/` have been deleted. Do not reference them.

## 3. FEATURE OWNERSHIP (Consolidated Truth)
- **Member A (Khairy):** Checkout & Shopping Cart System + Product Catalog.
- **Member B:** Payment Features.
- **Member C:** Tickets / Support System.
- **Member D:** Admin & Order Fulfillment + Auth & User Management.

## 4. FEATURE SLICE STATUS

| Slice | Owner | Status | Last Completed Task | Blockers |
|---|---|---|---|---|
| checkout | Member A | 🟢 Complete | Sprint 2 + Checkout Button | None |
| auth | Member D | 🟢 Complete | Phase 4 Validation (FastAPI) | None |
| catalog | Member A | 🟡 In Progress | Ownership transferred; mock logic active | RFC-D001 approval |
| payment | Member B | 🟢 Complete | Phase 4 Validation (FastAPI Refactor) | None |
| tickets | Member C | 🟢 Complete | Phase 3 Implementation (10/10 tests) | None |
| orders | Member D | 🟢 Complete | Phase 4 Validation (FastAPI) | None |

---

## Execution Logs

### Member A: Sprint 1 & 2 (Checkout & Catalog)
**Date:** 2026-05-10
- **Status:** Complete.
- **Backend:** `src/backend/` (Node) provides mock product data and cart calculation.
- **Frontend:** Responsive grid and cart state management.
- **UI Lockdown:** 100% compliant with Centralized Component Library.

### Member B: Payment Features
**Date:** 2026-05-17
- **Status:** Phase 4 Complete.
- **Implementation:** Full migration to Python/FastAPI in `src/backend/features/payment/`.
- **Validation:** 70/20/10 Testing Pyramid achieved. 20 total tests passing across unit, integration, and E2E.
- **Design:** SSDs and Activity Diagrams cover idempotency and tax math boundaries.

### Member C: Ticket System
**Date:** 2026-05-11
- **Status:** Phase 3 Complete.
- **Implementation:** POST /api/v1/tickets with AI priority mapping (HuggingFace) and fallback logic.
- **Validation:** 10/10 integration and edge case tests passing.

### Member D: Admin, Orders, & Auth
**Date:** 2026-05-18
- **Status:** Phase 4 Complete.
- **Backend:** Robust FastAPI implementation in `src/backend_python/`.
- **Frontend:** React pages for Login, Register, Order List, and Inventory.
- **Validation:** Playwright POM suite and E2E specs for all admin/auth flows.

## Frontend Routing Architecture
The system is divided into 4 architectural zones, orchestrated via `react-router-dom` and the Dev-Cosmic UI library:
1. **Public Storefront:** Catalog browsing and product discovery.
2. **Checkout Funnel:** Session-based cart, shipping details, and payment processing.
3. **User Account:** Authenticated access to order history and account settings.
4. **Admin Panel:** Role-gated interface for fulfillment management and inventory control.

---

## UI Component Library
**Location:** `src/frontend/src/components/ui/`

### Components:
- `<Button>` / `<NeonButton>` - Standardized buttons with tap animations.
- `<Card>` / `<LiquidCard>` - Consistent glassmorphism containers.
- `<Input>` / `<TerminalInput>` - Standardized form fields.

### MANDATE:
All team members **MUST** use these library components. **DO NOT** use raw HTML tags or manual Tailwind classes for these basic elements.

---

## Git Branching Conventions
**Authority:** Scrum Master (Khairy)

| Prefix | Purpose |
|---|---|
| `feat/` | New feature work within a vertical slice |
| `bugfix/` | Non-urgent bug fix |
| `refactor/` | Internal code restructuring |
| `chore/` | Maintenance, docs, dependencies |
| `test/` | Automated tests only |
| `docs/` | Documentation-only changes |

### Rules
1. **Slice token required:** e.g. `feat/cart-checkout`.
2. **No direct push to main.**
3. **Rebase before merge.**

## UI Logic & Wire-up Finalization
**Date:** 2026-05-18
**Status:** Wiring Complete & Verified

### Technical Implementations:
- **`OrderDetailPage.jsx`:** Applied status normalization (uppercase) to ensure `LEGAL_NEXT` state transitions correctly render interactive `NeonButton` controls.
- **`StorefrontPage.jsx`:** 
    - Wired Hero Banner `[ ADD TO CART ]` to dynamic product lookup for the 'RTX 5090' ensuring functionality even if seed IDs shift.
    - Converted category filtering to case-insensitive mode to match the backend catalog taxonomy.
- **`CartPage.jsx`:** Implemented a non-blocking frontend promo code stub for "DISCOUNT10" with success/error feedback UI.

### Resolved Audit Issues:
- Hero banner interactivity restored.
- Category browse functionality enabled.
- Admin order status transitions unlocked.

## UI System Integration Finalization
**Date:** 2026-05-18
**Status:** 100% Interactive & Production-Ready

### Final Wire-ups:
- **Admin Orders:** Transition buttons are fully reactive.
- **Storefront:** Hero CTA and Category browsing are dynamic.
- **Cart:** Promo code validation stub active.
- **Backend Sync:** All frontend clients now route to port 8000 (FastAPI).

## Final Submission Sweep
**Date:** 2026-05-19
**Status:** In progress

### Completed
- **Presentation Deck:** Structured-block `PresentationDeck.jsx` + `presentationSlides.js` (17 slides) integrated on the `/presentation` route via a `Shell` wrapper that hides global chrome (TopNavBar/StatusBar) on the immersive route. Slide accent border pinned via a local inline style — no change to the global `LiquidCard`.
- **CI Pipeline:** `.github/workflows/playwright.yml` rewritten to run the Python Playwright POM suite (`pytest -m e2e`) instead of the mismatched JS runner; adds backend/frontend server-readiness waits. Best-effort — unverified against a live run.
- **Repo Cleanup:** Removed stale AI handoff files (`UI_AUDIT.md`, `state-transfer.md`, `ui issues.txt`, `.ai/handoff-to-claude.md`).
- Shipped on branch `feat/presentation-and-ci-fixes`.

### Deliverables audit (vs `docs/curriculum/` + `FINAL_DELIVERABLES.md`)
- Most rubric proof paths verified present.
- **Gap:** `tests/e2e/payment.spec.js` is referenced by `FINAL_DELIVERABLES.md` and the frontend `test:e2e` npm script but does not exist.
- **Stale paths in `FINAL_DELIVERABLES.md`:** tickets tests are at `src/backend/features/tickets/tests/`; frontend slices are at `src/frontend/src/features/`.
