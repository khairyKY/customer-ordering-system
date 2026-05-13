# Phase 4 — Validation & Pipeline Engineering
## Team-Wide Combined Document

**Date:** 2026-05-13
**Curriculum Source:** `CSE323_Project_Overview.pdf` — Phase 4
**Scope:** Forward-looking plan. **No member has begun Phase 4.** This document consolidates targets, owner assignments, and dependencies so the team can execute it in parallel once Phase 3 is closed.

---

## Team Status

| Slice | Owner | Phase 4 Status |
|---|---|---|
| Checkout | Member A | ❌ Not Started |
| Payment | Member B | ❌ Not Started |
| Tickets + Auth | Member C | ❌ Not Started |
| Orders | Member D | ❌ Not Started |

**Phase 4 cannot begin per-slice until that slice's Phase 3 is closed.** Member B is the only one currently eligible.

---

# §1 — The Testing Pyramid

PDF requirement: *"Implement a suite following the 70 % Unit, 20 % Integration, and 10 % System/E2E ratio."*

---

## 1.1 Pyramid Allocation (Team-Wide)

```
                   ┌──────────────────┐
                   │   E2E (10 %)     │   ← Playwright + POM
                   │                  │       Cross-slice user journey
                   └──────────────────┘
              ┌────────────────────────────┐
              │     Integration (20 %)     │   ← Supertest / Vitest
              │                            │       Per-slice route + DB
              └────────────────────────────┘
        ┌──────────────────────────────────────┐
        │           Unit (70 %)                │   ← Vitest / Jest
        │                                      │       Per-slice service + util
        └──────────────────────────────────────┘
```

## 1.2 Per-Slice Test Target Counts

Based on each slice's documented FRs, ECs/HRs, and Gherkin scenarios:

| Slice | FRs+ECs | Estimated Unit (70%) | Estimated Integration (20%) | E2E Contribution (10%) |
|---|---|---|---|---|
| Checkout (A) | ~10 (cart + checkout core) | ~28 | ~8 | 4 (happy-path purchase) |
| Payment (B) | 4 padlocks + 5 REQ_EC = 9 | ~25 | ~7 | 3 (success / decline / promo) |
| Tickets (C) | 5 FR + 5 EC = 10 (TC-01..TC-10 already mapped) | ~28 | ~8 | 4 (create / triage / resolve / dedup) |
| Orders (D) | 12 FR (with .b) + 8 HR = 20 | ~56 | ~16 | 5 (list / status update / inventory / 422 illegal / sweep) |
| Auth (C) | TBD | ~14 | ~4 | 2 (login / token refresh) |
| **Total** | — | **~151** | **~43** | **~18** |

> Ratio check: 151 / (151+43+18) = **71 %** unit · 20 % integration · 8 % E2E. Within the PDF's 70/20/10 envelope.

---

# §2 — Automated Validation (Playwright + POM)

PDF requirement: *"Convert your Gherkin scenarios into executable Playwright scripts using the Page Object Model."*

---

## 2.1 Gherkin → Playwright POM Mapping

Each member's published Gherkin maps directly to a Playwright spec.

| Slice | Gherkin Source | Page Object(s) Required | Owner |
|---|---|---|---|
| Checkout | `09-sprint-roadmap-macro.md` (S5-T1 E2E) + Sprint 2 DoD | `CartPage`, `CheckoutPage`, `OrderConfirmationPage` | Member A |
| Payment | `md/phase2/Phase2_GherkinScripting.md` — 3 scenarios | `PaymentFormPage` (subset of `CheckoutPage`) | Member B |
| Tickets | `Phase 2/02a_GHERKIN_TEAM.md` — FR-01..05 + EC-01..05 | `TicketCreatePage`, `TicketListPage` (customer), `TriageQueuePage`, `TicketDetailPage` (agent) | Member C |
| Orders | `member_d_phase2_design.md` §1 — D-1..D-6 | `AdminLoginPage`, `OrderListPage`, `OrderDetailPage`, `InventoryPage` | Member D |
| Auth | TBD | `LoginPage`, `RegisterPage` | Member C |

