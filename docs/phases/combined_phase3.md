# Phase 3 — Test-Driven Implementation
## Team-Wide Combined Document

**Date:** 2026-05-13
**Curriculum Source:** `CSE323_Project_Overview.pdf` — Phase 3
**Scope:** Unified view of every team member's TDP implementation: failing tests, padlocks, iteration log, vertical slicing.

---

## Team Status

| Slice | Owner | Phase 3 Status | Source |
|---|---|---|---|
| Checkout | Member A | ✅ Sprints 1+2 shipped (in-memory) | `.ai/CONTEXT.md` L20–94; live code in `src/backend/controllers/`, `src/frontend/src/components/` |
| Payment | Member B | ✅ Phase 3 Complete (TDP — 4 criteria) | `md/phase3/Phase3_01..04_*.md` |
| Tickets + Auth | Member C | ❌ Not Started (TC-01..TC-10 defined in Phase 1 but no failing tests committed) | — |
| Orders | Member D | ⚠️ Failing test authored (uncommitted) — implementation pending | `src/backend/features/orders/__tests__/orderRoutes.test.js` (local only) |

---

# §1 — Failing Tests (Criterion 1: Mathematical Boundary)

PDF Rubric Standard: *"Failing unit tests written before implementation; tests establish a clear mathematical boundary."*

---

## 1.1 Payment Failing Tests — Member B

*Source: `md/phase3/Phase3_01_failing_tests.md`*

Four tests written before any implementation. `calculateTotal()` and `processPayment()` did not exist when these were authored.

```javascript
test('REQ_PAY_01: Calculates final total with exactly 10% tax', () => {
  expect(calculateTotal(100.00, 0)).toBe(110.00);   // 100 + (100 * 0.10)
});

test('REQ_EC_1: Blocks processing if the cart subtotal is negative', () => {
  expect(() => calculateTotal(-10.00, 0)).toThrow('InvalidAmountError');
});

test('REQ_EC_4: Enforces a $0.00 floor when discounts exceed the subtotal', () => {
  // Max(0, 40 - 50) = 0; 0 * 1.10 = 0
  expect(calculateTotal(40.00, 50.00)).toBe(0.00);
});

test('REQ_EC_2: Prevents double charges via Idempotency Key matching', async () => {
  const secondCall = await processPayment(duplicatePaymentData);
  expect(secondCall.isDuplicate).toBe(true);
});
```

### Boundary Summary
| Test ID | Boundary | Input | Expected Output |
|---|---|---|---|
| REQ_PAY_01 | 10 % tax must be exact | `subtotal = 100.00, discount = 0` | `110.00` |
| REQ_EC_1 | Negative amounts illegal | `subtotal = -10.00` | throws `InvalidAmountError` |
| REQ_EC_4 | Discount cannot push total below zero | `subtotal = 40, discount = 50` | `0.00` |
| REQ_EC_2 | Same idempotency key → no second charge | duplicate UUID-123 | `isDuplicate: true` |

---

## 1.2 Tickets Failing Tests — Member C (defined but not yet committed)

*Source: TC-06..TC-10 in `Phase 1/01b_edge_cases.md`*

Five integration tests defined in Phase 1 corresponding to EC-1..EC-5:

