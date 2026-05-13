# Traceability Heatmap — Member D: Admin & Order Fulfillment

**Date:** 2026-05-13
**Owner:** Member D
**Curriculum Source:** `CSE323_Project_Overview.pdf` — Phase 1 "Traceability Heatmap"
**Purpose:** Mathematically prove every requirement maps backward to a Business Goal and forward to a Test, with **zero orphans**.

---

## Legend

| Symbol | Meaning |
|---|---|
| ✅ | Trace exists and is verifiable |
| 🟡 | Designed; test pending Phase 3 |
| ❌ | **ORPHAN** — missing trace (must be resolved before Phase 3) |
| ⛓ | Cross-slice dependency (requires RFC) |

---

## 1. Master Heatmap (Backward Trace: Test ← Feature ← FR ← BG)

| BG | Business Goal | FR | NFR(s) | Feature / Endpoint | Persona HR | Test IDs | Trace Status |
|---|---|---|---|---|---|---|---|
| **BG-1** | Operational visibility of orders | FR-D1 | NFR-D1, NFR-D2 | `GET /api/v1/orders` | HR-1 | T-D1.1 — T-D1.7 | 🟡 |
| **BG-1** | — | FR-D1.b | NFR-D1 | `GET /api/v1/orders?status=` | HR-1 | T-D1.8 — T-D1.9 | 🟡 |
| **BG-1** | — | FR-D3 | NFR-D1, NFR-D2 | `GET /api/v1/orders/:id` | HR-3 | T-D3.1 — T-D3.3 | 🟡 |
| **BG-1** | — | FR-D3.b | NFR-D2 | `GET /api/v1/orders/:id` (customer contact in payload) | HR-3 | T-D3.4 | 🟡 |
| **BG-2** | Order fulfillment lifecycle control | FR-D2 | NFR-D2, NFR-D3, NFR-D4 | `PATCH /api/v1/orders/:id/status` | — | T-D2.1 — T-D2.3 | 🟡 |
| **BG-2** | — | FR-D2.b | NFR-D2 | Empty-body guard on `PATCH .../status` | HR-5 | T-D2.4 | 🟡 |
| **BG-2** | — | FR-D2 | NFR-D4.b | Optimistic concurrency on `Order.updatedAt` | HR-6 | T-D2.5 | 🟡 |
| **BG-3** | Inventory accuracy | FR-D4 | NFR-D1, NFR-D2 | `GET /api/v1/inventory` | — | T-D4.1 — T-D4.3 | 🟡 |
| **BG-3** | — | FR-D5 | NFR-D2, NFR-D4 | `PATCH /api/v1/inventory/:id` ⛓ RFC-D001 | — | T-D5.1 — T-D5.4 | 🟡 |
| **BG-3** | — | FR-D5.b | NFR-D4 | Upper bound `stock ≤ 100,000` | HR-4 | T-D5.5 | 🟡 |
| **BG-2** | Fulfillment lifecycle (cross-slice) | FR-D6 | NFR-D3, NFR-D5 | Cron `sweepStalePending()` — 15-min auto-cancel ⛓ depends on Member B's `Payment` model | — | T-D6.1 — T-D6.2 | 🟡 |
| **BG-2** | — | FR-D6.b | NFR-D5 | Sweep checks `Payment.SUCCESS` → advance to CONFIRMED (closes HR-8) | HR-8 | T-D6.3 | 🟡 |
| **BG-2** | — | FR-D6 (event path) | NFR-D5 | `payment.success` event handler → PENDING → CONFIRMED ⛓ Member B emits event | — | T-D6.4 | 🟡 |

---

## 2. Forward Trace (BG → FR → Feature)

```
BG-1 (Operational visibility)
  ├─ FR-D1   ─▶ GET  /api/v1/orders
  ├─ FR-D1.b ─▶ GET  /api/v1/orders?status=
  ├─ FR-D3   ─▶ GET  /api/v1/orders/:id
  └─ FR-D3.b ─▶ GET  /api/v1/orders/:id  (customer contact fields)

BG-2 (Fulfillment lifecycle control)
  ├─ FR-D2   ─▶ PATCH /api/v1/orders/:id/status
  └─ FR-D2.b ─▶ PATCH /api/v1/orders/:id/status (empty body → 400)

BG-3 (Inventory accuracy)
  ├─ FR-D4   ─▶ GET   /api/v1/inventory
  ├─ FR-D5   ─▶ PATCH /api/v1/inventory/:id  ⛓ cross-slice (Member C)
  └─ FR-D5.b ─▶ PATCH /api/v1/inventory/:id (stock ≤ 100,000)
```

