# Meta-Architect Handoff: Migration to Claude (Antigravity IDE)
**Date:** 2026-05-13
**Current Branch:** main
**Status:** Sprint 2 Complete | Audit Pending Cleanup

## 1. System Architecture
- **Model:** Feature-Based Vertical Slicing.
- **Stack:** React 18 (Vite) + Node.js/Express (JavaScript) + Python/FastAPI.
- **Database:** Prisma (PostgreSQL) + SQLAlchemy.

## 2. UI Standards & Enforcement
- **Component Library:** src/frontend/src/components/ui/ (Button, Card, Input).
- **Styling:** Tailwind CSS + Framer Motion (animations).
- **Constraint:** 100% Component Library compliance. **NO raw HTML tags** (<button>, <input>, etc.) allowed in feature components. All buttons must use <Button>.

## 3. Priority 1: Surgical Documentation & Progress Patch
The repository is currently in a state of **Documentation Contradiction**. Claude must resolve these issues before continuing feature development:

### A. Auth Ownership Crisis
- **Conflict:** .ai/CONTEXT.md assigns uth to Member D. docs/phases/combined_phase1.md assigns it to Member C.
- **Code Status:** No physical auth implementation exists in src/.
- **Action:** Lockdown ownership to one member and initialize src/backend/features/auth/.

### B. Catalog Orphan State
- **Status:** Catalog code is functional but marked as unowned in CONTEXT.md.
- **Action:** Reassign to Member C or A.

### C. Missing Agile Logbooks
- **Audit Findings:** docs/logbook/ only contains Member D's entries.
- **Action:** Scaffold member_a_phase1_agile_logbook.md, member_b_..., and member_c_... to satisfy E-JUST rubric requirements.

## 4. Priority 2: Phase 4 Validation (Member A)
- **Requirement:** Implement and execute Playwright E2E tests for the Checkout slice.
- **File Path:** src/frontend/e2e/cart-flow.spec.js.
- **Target Loop:** Catalog -> Add to Cart -> Adjust Quantity -> Simulated Checkout.

## 5. Global Repository State
- **Root:** D:\coding\customer-ordering-system
- **Main Progress Docs:** .ai/CONTEXT.md, docs/global-progress-report.md, docs/audit-report.md.
- **Vertical Integrity:** All feature slices must be self-contained in their respective eatures/ directories.