```javascript
// TC-06 — EC-1 XSS / SQLi
it("strips script tags from title and body before persisting", async () => {
  const res = await POST("/tickets", {
    title: "<script>alert(1)</script>",
    body:  "<img src=x onerror=alert(1)> my order is broken"
  }, validCustomerJWT);
  expect(res.status).toBe(201);
  const stored = await db.tickets.findFirst({ where: { id: res.body.id } });
  expect(stored.title).not.toMatch(/<[^>]+>/);
  expect(stored.body).not.toMatch(/<[^>]+>/);
});

// TC-07 — EC-2 Dedup
it("returns 201 on first submission and 409 on identical re-submission", async () => {
  const payload = { title: "Order broken", body: "Item arrived smashed" };
  const first  = await POST("/tickets", payload, validCustomerJWT);
  const second = await POST("/tickets", payload, validCustomerJWT);
  expect(first.status).toBe(201);
  expect(second.status).toBe(409);
});

// TC-08 — EC-3 HF Timeout
it("assigns MEDIUM priority and returns 201 even if HuggingFace times out", async () => {
  jest.spyOn(hfClient, "analyze").mockRejectedValue(new Error("AbortError"));
  const res = await POST("/tickets", { title: "Urgent", body: "Payment double charged" }, validCustomerJWT);
  expect(res.status).toBe(201);
  const stored = await db.tickets.findFirst({ where: { id: res.body.id } });
  expect(stored.priority).toBe("MEDIUM");
});

// TC-09 — EC-4 Payload boundary
it("rejects 50,000-character body with 422 before calling AI", async () => {
  const hfSpy = jest.spyOn(hfClient, "analyze");
  const res = await POST("/tickets", { title: "Help", body: "x".repeat(50000) }, validCustomerJWT);
  expect(res.status).toBe(422);
  expect(hfSpy).not.toHaveBeenCalled();
});

// TC-10 — EC-5 Tokenizer / NaN
it("assigns MEDIUM priority when AI returns an invalid NaN score", async () => {
  jest.spyOn(hfClient, "analyze").mockResolvedValue({ score: NaN });
  const res = await POST("/tickets", { title: "Urgent", body: "😡😡😡😡😡😡😡😡😡" }, validCustomerJWT);
  expect(res.status).toBe(201);
  const stored = await db.tickets.findFirst({ where: { id: res.body.id } });
  expect(stored.priority).toBe("MEDIUM");
});
```

> Status: Tests defined as text; not yet committed as runnable `.test.js` files. TC-01..TC-05 (happy-path FRs) need authoring before Phase 3 can begin.

---

## 1.3 Orders Failing Test — Member D (uncommitted)

*Source: `src/backend/features/orders/__tests__/orderRoutes.test.js` (local file, not in any commit)*

One test file authored for Story D-1 (`GET /api/v1/orders`) — 7 assertions:
1. 200 + `orders[]` array with 20 items (default pagination)
2. Each order exposes `id, status, subtotal, tax, total, placedAt`
3. Pagination metadata: `page=1, limit=20, totalCount=25, totalPages=2`
4. `?page=2&limit=20` returns remaining 5
5. Sort order: `placedAt DESC`
6. 401 when no auth header
7. 403 when `x-mock-role: user` (not admin)

The test imports `../routes/orderRoutes` and `../services/orderService` — neither file exists, so the test is RED at the module-resolution level (canonical TDP failing state).

> Status: Local-only. Needs commit on branch `test/orders-get-list`. Tests for D-2..D-6 + inventory not yet authored.

---

## 1.4 Checkout — Member A

Member A's Phase 3 is execution-complete (Sprints 1+2 shipped) but **no failing-test artifacts are committed.** The Sprint logs in `.ai/CONTEXT.md` confirm Definition-of-Done checklists were met but do not contain test code. This is a documentation gap relative to the TDP rubric — the implementation may be correct, but the audit trail for Criterion 1 (failing test first) is missing.

---

# §2 — Padlocks / Edge Case Cage (Criterion 2)

PDF Rubric Standard: *"Boundary, threshold, and extreme constraints all addressed; AI hallucination blocked for all cases."*

---

## 2.1 Payment Padlocks — Member B (Zod Schema)

*Source: `md/phase3/Phase3_02_edge_case_cage.md` + `Phase3_04_vertical_slicing.md`*

File: `payment.schema.ts` (network-boundary padlock; runs before any controller logic)