---

## 3. NFR Coverage Cross-Tab

| NFR | Covered By Features | Test Method |
|---|---|---|
| **NFR-D1** Performance (< 500ms p95) | All GET endpoints | Playwright `waitForSelector({ timeout: 500 })` |
| **NFR-D1.b** Optimistic UI w/ rollback | PATCH status, PATCH stock | Vitest unit on Zustand store rollback action |
| **NFR-D2** Admin-only access | ALL endpoints | Supertest 401/403 cases on each route |
| **NFR-D3** Audit logging on mutation | PATCH status | Unit test: status update writes to AuditLog model |
| **NFR-D4** Illegal transition guard | PATCH status | Unit test on `validateTransition()` matrix |
| **NFR-D4.b** Optimistic concurrency | PATCH status | Integration test: 2 concurrent writes → 409 |
| **NFR-D5** Idempotent status advancement | Cron sweep + `payment.success` handler | Integration test: replay same event/sweep twice → 0 duplicates |

---

## 4. Persona Hidden Requirement Traceability

| HR | Persona | Escalates To | Tested By |
|---|---|---|---|
| HR-1 | Frustrated Admin | FR-D1.b | T-D1.8, T-D1.9 |
| HR-2 | Frustrated Admin | NFR-D1.b | Frontend store unit test |
| HR-3 | Frustrated Admin | FR-D3.b | T-D3.4 |
| HR-4 | Malicious | FR-D5.b | T-D5.5 |
| HR-5 | Malicious | FR-D2.b | T-D2.4 |
| HR-6 | Malicious | NFR-D4.b | T-D2.5 |
| HR-7 | Malicious | Design rule (no DELETE endpoint) | Static check — endpoint absence in route table |
| HR-8 | Malicious — Cross-Slice | FR-D6.b + NFR-D5 | T-D6.3 (sweep advances paid stale order) + T-D6.4 (event idempotency) |

---

## 5. Orphan Audit

| Check | Result |
|---|---|
| Every FR has ≥1 Feature | ✅ |
| Every Feature has ≥1 Test | ✅ (all 🟡 — designed, pending Phase 3) |
| Every NFR has ≥1 Verifying Test | ✅ |
| Every Persona HR escalates to FR/NFR/Design Rule | ✅ |
| Every BG has ≥1 FR | ✅ |
| **Total Orphans** | **0** |

---

## 6. Cross-Slice Dependencies Surfaced

| Dependency | Counterparty | Status |
|---|---|---|
| ⛓ `PATCH /api/v1/inventory/:id` writes `Product.stock` | Member C (catalog) | **RFC-D001 pending approval** |
| ⛓ `protectRoute` / `adminGuard` middleware | Member B (auth slice — Phase 1 in progress) | Mock `x-mock-role` header until real middleware ships |
| ⛓ `Order` + `OrderItem` schema | Member A (checkout — Sprint 2 complete) | Read-only consumer; no schema modification |
| ⛓ `Payment` Prisma model (read-only) | Member B (payment slice — Phase 3 complete) | Consumed by `sweepStalePending()` to decide CANCELLED vs CONFIRMED |
| ⛓ Logical `payment.success` event | Member B (payment) | Event contract defined in Phase 2 §5.4; transport mechanism hidden |
| ⛓ 15-min stale-pending auto-cancel rule | Member B REQ_EC_5 mandate | Our slice **owns** the cron implementation |
| ⛓ Tax rate constant 10% | Member B Phase 1 Log (Global Mandate) | Resolved — no longer a blocker |

These dependencies are tracked in `.ai/CONTEXT.md` and the integration logbook entry. Active blockers remaining: RFC-D001 (catalog) + arrival of Member B's real `protectRoute` middleware.
