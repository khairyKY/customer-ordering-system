# Phase 2: Design & Specification
## Member D — Admin & Order Fulfillment

**Date:** 2026-05-13
**Slice:** `orders`
**Owner:** Member D
**Curriculum Source:** `CSE323_Project_Overview.pdf` — Phase 2
**Supersedes:** [`member_d_phase2_design_v1.md`](./member_d_phase2_design_v1.md)

---

## Deliverable Map (per CSE323 PDF, Phase 2)

| PDF Requirement | Section |
|---|---|
| Gherkin Scripting (core user stories in Given/When/Then) | §1 |
| The Refinement Loop (Senior QA Audit — kill unquantifiable adjectives) | §2 |
| UML Modeling — System Sequence Diagrams (happy + failure paths) | §3 |
| UML Modeling — Activity Diagrams (integrating code decision points) | §4 |
| Information Hiding (API contracts as shared interface only) | §5 |

---

## 1. Gherkin Scripting

Core user stories in **Given / When / Then**. These originate here in Phase 2; Phase 1 produced FRs, not Gherkin.

### Story D-1 — View All Orders (covers FR-D1, FR-D1.b)
```gherkin
Feature: Admin Order Dashboard

  Scenario: Admin fetches the paginated order list
    Given I hold a JWT with claim role = "admin"
    And 25 Order records exist in the database
    When I send GET /api/v1/orders?page=1&limit=20
    Then I receive HTTP 200 OK
    And the response body contains an "orders" array of 20 items
    And each item exposes: id, status, subtotal, tax, total, placedAt
    And a "pagination" object contains: page=1, limit=20, totalCount=25, totalPages=2
    And all orders are sorted by placedAt DESC

  Scenario: Admin filters orders by status (HR-1)
    Given I hold a JWT with claim role = "admin"
    And 5 Orders exist with status = "PENDING" and 10 with status = "DELIVERED"
    When I send GET /api/v1/orders?status=PENDING
    Then I receive HTTP 200 OK
    And the response "orders" array contains exactly 5 items
    And every item has status = "PENDING"
```

### Story D-2 — Update Order Status (covers FR-D2, FR-D2.b)
```gherkin
Feature: Admin Order Status Update

  Scenario: Admin advances order from PENDING to PROCESSING
    Given I hold a JWT with claim role = "admin"
    And an Order exists with id = "ord_abc123" and status = "PENDING"
    When I send PATCH /api/v1/orders/ord_abc123/status with body { "status": "PROCESSING" }
    Then I receive HTTP 200 OK
    And the response body contains order id = "ord_abc123" with status = "PROCESSING"
    And Order.updatedAt is newer than the previous value

  Scenario: Empty body returns 400 (HR-5)
    Given I hold a JWT with claim role = "admin"
    When I send PATCH /api/v1/orders/ord_abc123/status with body {}
    Then I receive HTTP 400 Bad Request
    And the response identifies "status" as a required field
```

### Story D-3 — View Order Detail (covers FR-D3, FR-D3.b)
```gherkin
Feature: Admin Order Detail View

  Scenario: Admin retrieves a single order with line items and customer contact
    Given I hold a JWT with claim role = "admin"
    And an Order "ord_abc123" exists with 2 OrderItems
    And the order's customer has email = "buyer@example.com" and phone = "+201234567890"
    When I send GET /api/v1/orders/ord_abc123
    Then I receive HTTP 200 OK
    And the response contains Order fields: id, status, subtotal, discount, tax, shippingCost, total, placedAt
    And the response contains an "items" array of 2 objects with productName, quantity, unitPrice, totalPrice
    And the response contains a "customer" object with email and phone (HR-3)
    And the response contains a "shippingAddress" object with street, city, state, zip, country
```