| Field | Rule | Padlock Type | Blocks Test |
|---|---|---|---|
| `amount` | Positive number, max 2 decimal places | Boundary + Threshold | REQ_PAY_01, REQ_EC_1 |
| `promoCode` | Optional, alphanumeric only, max 20 chars | Extreme constraint | REQ_EC_4 |
| `idempotencyKey` | Required, valid UUID format | Threshold | REQ_EC_2 |
| `cartTotal` | `>= 0` enforced via `.refine()` | Boundary | REQ_EC_1 |

Logic-layer guards (`payment.logic.js`):
- `subtotal * 1.10` — tax engine (PAY-02)
- `Math.max(0, subtotal - discount)` — non-negative floor (PAY-03 / REQ_EC_4)
- Idempotency check before gateway call (REQ_EC_2)

---

## 2.2 Tickets Padlocks — Member C (defined in Phase 1)

| Source Field | Rule | Padlock Type | Blocks |
|---|---|---|---|
| `subject` | 5–120 chars, Zod string | Boundary | EC-4 |
| `body` | 10–2,000 chars, DOMPurified | Boundary + sanitization | EC-1, EC-4 |
| Request middleware | `express.json({ limit: '10kb' })` | Extreme cap | EC-4 |
| `dedup_hash` | SHA-256(userId+subject+body); 600 s window | Threshold | EC-2 |
| HF fetch | `AbortController` 5,000 ms timeout | Threshold | EC-3 |
| Score validation | `if (Number.isNaN(score) || score == null) priority = MEDIUM` | Boundary | EC-5 |
| DB column | `priority NOT NULL` ENUM constraint | DB-layer last-line-of-defence | EC-5 |

> Status: Defined as text. Zod schemas not yet written.

---

## 2.3 Orders Padlocks — Member D (defined in Phase 2 §4)

*Source: `member_d_phase2_design.md` §4 Zod Schemas*

```typescript
export const OrderStatusEnum = z.enum([
  'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'
]);

export const updateOrderStatusSchema = z.object({
  status: OrderStatusEnum,
});

export const orderListQuerySchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const updateStockSchema = z.object({
  stock: z.number().int({ message: 'Must be a whole number' })
                  .min(0, { message: 'Must be >= 0' })
                  .max(100000, { message: 'Exceeds maximum' }), // HR-4 padlock
});
```

Logic-layer guards:
- `validateTransition(from, to)` — 7×7 matrix lookup; throws on illegal transition (NFR-D4)
- Optimistic concurrency check on `Order.updatedAt` (NFR-D4.b)
- Sweep idempotency check via `auditLog.find({ idempotencyKey })` (NFR-D5)

> Status: Schemas designed, not yet written.

---

## 2.4 Checkout Padlocks — Member A (in current code)

Currently present in `cartController.js`:
- Stock validation: `if (currentQuantityInCart + requestedQuantity > product.stock) return 400`
- Quantity boundary: `if (new_quantity <= 0) { cart.items = filter out }`
- Tax constant: `TAX_RATE = 0.10`

These are inline conditionals, not Zod schemas. Phase 4 (Hardening) is the natural place to consolidate into a Zod padlock layer matching the team standard.

---

# §3 — TDP Iteration Log (Criterion 3)

PDF Rubric Standard: *"Iterative prompting documented; final code demonstrably fits the test boundary; prompt appendix complete."*

Only Member B has a published iteration log so far.

---

## 3.1 Payment Iteration Log — Member B

*Source: `md/phase3/Phase3_03_tdp_iteration.md`*

| Iteration | Goal | Output | Boundary Fit |
|---|---|---|---|
| **1** | Failing unit tests only — no implementation | 4 tests (tax / negative / floor / idempotency) | ✅ Tests fail because `calculateTotal()` doesn't exist |
| **2** | Define padlocks (Zod schema) — every field maps to a test | `amount`, `promoCode`, `idempotencyKey`, `cartTotal` | ✅ Every test has a guarding padlock |
| **3** | Logic + DB impl — make tests pass with Prisma atomic transaction | `subtotal * 1.10`, `Math.max(0, subtotal - discount)`, idempotency check before charge | ✅ All four tests green |
| **4** | UI impl — mirror idempotency at button level | Zustand store generates UUID on mount; submit disables on first click | ✅ REQ_EC_2 enforced at both UI and API layers (defense in depth) |

