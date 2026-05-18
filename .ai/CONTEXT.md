# SYSTEM CONTEXT: CSE323 Customer Ordering System (COS)

**Current Focus:** Global UI Component Standardization (One-Shot Library Lockdown) and Phase 4 Test Infrastructure setup.

## 1. MANDATE: AI-NATIVE VERTICAL SLICING
- **Architecture:** Feature-Based Vertical Slicing (Mandated by CSE322/323 Curriculum).
- **Human Role:** Orchestrator (Architect & Reviewer).
- **AI Role:** Labor (Logic Generation within boundaries).
- **Protocol:** Test-Driven Prompting (TDP) - Failing test MUST precede implementation.

## 2. DIRECTORY STRUCTURE
- `src/frontend/`: React/Tailwind code (Vertical slices under `features/`).
- `src/backend/`: Node/Express code (Legacy - being replaced by Python).
- `src/backend_python/`: FastAPI backend (Standardized project core).
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