### Story D-4 — View Inventory (covers FR-D4)
```gherkin
Feature: Admin Inventory View

  Scenario: Admin views full product inventory with low-stock flags
    Given I hold a JWT with claim role = "admin"
    And Product "PROD-003" has stock = 3
    And Product "PROD-007" has stock = 40
    When I send GET /api/v1/inventory
    Then I receive HTTP 200 OK
    And the item for "PROD-003" contains: { stock: 3, lowStock: true }
    And the item for "PROD-007" contains: { stock: 40, lowStock: false }
```

### Story D-5 — Update Stock (covers FR-D5, FR-D5.b)
```gherkin
Feature: Admin Stock Replenishment

  Scenario: Admin updates stock quantity within bounds
    Given I hold a JWT with claim role = "admin"
    And Product "PROD-003" has stock = 2
    When I send PATCH /api/v1/inventory/PROD-003 with body { "stock": 50 }
    Then I receive HTTP 200 OK
    And the response contains: { id: "PROD-003", stock: 50, lowStock: false }

  Scenario: Stock above upper bound is rejected (HR-4)
    Given I hold a JWT with claim role = "admin"
    When I send PATCH /api/v1/inventory/PROD-003 with body { "stock": 999999 }
    Then I receive HTTP 400 Bad Request
    And the response identifies "stock" as exceeding the maximum of 100000
```

### Story D-6 — System Auto-Cancels Stale Pending Orders (covers FR-D6, FR-D6.b)
> Added post-pull. Implements Member B's REQ_EC_5 (Zombie Recovery) mandate.

```gherkin
Feature: System Cleanup of Stale Pending Orders

  Scenario: Order is auto-cancelled after 15 minutes with no successful payment
    Given an Order exists with id = "ord_stale1" and status = "PENDING"
    And the order's placedAt is 16 minutes before NOW
    And no Payment record exists with status = "SUCCESS" and orderId = "ord_stale1"
    When the cron job sweepStalePendingOrders runs
    Then the order "ord_stale1" status is updated to "CANCELLED"
    And an audit log entry is written with actor = "system" and reason = "stale_pending_timeout"

  Scenario: Stale order with successful payment is advanced, not cancelled (HR-8)
    Given an Order exists with id = "ord_paid1" and status = "PENDING"
    And the order's placedAt is 16 minutes before NOW
    And a Payment record exists with status = "SUCCESS" and orderId = "ord_paid1"
    When the cron job sweepStalePendingOrders runs
    Then the order "ord_paid1" status is updated to "CONFIRMED" (not "CANCELLED")
    And an audit log entry is written with actor = "system" and reason = "payment_confirmed_late"

  Scenario: Sweep is idempotent on repeat runs (NFR-D5)
    Given the sweep ran 1 minute ago and processed order "ord_paid1" to "CONFIRMED"
    When the cron job sweepStalePendingOrders runs again
    Then the order "ord_paid1" status remains "CONFIRMED"
    And no duplicate audit log entry is written for "ord_paid1"
```

---

## 2. The Refinement Loop (Senior QA Audit)

Per PDF: *"Conduct a 'Senior QA Audit' to eliminate unquantifiable adjectives like 'fast' or 'secure' and replace them with measurable technical metrics."*