## 2.2 Cross-Slice E2E Happy Path

A single Playwright spec that exercises the whole system. This is the **immovable deadline anchor** named in `docs/architecture_v2/09-sprint-roadmap-macro.md` (S5-T1).

```gherkin
Feature: End-to-end customer ordering journey

  Scenario: Customer browses, buys, gets confirmation, then admin fulfills order
    Given a customer is on the catalog page
    When they add "Mechanical Keyboard" to cart
    And they proceed to checkout
    And they enter shipping address
    And they submit payment with a valid card
    Then they see order confirmation with status "PENDING"
    When 1 minute later, the admin logs in
    And views the orders list
    Then the new order is visible at the top with status "PENDING"
    When the admin advances the status to "PROCESSING"
    Then the order status reflects "PROCESSING"
    And the audit log contains an entry with actor = "admin"
```

**Coverage:** This single test touches all four slices (catalog read, checkout, payment, orders admin). Co-ownership by Members A + B + C + D; Member A is suggested coordinator since checkout is the entry point.

---

# §3 — Verification vs Validation

PDF requirement: *"Document how your software not only 'works' (Verification) but 'solves the right problem' (Validation)."*

---

## 3.1 Verification (Did We Build It Right?)

Each slice provides verification evidence through its automated test suite. The artifacts that prove verification:

| Slice | Verification Evidence |
|---|---|
| Checkout | Sprint 1+2 DoD checklists in `architecture_v2/11-...md` and `12-...md`; live cart/product CRUD demonstrable |
| Payment | Phase 3 test results (4 tests green); idempotency demonstrable via curl/UI |
| Tickets | TC-01..TC-10 results (when committed); priority-mapping demonstrable with sample messages |
| Orders | T-D1..T-D6 results (when committed); transition matrix enforced via Phase 2 SSD-D2 422 path |

**Per-slice coverage targets** (per `04-tech-stack-and-dependencies.md` line coverage gates):
- Lines: ≥ 80 %
- Functions: ≥ 80 %
- Branches: ≥ 70 %

## 3.2 Validation (Did We Build the Right Thing?)

Validation is harder — it requires linking each feature back to a business goal and a real user persona.

| Slice | Original Business Problem | Validation Evidence |
|---|---|---|
| Checkout | "Customer can order food/products through a digital storefront" | Cross-slice E2E happy path runs from catalog → confirmation without manual intervention |
| Payment | "Money flows correctly, no double-charges, no negative-amount exploits, tax always 10 %" | REQ_EC_1..5 padlocks demonstrably block the malicious-student persona's attacks |
| Tickets | "Anxious shopper (Alex) gets quick acknowledgment with auto-prioritised triage" | EC-1..5 padlocks demonstrably handle Alex's behaviours B-1..B-5 |
| Orders | "Admin can run the fulfillment pipeline without race conditions or paid-but-cancelled bugs" | HR-1..HR-8 padlocks demonstrably prevent the frustrated-supervisor AND insider-attacker failure modes |

Each member is expected to write a 1-page **Validation Report** at end of Phase 4 mapping their slice's features back to user stories and demonstrating those stories execute.

---

# §4 — Pipeline Engineering (CI/CD)

Anchored in `docs/architecture_v2/05-git-and-branching-rules.md` and `10-risk-management.md`.

## 4.1 Branch Strategy
- `main` ← merge target for releases
- `develop` ← integration branch; all features land here first
- `feature/{slice}-{description}`, `test/{slice}-{description}`, `fix/{slice}-{description}`, `docs/{slice}-{description}`
- Direct push to `main` and `develop` blocked
- Rebase-before-merge mandatory
- Member D's slice currently pushes directly to `main` — should migrate to `develop` PRs per the established policy when teammates do

