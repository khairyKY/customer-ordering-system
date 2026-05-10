# 10 — Risk Management

## Risk Register

| Risk ID | Title | Likelihood | Impact | Severity | Owner |
|---|---|---|---|---|---|
| R-01 | Git merge conflicts | Medium | High | **HIGH** | All Members |
| R-02 | Grading rubric misalignment | Low | High | **MEDIUM** | Member A |
| R-03 | AI context desynchronization | High | Medium | **HIGH** | Member A |
| R-04 | Shared type contract breakage | Medium | High | **HIGH** | All Members |
| R-05 | Sprint scope creep | Medium | Medium | **MEDIUM** | Member A |
| R-06 | Test environment instability | Low | High | **MEDIUM** | All Members |
| R-07 | Team member contribution imbalance | Medium | Medium | **MEDIUM** | All Members |

---

## R-01 — Git Merge Conflicts

**Root Cause:** Merge conflicts arise when contributors modify the same file concurrently. Even under vertical slicing, shared files can conflict: `App.tsx` (routes), `schema.prisma` (all models), `docker-compose.yml`, and `package.json`.

### Structural Mitigations

**Route Registration Protocol:** `App.tsx` uses a route configuration array. Each member exports routes from their slice's `routes.ts`. `App.tsx` is never edited after Sprint 0.
```typescript
// App.tsx — untouched after Sprint 0
import { checkoutRoutes } from './features/checkout/routes';
import { catalogRoutes } from './features/catalog/routes';
import { authRoutes } from './features/auth/routes';
const allRoutes = [...authRoutes, ...catalogRoutes, ...checkoutRoutes];
```

**Schema Prisma Protocol:** Members never hand-edit `schema.prisma` directly. Each member runs `prisma migrate dev --name {slice}_{description}`. Schema PRs must not be in-flight simultaneously.

**Package.json Protocol:** Dependency changes require a dedicated PR: `chore(deps): add {package-name}`. No feature PR includes dependency changes.

### Process Mitigations

- Branch protection on `develop`: PRs required, no direct pushes.
- Rebase-before-merge policy: all feature branches rebase onto `develop` immediately before merging.
- Daily sync check at start of each work session:
  ```bash
  git fetch && git log HEAD..origin/develop --oneline
  ```

### Escalation Plan

If a conflict occurs in a shared file: (1) PR author calls both other members, (2) conflict resolved via screen share, (3) resolution documented in PR comments, (4) `CONTEXT.md` updated to reflect interface changes.

---

## R-02 — Grading Rubric Misalignment

**Root Cause:** The original rubric assigns points per layer. A grader might interpret vertical slicing as "Member A only did the frontend," threatening individual grades.

### Mitigations

- Section 2 of `MASTER.md` provides comprehensive academic justification.
- `docs/ADR-001-vertical-slicing.md` submitted as a one-page Architecture Decision Record.
- Member A's deliverable spans all three layers, independently satisfying all rubric dimensions.

### Rubric Mapping Table

| Rubric Item | Member A's Deliverable |
|---|---|
| UI (20 pts) | CartDrawer, CheckoutForm, ShippingForm, PaymentForm, OrderConfirmation |
| Business Logic (20 pts) | CartService, CheckoutService with full unit tests |
| Database (20 pts) | Cart, CartItem, Order, OrderItem, PromoCode + migrations 003 & 004 |
| Testing (20 pts) | Unit, integration, E2E — all in `checkout/__tests__/` |
| Documentation (20 pts) | MASTER.md + .ai/CONTEXT.md + inline JSDoc |

---

## R-03 — AI Context Desynchronization

**Root Cause:** When `.ai/CONTEXT.md` is not updated after a completed task, subsequent AI prompts receive stale information. The AI may generate code that imports non-existent modules, uses outdated signatures, or duplicates already-implemented logic. This is the most likely failure mode in AI-assisted development.

### Mitigations

- `CONTEXT.md` is updated as Step 8 of the TDP cycle — not an optional separate step.
- It is included in the same commit as the implementation (never a separate commit).
- CI linting checks that `CONTEXT.md`'s `Last Updated` timestamp is more recent than the last non-`CONTEXT.md` commit in the `checkout/` directory tree.

### Stale Context Detection

```bash
git log --oneline -10 -- src/frontend/src/features/checkout/ src/backend/src/features/checkout/
git log --oneline -1 -- .ai/CONTEXT.md
# CONTEXT.md commit should be the most recent
```

### Recovery Plan

If stale context causes AI to generate broken code: (1) update `CONTEXT.md`, (2) re-run the failing test, (3) run the TDP cycle again with updated context. The broken generated code is **discarded entirely** — never patched incrementally.

---

## R-04 — Shared Type Contract Breakage

**Root Cause:** If Member C changes the `Product` type (e.g., renames `imageUrl` to `image`), the checkout slice's `CartItem` type breaks silently — TypeScript may not catch this across file boundaries at compile time.

### Mitigations

**Contract Freeze Protocol:** Once a shared type is consumed by any other slice, it is frozen. Changes require an RFC documented in `CONTEXT.md` with a migration plan, approved by all dependent slice owners.

**TypeScript Project References:** Configure `tsconfig.json` project references so `checkout` slice compilation includes `shared` types. `tsc --build` in CI catches type breakages immediately.

**Interface Versioning:** If a breaking change is unavoidable, add the new version with a `V2` suffix (`ProductV2`). The old type gets a `@deprecated` JSDoc comment. Migration happens slice-by-slice over a defined timeline.

---

## R-05 — Sprint Scope Creep

**Root Cause:** The checkout feature is naturally adjacent to inventory, pricing, promotions, and loyalty programs. There is a risk of expanding scope beyond what is academically necessary.

### Mitigations

- Section 07 (Feature Scope) defines an explicit out-of-scope list.
- Any feature not in the in-scope list requires a formal scope change in `CONTEXT.md`, communicated to the team.
- If a sprint's remaining tasks cannot be completed, lowest-priority tasks move to Sprint 5 (Hardening buffer).
- The Playwright E2E test in S5-T1 is the immovable deadline anchor.

---

## R-06 — Test Environment Instability

**Root Cause:** Tests depending on a running database or network can be flaky (non-deterministically failing). Flaky tests erode confidence and slow development.

### Mitigations

**Hermetic Unit Tests:** All `CartService` and `CheckoutService` unit tests use `vitest.mock('@prisma/client')` to mock the database client. Unit tests never touch a real database.

**Test Database for Integration Tests:** Integration tests use a separate PostgreSQL database (`TEST_DATABASE_URL`) reset via `prisma migrate reset --force` before the integration suite runs. Automated in the CI workflow.

**Test Isolation:** Each test case that writes to the database wraps operations in a Prisma `$transaction` that is rolled back in test teardown.

---

## R-07 — Team Member Contribution Imbalance

**Root Cause:** Contribution imbalances can arise from workload differences, blockers, or communication breakdowns, affecting grade fairness and team dynamics.

### Mitigations

**Git Blame Transparency:** Vertical slicing means `git blame` on any file in `src/features/checkout/` shows Member A as the primary author. Built-in contribution attribution.

**CONTEXT.md as Activity Log:** Each `CONTEXT.md` update is timestamped and author-initialed, creating an implicit activity log supplementing `git log`.

**Sprint Review Checkpoints:** At the end of each sprint, all members share their completed task IDs in the team chat. Any member who has not completed sprint tasks by the checkpoint must document a blocker in `CONTEXT.md` and request help.