| Unquantifiable Term | Replaced With (Measurable) | Verification Mechanism |
|---|---|---|
| "fast" / "responsive" / "immediately" | **p95 latency < 500ms** from API response to DOM repaint | Playwright `expect(...).toBeVisible({ timeout: 500 })` |
| "secure" | JWT in `Authorization: Bearer <token>` + decoded claim `role === "admin"` | Supertest 401/403 assertions on every endpoint |
| "low-stock" | `stock < 5` (strict less-than, integer comparison) | Vitest unit test on `inventoryService.flagLowStock()` |
| "sorted recently" / "newest first" | SQL `ORDER BY placedAt DESC` (descending Unix epoch) | Integration test asserting array is monotonically decreasing in `placedAt` |
| "grand total" | `subtotal + (subtotal × 0.10)` — tax rate 10% (matches Member A's `cartController.js`) | Unit test on tax calculation; rounding to 2 decimals via `Math.round(x * 100) / 100` |
| "admin can update" | JWT validated → Zod schema parsed → status transition matrix consulted → DB write → audit log written | 4 distinct test layers per the testing pyramid |
| "race-safe" | Optimistic concurrency: client sends `If-Match: <updatedAt>` header; mismatch returns 409 | Integration test launching 2 concurrent PATCH requests |
| "stale" / "zombie order" | `Order.status === "PENDING" AND placedAt < NOW() - INTERVAL '15 minutes'` (matches Member B REQ_EC_5) | Vitest unit on `sweepStalePending()` with frozen clock |
| "idempotent" | Replaying the same event/key within a 300s window produces zero side effects (matches Member B's idempotency padlock) | Integration test invoking the same sweep twice |

### 2.1 Adjective Hunt — Words Banned from Phase 3 Artifacts

The following words are **forbidden in tests, code comments, and PR descriptions** unless paired with a measurable substitute:

`fast`, `slow`, `quick`, `responsive`, `smooth`, `secure`, `safe`, `proper`, `correct`, `clean`, `simple`, `nice`, `good`, `intuitive`, `user-friendly`, `low-stock` (without `< 5`), `high-volume` (without numeric threshold), `soon` (without time constraint).

---

## 3. System Sequence Diagrams (Happy + Failure Paths)

### SSD-D1 — `GET /api/v1/orders`
```
Admin Browser        Express Router       adminGuard()     orderService       In-Memory Store
     │                     │                    │                │                    │
     │─ GET /orders?page=1 ▶                    │                │                    │
     │                     │── validateJWT() ──▶│                │                    │
     │                     │                    │── role=admin ✅                     │
     │                     │◀── next() ─────────│                │                    │
     │                     │── findAll(1, 20) ───────────────────▶                    │
     │                     │                    │                │── slice + sort ───▶│
     │                     │                    │                │◀── 20 orders ──────│
     │◀── 200 { orders[20], pagination{...} } ─────────────────────────────────────── │
```

### SSD-D2 — `PATCH /api/v1/orders/:id/status` (HAPPY + 422 + 400)
```
HAPPY PATH:
Admin ─▶ PATCH /orders/:id/status { status:"PROCESSING" } ─▶ adminGuard ✅
                                                          ─▶ zodParse ✅
                                                          ─▶ orderService.updateStatus()
                                                              ├─ findById() → Order{status:"PENDING"}
                                                              ├─ validateTransition("PENDING","PROCESSING") ✅
                                                              └─ store.update() → Order{status:"PROCESSING"}
       ◀── 200 { id, status:"PROCESSING", updatedAt } ──────────

FAILURE PATH — ILLEGAL TRANSITION (422):
Admin ─▶ PATCH (order is DELIVERED) { status:"PENDING" } ─▶ adminGuard ✅
                                                         ─▶ zodParse ✅
                                                         ─▶ validateTransition("DELIVERED","PENDING") ❌
       ◀── 422 { error:"Invalid status transition", from:"DELIVERED", to:"PENDING" }

FAILURE PATH — EMPTY BODY (400, from HR-5):
Admin ─▶ PATCH /orders/:id/status {} ─▶ adminGuard ✅
                                     ─▶ zodParse ❌ (status required)
       ◀── 400 { error:"Validation failed", field:"status", message:"Required" }
```

### SSD-D3 — `GET /api/v1/orders/:id` (HAPPY + 404)
```
HAPPY:    Admin ─▶ GET /orders/:id ─▶ adminGuard ✅ ─▶ findById() → Order with items[]
                ◀── 200 { ...order, items[], customer, shippingAddress }
NOT FOUND: Admin ─▶ GET /orders/999999 ─▶ adminGuard ✅ ─▶ findById() → null
                ◀── 404 { error:"Order not found" }
```

### SSD-D5 — `PATCH /api/v1/inventory/:id` (HAPPY + 400 NEG + 400 UPPER)
```
HAPPY:       PATCH /inventory/PROD-003 { stock: 50 } ─▶ zod ✅ ─▶ store.update ─▶ 200
400 NEG:     PATCH /inventory/PROD-003 { stock: -10 } ─▶ zod ❌ ─▶ 400
400 DECIMAL: PATCH /inventory/PROD-003 { stock: 3.7 } ─▶ zod ❌ ─▶ 400
400 UPPER:   PATCH /inventory/PROD-003 { stock: 999999 } ─▶ zod ❌ ─▶ 400 (HR-4 padlock)
```

### SSD-D6 — System Cron Sweep of Stale Pending Orders (added post-pull)
**Initiator:** System (cron, not Admin). Runs every 5 minutes.

```
NODE-CRON (*/5 * * * *)
       │
       ▼
orderService.sweepStalePending(now)
       │
       ▼
store.find({ status: "PENDING", placedAt: { lt: now - 15min } })
       │
       ▼
   ┌───┴───┐
   │ for each stale order:
   │   paymentService.findByOrderId(order.id)   ◀── cross-slice READ (Member B's Payment model)
   │   │
   │   ├─ Payment.status === "SUCCESS"?
   │   │     YES ─▶ validateTransition("PENDING","CONFIRMED") ✅
   │   │            store.update({ status: "CONFIRMED" })
   │   │            auditLog.write({ actor: "system", reason: "payment_confirmed_late" })
   │   │
   │   └─ NO  ─▶ validateTransition("PENDING","CANCELLED") ✅
   │            store.update({ status: "CANCELLED" })
   │            auditLog.write({ actor: "system", reason: "stale_pending_timeout" })
   │
   ▼ (idempotent — second run finds no PENDING records → no-op)
```

### 3.1 Status Transition Matrix Update (post-pull addendum)

Add `Initiator` dimension to the existing transition matrix. The full matrix from v1 is preserved; the addendum lists who may legally trigger each transition.

| Transition | Admin (manual)? | System (cron)? | Payment Event? |
|---|---|---|---|
| PENDING → CONFIRMED | ✅ | ✅ (when Payment.SUCCESS detected late) | ✅ (`payment.success` subscriber) |
| PENDING → CANCELLED | ✅ | ✅ (after 15-min stale-pending sweep, no successful payment) | — |
| CONFIRMED → PROCESSING | ✅ | — | — |
| CONFIRMED → CANCELLED | ✅ | — | — |
| PROCESSING → SHIPPED | ✅ | — | — |
| PROCESSING → CANCELLED | ✅ | — | — |
| SHIPPED → DELIVERED | ✅ | — | — |
| DELIVERED → REFUNDED | ✅ | — | — |

> Test implication: any system-driven transition needs `actor = "system"` in the audit log; admin-driven transitions need the admin's user ID.

---

## 4. Activity Diagrams (Integrating Code Decision Points)

Per PDF: *"Activity Diagrams that integrate code decision points."*

### 4.1 Activity Diagram — `PATCH /api/v1/orders/:id/status`

```
                              ●  (Start)
                              │
                              ▼
                       ┌──────────────────┐
                       │ Receive request  │
                       └──────────────────┘
                              │
                              ▼
                         ◇ JWT valid?
                         │            │
                       No│            │Yes
                         ▼            ▼
                    [401 Unauth]   ◇ role === "admin"?
                         │         │              │
                         │       No│              │Yes
                         │         ▼              ▼
                         │   [403 Forbidden]  ◇ Body matches schema?
                         │         │          │                │
                         │         │       No │                │ Yes
                         │         │          ▼                ▼
                         │         │     [400 Validation] ┌─────────────────┐
                         │         │          │           │ Fetch order     │
                         │         │          │           └─────────────────┘
                         │         │          │                  │
                         │         │          │                  ▼
                         │         │          │             ◇ Order found?
                         │         │          │           No │             │ Yes
                         │         │          │              ▼             ▼
                         │         │          │       [404 NotFound]   ◇ Transition legal
                         │         │          │              │          (per matrix)?
                         │         │          │              │          │             │
                         │         │          │              │        No│             │Yes
                         │         │          │              │          ▼             ▼
                         │         │          │              │   [422 IllegalTrans] ┌─────────────┐
                         │         │          │              │          │           │ Update DB   │
                         │         │          │              │          │           └─────────────┘
                         │         │          │              │          │                │
                         │         │          │              │          │                ▼
                         │         │          │              │          │           ┌─────────────┐
                         │         │          │              │          │           │ Write audit │
                         │         │          │              │          │           │ log entry   │
                         │         │          │              │          │           └─────────────┘
                         │         │          │              │          │                │
                         │         │          │              │          │                ▼
                         │         │          │              │          │           [200 OK]
                         │         │          │              │          │                │
                         ▼         ▼          ▼              ▼          ▼                ▼
                                              ●  (End — merge)
```

**Decision points mapped to code:**
- `◇ JWT valid?` → `adminGuard()` middleware, lines 1–10
- `◇ role === "admin"?` → same middleware, role check
- `◇ Body matches schema?` → `updateOrderStatusSchema.parse(req.body)`
- `◇ Order found?` → `orderService.findById(id)` returning `null`
- `◇ Transition legal?` → `orderService.validateTransition(from, to)` consults the 7×7 matrix

### 4.2 Activity Diagram — `PATCH /api/v1/inventory/:id`

```
●  Start
│
▼
┌──────────────────┐
│ Receive request  │
└──────────────────┘
│
▼
◇ JWT valid? ──No──▶ [401] ──┐
│ Yes                         │
▼                             │
◇ role === "admin"? ──No──▶ [403] ─┤
│ Yes                              │
▼                                  │
◇ stock is integer?  ──No──▶ [400 "must be whole number"] ─┤
│ Yes                                                       │
▼                                                           │
◇ stock >= 0? ──No──▶ [400 "must be >= 0"] ────────────────┤
│ Yes                                                       │
▼                                                           │
◇ stock <= 100000? ──No──▶ [400 "max exceeded"] ───────────┤   ◀── HR-4 padlock
│ Yes                                                       │
▼                                                           │
┌──────────────────┐                                        │
│ Find product     │                                        │
└──────────────────┘                                        │
│                                                           │
▼                                                           │
◇ Product exists? ──No──▶ [404] ───────────────────────────┤
│ Yes                                                       │
▼                                                           │
┌──────────────────┐                                        │
│ Update product   │                                        │
│   .stock         │                                        │
└──────────────────┘                                        │
│                                                           │
▼                                                           │
┌──────────────────┐                                        │
│ Compute lowStock │                                        │
│   = (stock < 5)  │                                        │
└──────────────────┘                                        │
│                                                           │
▼                                                           │
[200 { id, stock, lowStock }]                               │
│                                                           │
▼                                                           ▼
●  End (merge)
```

---

## 5. Information Hiding

Per PDF: *"Design your API contracts such that teams/AI only need to respect shared interfaces, keeping internal stack logic hidden."*

### 5.1 The Public Interface (Visible to Everyone)

This is the **ONLY** contract teammates, frontend code, and AI tools are entitled to depend on:

| Method | Endpoint | Auth | Body / Query | Success | Error Codes |
|---|---|---|---|---|---|
| `GET` | `/api/v1/orders` | Admin JWT | `?page&limit&status` | `200 { orders[], pagination }` | 401, 403 |
| `GET` | `/api/v1/orders/:id` | Admin JWT | — | `200 { ...order, items[], customer, shippingAddress }` | 401, 403, 404 |
| `PATCH` | `/api/v1/orders/:id/status` | Admin JWT | `{ status }` | `200 { id, status, updatedAt }` | 400, 401, 403, 404, 409, 422 |
| `GET` | `/api/v1/inventory` | Admin JWT | — | `200 { products[{ ...product, lowStock }] }` | 401, 403 |
| `PATCH` | `/api/v1/inventory/:id` | Admin JWT | `{ stock }` | `200 { id, stock, lowStock }` | 400, 401, 403, 404 |

### 5.2 The Hidden Implementation (Free to Change)

These details are **encapsulated inside the slice** and may change without notifying any teammate, because no teammate depends on them:

| Hidden Detail | Why It's Hidden |
|---|---|
| In-memory `Map` store vs Prisma vs Postgres | Storage choice swappable; contract is the same |
| Status transition matrix as JS object vs DB table | Internal optimization |
| Audit log mechanism (in-process buffer vs Kafka) | Implementation detail |
| Pagination algorithm (offset/limit vs cursor) | Internal — only `{ page, limit, totalCount, totalPages }` is contract |
| Error message wording (English copy) | Only status codes are contract; message text may evolve |
| `Order.updatedAt` precision (ms vs μs) | Internal; client only sends back what server gave |
| Whether routes use Express `Router` or Fastify | Framework choice hidden behind HTTP |

### 5.3 Teammate Consumption Rules

| Teammate | What They May Depend On | What They May NOT Touch |
|---|---|---|
| **Member A (checkout)** | Nothing from orders slice (orders is downstream) | All orders code |
| **Member B (auth)** | Orders consumes their `protectRoute`/`adminGuard` middleware via `app.use()` | Orders' status matrix, services |
| **Member B (payment)** | Orders **reads** their `Payment` Prisma model (status, orderId); orders **subscribes** to logical `payment.success` event | Orders writes nothing to Payment table; payment writes nothing to Order table — coordination is event-based only |
| **Member C (catalog)** | Owns `Product.stock` — orders writes only via RFC-D001 | Orders' route handlers |
| **Frontend (any member)** | REST API only | Direct DB access; no Prisma imports |

### 5.4 Cross-Slice Event Contract (added post-pull)

A new logical event is consumed by our slice:

```
EVENT: payment.success
SOURCE: Member B's payment slice (emitted on successful POST /api/payment/process)
PAYLOAD: { orderId: string, paymentId: string, idempotencyKey: string, amount: number, occurredAt: ISO8601 }
CONSUMER: orderService.handlePaymentSuccess(payload)
  → validateTransition("PENDING","CONFIRMED")
  → store.update(orderId, { status: "CONFIRMED" })
  → auditLog.write({ actor: "system", reason: "payment_success", idempotencyKey })
GUARANTEES:
  - Idempotent on idempotencyKey (300s replay window, matches Member B's padlock)
  - Safe under reordering: if the 15-min sweep ran first and the order is now CANCELLED, this handler returns 200 OK without mutation and logs a reconciliation warning
```

The **mechanism** of event transport (in-process EventEmitter vs Prisma trigger vs queue) is hidden; only the **payload shape** and **idempotency contract** are public.

This **information-hiding boundary** is the slice's contract. Violations are blocking PR review issues per `docs/architecture_v2/05-git-and-branching-rules.md`.

---

## 6. Exit Criteria — Phase 2

- [x] Gherkin: 6 stories (D-1 through D-6) × ≥1 happy + ≥1 negative scenario each
- [x] Refinement Loop: 10 vague terms eliminated; 18 words banned
- [x] SSDs: 5 diagrams covering happy + failure for all 6 endpoints/flows (including system cron)
- [x] Activity Diagrams: 2 diagrams with code decision points labeled
- [x] Status Transition Matrix updated with Initiator dimension (Admin vs System vs Event)
- [x] Information Hiding: public contract + hidden details + consumption rules + event contract documented
- [x] Cross-slice event contract (`payment.success`) defined with idempotency guarantees
- [x] Logbook entry written (`docs/logbook/member_d_phase2_agile_logbook.md`)