### Prompt Appendix (verbatim, Member B)
1. *"Write failing unit tests for payment validation. Do NOT write implementation code. Establish mathematical boundaries only."*
2. *"Write the Zod schema (`payment.schema.ts`) as a padlock. Map every field explicitly to a test from Step 1. Do not proceed until the mapping is confirmed."*
3. *"Now implement `payment.logic.js` and `payment.controller.js` to make the Step 1 tests pass. After generating, state which tests now pass and which still fail."*
4. *"Build the UI slice: `usePaymentStore.js` and `PaymentForm.jsx`. The submit button must be disabled immediately on click. Mirror the idempotency padlock at the UI level."*
5. *"Output the exact markdown to append to `.ai/CONTEXT.md` to log Phase 3 completion."*

### Final Boundary Fit
| Test | Boundary | Implementation Satisfies It |
|---|---|---|
| REQ_PAY_01 | Tax = exactly 10% | `subtotal * 1.10` in `payment.logic.js` |
| REQ_EC_1 | Negative throws | Zod `.refine()` + `InvalidAmountError` |
| REQ_EC_4 | Promo floor = $0.00 | `Math.max(0, subtotal - discount)` |
| REQ_EC_2 | Duplicate key → no second charge | Controller idempotency check + UUID lock in store |

---

## 3.2 Orders Iteration Log — Member D (not started)