## 4.2 GitHub Actions Workflow (Planned)

```yaml
# .github/workflows/ci.yml — outline
name: CI
on:
  pull_request:
    branches: [develop, main]
jobs:
  branch-name-lint:
    runs-on: ubuntu-latest
    steps:
      - run: echo "${{ github.head_ref }}" | grep -E '^(feature|fix|test|refactor|chore|docs)/(checkout|cart|auth|catalog|orders|tickets|payment|shared|infra)-[a-z0-9-]{1,40}$'

  unit-tests:
    needs: [branch-name-lint]
    strategy:
      matrix:
        slice: [checkout, payment, tickets, orders, auth]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cd src/backend && npm ci
      - run: cd src/backend && npm test -- --testPathPattern="${{ matrix.slice }}"

  integration:
    needs: [unit-tests]
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env: { POSTGRES_DB: cos_test }
    steps:
      - uses: actions/checkout@v4
      - run: docker compose up -d db
      - run: cd src/backend && npx prisma migrate deploy
      - run: cd src/backend && npm run test:integration

  e2e:
    needs: [integration]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker compose up -d
      - run: cd src/frontend && npx playwright install --with-deps
      - run: cd src/frontend && npx playwright test
```

## 4.3 Required Status Checks Before Merge
- `branch-name-lint` ✅
- All slice unit suites ✅
- Integration ✅
- E2E happy path ✅
- Coverage ≥ thresholds (lines 80 / branches 70)
- `.ai/CONTEXT.md` updated (timestamp check)

---

# §5 — Owner Assignments

| Phase 4 Task | Suggested Owner | Dependency |
|---|---|---|
| Per-slice unit test backfill | Each slice owner | Their own Phase 3 closure |
| Per-slice integration tests | Each slice owner | Real Prisma + JWT (auth slice ship) |
| Page Object Model classes | Each slice owner | Their UI slice complete |
| Cross-slice E2E happy path (S5-T1) | **Member A** (entry point) | All slices' UIs functional |
| CI/CD workflow files (`.github/workflows/`) | **Member A** (project owner) | None |
| Coverage thresholds in `vitest.config.ts` | **Member A** | None |
| Validation reports (1 page per slice) | Each slice owner | Phase 4 testing complete |
| Final demo recording / submission package | **Member A** + all | Everything green |

---

# §6 — Phase 4 Exit Criteria

The project is **done** when:

- [ ] All slice unit suites ≥ 80 % line coverage, ≥ 70 % branch coverage
- [ ] Integration tests pass against real Prisma DB
- [ ] Cross-slice E2E happy path passes in CI
- [ ] All Gherkin scenarios from Phase 2 have a corresponding Playwright test
- [ ] Each slice owner has produced a 1-page Validation Report
- [ ] CI workflow blocks merges that violate any rule above
- [ ] `.ai/CONTEXT.md` reflects final state
- [ ] Combined Phase 4 document (this file) updated with actual execution evidence (replacing planning content)

---

# §7 — Risks & Open Questions for Phase 4

| Risk | Mitigation Plan |
|---|---|
| Auth slice not shipped → integration tests can't use real JWTs | Members B + D have mock-header shims; revisit when auth lands |
| Catalog slice unowned → product data may be hard-coded mocks | Decide whether tickets-or-payment owner absorbs catalog OR scope-cut catalog features |
| Multiple SSD notations (Mermaid for B, PlantUML for C, ASCII for D) | Phase 4 Validation Report should accept all three — no rewriting needed |
| Member A's TDP audit trail (Criterion 1) is missing | Backfill failing-test artifacts during Phase 4 instead of rebuilding |
| `git push origin main` is current pattern for Member D | Migrate to PRs against `develop` once branch protection is enabled in CI |

---

*End of Combined Phase 4 Document.*
*This document is a forward-looking plan and will be rewritten with execution evidence once Phase 4 actually begins.*