Planned iterations (mirrors Member B's pattern):
1. Commit failing test for `GET /api/v1/orders` (already authored locally)
2. Author Zod padlocks per Phase 2 §4
3. Implement `orderService.findAll()` + `adminGuard` middleware
4. Repeat for D-2..D-6
5. Cron + payment event handler for D-6

---

# §4 — Vertical Slicing Inventory (Criterion 4)

PDF Rubric Standard: *"UI / Logic / DB delivered as one working vertical slice; failure resilience demonstrated."*

---

## 4.1 Payment Vertical Slice — Member B

*Source: `md/phase3/Phase3_04_vertical_slicing.md`*

```
┌─ UI Layer ────────────────────────────────────────────┐
│  PaymentForm.jsx   — Checkout form                    │
│  usePaymentStore.js — Zustand store, UUID, isLoading  │
└──────────────────────┬────────────────────────────────┘
                       │ POST /api/payment/process
┌──────────────────────▼────────────────────────────────┐
│  Logic / API Layer                                    │
│  payment.route.js       — Route + auth guard          │
│  payment.controller.js  — Orchestration               │
│  payment.logic.js       — Tax & discount math         │
│  payment.schema.ts      — Zod validation              │
└──────────────────────┬────────────────────────────────┘
                       │ Prisma atomic transaction
┌──────────────────────▼────────────────────────────────┐
│  Database Layer                                       │
│  Payment model — Transaction records                  │
│  PromoCode model — Discount management                │
└───────────────────────────────────────────────────────┘
```

### Failure Resilience Matrix
| Failure | Handled By |
|---|---|
| Invalid input | Zod schema (network boundary) |
| Negative cart total | Schema (`cartTotal >= 0`) AND logic (`InvalidAmountError`) |
| Promo over-applied | `Math.max(0, ...)` floor at $0.00 |
| Double-click | UI button disabled + API idempotency key check |
| Duplicate request | Controller idempotency → cached result, no new DB write |
| Auth failure | `protectRoute` middleware rejects pre-controller |

---

## 4.2 Checkout Vertical Slice — Member A (current state)

*Source: live filesystem*

```
┌─ UI Layer ────────────────────────────────────────────┐
│  src/frontend/src/components/CartWidget.jsx           │
│  src/frontend/src/components/ProductGrid.jsx          │
│  src/frontend/src/api/cartApi.js                      │
│  src/frontend/src/api/productApi.js                   │
└──────────────────────┬────────────────────────────────┘
                       │ HTTP — Axios
┌──────────────────────▼────────────────────────────────┐
│  Logic / API Layer                                    │
│  src/backend/server.js                                │
│  src/backend/routes/cartRoutes.js                     │
│  src/backend/routes/productRoutes.js                  │
│  src/backend/controllers/cartController.js            │
│  src/backend/controllers/productController.js         │
└──────────────────────┬────────────────────────────────┘
                       │ In-memory store (Prisma deferred)
┌──────────────────────▼────────────────────────────────┐
│  Database Layer                                       │
│  src/database/schema.sql (mock — products, carts,     │
│                           cart_items tables)          │
└───────────────────────────────────────────────────────┘
```

### Sprint 1+2 Capabilities
- GET/POST cart; PUT/DELETE cart items with stock validation
- GET products (6 mock items)
- 10 % tax recalculated on every cart mutation
- Frontend: Cart + Catalog side-by-side; Add → Update → Remove lifecycle works
- "Proceed to Checkout" button with empty-cart guard

### Known Gaps
- No JWT (uses hardcoded `session_id = "dev-session"`)
- No Prisma migrations — still on SQL mock schema
- No published failing-test artifacts (TDP audit trail incomplete)

---

## 4.3 Tickets Vertical Slice — Member C (not started)

Planned (per Phase 1 + 2 design):
- UI: ticket-create form (customer); triage queue (agent); status-update buttons
- Logic: `ticket.route.js`, `ticket.controller.js`, `ticket.service.js`, `ticket.schema.ts`, HF integration with AbortController
- DB: `tickets` table per `Phase 1/01a_persona_and_actors.md` O-1 spec

---

## 4.4 Orders Vertical Slice — Member D (not started)

Planned slice structure:
```
src/frontend/src/features/orders/{components,store,api,__tests__}/
src/backend/features/orders/{routes,controllers,services,schemas,middleware,__tests__}/
src/database/migrations/00X_orders_audit_log/  (only the audit_log table — orders+order_items owned by Member A)
```

Failing test for `GET /api/v1/orders` already authored locally (not committed).

---

# §5 — Cross-Slice Integration Points (Implementation Layer)

| Integration | Producer Status | Consumer Status |
|---|---|---|
| JWT `protectRoute` middleware | Pending (Member C auth) | Member B uses it; Member D needs it; both currently use mocks |
| `payment.success` event | ✅ Member B emits on `POST /api/payment/process` success | ⚠️ Member D will subscribe — transport TBD |
| `Order.status` advancement (PENDING → CONFIRMED) | ⚠️ Member D — handler not yet built | Member B's payment success expects this to happen |
| `Order.status = PAYMENT_PENDING` 15-min auto-cancel | ⚠️ Member D — cron not yet built | Member B's REQ_EC_5 mandates it |
| `Product.stock` decrement on payment success | Coupled question — checkout's `placeOrder` does this today; orders slice writes via inventory endpoint | RFC-D001 pending |

---

# §6 — Outstanding Phase 3 Work

| Member | Item | Priority |
|---|---|---|
| Member A | Backfill failing-test artifacts for cart + checkout (audit trail) | Medium — implementation is correct but rubric Criterion 1 isn't documented |
| Member C | Author `tickets.test.js` (TC-01..TC-10); implement Zod padlocks; build route/controller/service; HF integration | High — Phase 3 not yet started |
| Member C | Author entire auth slice (tests + login/register routes + JWT issuance) — every other slice consumes this | **Critical** — current blocker for Members B and D |
| Member D | Commit local failing test on branch `test/orders-get-list`; iterate per TDP | High |
| Member D | Author failing tests for D-2..D-6, inventory updates | Medium |

---

*End of Combined Phase 3 Document.*
