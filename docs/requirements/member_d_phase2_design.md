# Phase 2 Design — Member D: Admin & Order Fulfillment
**Date:** 2026-05-11
**Slice:** `orders`
**Owner:** Member D
**Status:** Complete — Ready for Phase 3 (TDP)

---

## Design Flags

> ⚠️ **Tax discrepancy** — `08-database-schema-checkout.md` states 8%; CONTEXT.md Sprint 2 log states 10%.
> CONTEXT.md is the live source of truth. Using **10%** until Member A confirms the canonical value.

> ⚠️ **RFC-D001 — Cross-slice write** — `PATCH /api/v1/inventory/:id` writes to `Product.stock`
> in Member C's catalog domain. Written approval from Member C is required before implementation.

---

## 1. Refined Gherkin

### Story D-1 — View All Orders
```gherkin
Feature: Admin Order Dashboard

  Scenario: Admin fetches paginated order list
    Given I hold a JWT with claim role = "admin"
    And 25 Order records exist in the database
    When I send GET /api/v1/orders?page=1&limit=20
    Then I receive HTTP 200 OK
    And the response body contains an "orders" array of 20 items
    And each item exposes: id, status, subtotal, tax, total, placedAt
    And a "pagination" object contains: page=1, limit=20, totalCount=25, totalPages=2
    And all orders are sorted by placedAt DESC
```

### Story D-2 — Update Order Status
```gherkin
Feature: Admin Order Status Update

  Scenario: Admin advances order from PENDING to PROCESSING
    Given I hold a JWT with claim role = "admin"
    And an Order record exists with id = "ord_abc123" and status = "PENDING"
    When I send PATCH /api/v1/orders/ord_abc123/status
    With body { "status": "PROCESSING" }
    Then I receive HTTP 200 OK
    And the response body contains order id = "ord_abc123" with status = "PROCESSING"
    And the Order record in the database reflects status = "PROCESSING"
    And the Order.updatedAt field is newer than the previous value
```

### Story D-3 — View Order Detail
```gherkin
Feature: Admin Order Detail View

  Scenario: Admin retrieves a single order with all line items
    Given I hold a JWT with claim role = "admin"
    And an Order record "ord_abc123" exists with 2 OrderItems
    When I send GET /api/v1/orders/ord_abc123
    Then I receive HTTP 200 OK
    And the response body contains the Order fields:
      | id | status | subtotal | discount | tax | shippingCost | total | placedAt |
    And the response body contains a nested "items" array of 2 objects
    And each item exposes: productName, quantity, unitPrice, totalPrice
    And the response body contains a "shippingAddress" object with: street, city, state, zip, country
```

### Story D-4 — View Inventory
```gherkin
Feature: Admin Inventory View

  Scenario: Admin views full product inventory with low-stock flags
    Given I hold a JWT with claim role = "admin"
    And Product "PROD-003" has stock = 3
    And Product "PROD-007" has stock = 40
    When I send GET /api/v1/inventory
    Then I receive HTTP 200 OK
    And the response contains a "products" array
    And the item for "PROD-003" contains: { stock: 3, lowStock: true }
    And the item for "PROD-007" contains: { stock: 40, lowStock: false }
    And lowStock is derived as stock < 5
```

### Story D-5 — Update Stock
```gherkin
Feature: Admin Stock Replenishment

  Scenario: Admin updates stock quantity for a product
    Given I hold a JWT with claim role = "admin"
    And Product "PROD-003" has stock = 2
    When I send PATCH /api/v1/inventory/PROD-003
    With body { "stock": 50 }
    Then I receive HTTP 200 OK
    And the response body contains: { id: "PROD-003", stock: 50, lowStock: false }
    And the Product record in the database reflects stock = 50
```

---

## 2. System Sequence Diagrams

### SSD-D1 — GET /api/v1/orders (Happy Path)
```
Admin Browser          Express Router         adminGuard()          OrderService          Prisma (DB)
     |                       |                      |                     |                    |
     |-- GET /orders?page=1 →|                      |                     |                    |
     |                       |-- validateJWT() ────→|                     |                    |
     |                       |                      |-- decode role ──    |                    |
     |                       |                      |   role="admin" ✅   |                    |
     |                       |                      |←─ next() ──────────|                    |
     |                       |─────────────────────────── findAll(page,limit) ──────────────→ |
     |                       |                      |                     |←─ ORDER BY placedAt DESC, LIMIT 20
     |                       |                      |                     |── map to DTO        |
     |←── 200 { orders[], pagination{} } ──────────────────────────────────────────────────── |
```

### SSD-D2 — PATCH /api/v1/orders/:id/status (Happy + Guard Paths)
```
Admin Browser          Express Router         adminGuard()       updateStatusSchema     OrderService        Prisma
     |                       |                      |                    |                   |                 |
     |-- PATCH /orders/:id/status { status:"PROCESSING" } →|            |                   |                 |
     |                       |── validateJWT() ────→|                   |                   |                 |
     |                       |                      |←─ next() ─────────|                   |                 |
     |                       |── zod.parse(body) ───────────────────────→                   |                 |
     |                       |                      |          ← valid ─|                   |                 |
     |                       |── updateStatus(id, "PROCESSING") ───────────────────────────→|                 |
     |                       |                      |                   |── findById(id) ───────────────────→ |
     |                       |                      |                   |                   |←── Order{status:"PENDING"}
     |                       |                      |                   |── validateTransition("PENDING","PROCESSING") ✅
     |                       |                      |                   |── prisma.order.update() ───────────→|
     |                       |                      |                   |                   |←── Order{status:"PROCESSING"}
     |←── 200 { id, status:"PROCESSING", updatedAt } ────────────────────────────────────────────────────────|

[ILLEGAL TRANSITION PATH]
     |-- PATCH /orders/:id/status { status:"PENDING" } (order is DELIVERED) →|
     |                       |── validateTransition("DELIVERED","PENDING") ❌ |
     |←── 422 { error:"Invalid status transition", from:"DELIVERED", to:"PENDING" } ─────────|
```

### SSD-D3 — GET /api/v1/orders/:id (Not Found Path)
```
Admin Browser          Express Router         adminGuard()          OrderService          Prisma
     |                       |                      |                     |                    |
     |-- GET /orders/999999 →|                      |                     |                    |
     |                       |── validateJWT() ────→|                     |                    |
     |                       |                      |←─ next() ──────────|                    |
     |                       |─────────────────────────── findById("999999") ───────────────→ |
     |                       |                      |                     |                    |←── null
     |                       |                      |                     |── throw NotFoundError("Order not found")
     |←── 404 { error: "Order not found" } ─────────────────────────────────────────────────  |
```

### SSD-D5 — PATCH /api/v1/inventory/:id (Validation Guard)
```
Admin Browser          Express Router         adminGuard()      updateStockSchema      ProductService       Prisma
     |                       |                      |                   |                    |                 |
     |-- PATCH /inventory/PROD-001 { stock: -10 } →|                   |                   |                 |
     |                       |── validateJWT() ────→|                   |                   |                 |
     |                       |                      |←─ next() ─────────|                   |                 |
     |                       |── zod.parse(body) ───────────────────────→                   |                 |
     |                       |          stock: -10 fails z.int().min(0) ❌                  |                 |
     |←── 400 { error:"Validation failed", field:"stock", message:"Must be >= 0" } ─────────|
```

---

## 3. OrderStatus Transition Machine

```
                    ┌─────────────┐
         ┌──────────│   PENDING   │──────────────┐
         │          └─────────────┘              │
         ▼                  │                    ▼
   ┌──────────┐             │           ┌─────────────┐
   │CONFIRMED │             └──────────→│  CANCELLED  │ (terminal)
   └──────────┘                         └─────────────┘
         │
         ▼
   ┌──────────┐             ┌─────────────┐
   │PROCESSING│────────────→│  CANCELLED  │
   └──────────┘             └─────────────┘
         │
         ▼
   ┌──────────┐
   │ SHIPPED  │
   └──────────┘
         │
         ▼
   ┌──────────┐             ┌─────────────┐
   │DELIVERED │────────────→│  REFUNDED   │ (terminal)
   └──────────┘             └─────────────┘
```

| From → To | PENDING | CONFIRMED | PROCESSING | SHIPPED | DELIVERED | CANCELLED | REFUNDED |
|---|---|---|---|---|---|---|---|
| **PENDING** | — | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **CONFIRMED** | ❌ | — | ✅ | ❌ | ❌ | ✅ | ❌ |
| **PROCESSING** | ❌ | ❌ | — | ✅ | ❌ | ✅ | ❌ |
| **SHIPPED** | ❌ | ❌ | ❌ | — | ✅ | ❌ | ❌ |
| **DELIVERED** | ❌ | ❌ | ❌ | ❌ | — | ❌ | ✅ |
| **CANCELLED** | ❌ | ❌ | ❌ | ❌ | ❌ | — | ❌ |
| **REFUNDED** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | — |

---

## 4. Zod Validation Schemas

```typescript
// src/backend/features/orders/schemas/order.schemas.ts
import { z } from 'zod';

export const OrderStatusEnum = z.enum([
  'PENDING', 'CONFIRMED', 'PROCESSING',
  'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'
]);

export const updateOrderStatusSchema = z.object({
  status: OrderStatusEnum,
});

export const orderListQuerySchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// src/backend/features/orders/schemas/inventory.schemas.ts
export const updateStockSchema = z.object({
  stock: z
    .number()
    .int({ message: 'Must be a whole number' })
    .min(0, { message: 'Must be >= 0' }),
});
```

---

## 5. Formal API Contract

| Method | Endpoint | Auth | Request Body / Query | Success | Error Codes |
|---|---|---|---|---|---|
| `GET` | `/api/v1/orders` | Admin JWT | `?page&limit` | `200 { orders[], pagination{} }` | 401, 403 |
| `GET` | `/api/v1/orders/:id` | Admin JWT | — | `200 { order, items[], shippingAddress }` | 401, 403, 404 |
| `PATCH` | `/api/v1/orders/:id/status` | Admin JWT | `{ status: OrderStatus }` | `200 { id, status, updatedAt }` | 400, 401, 403, 404, 422 |
| `GET` | `/api/v1/inventory` | Admin JWT | — | `200 { products[{ ...product, lowStock }] }` | 401, 403 |
| `PATCH` | `/api/v1/inventory/:id` | Admin JWT | `{ stock: number }` | `200 { id, stock, lowStock }` | 400, 401, 403, 404 |

---

## 6. Cross-Slice RFC

**RFC-D001** — `PATCH /api/v1/inventory/:id` writes to `Product.stock`, owned by Member C's catalog slice.
**Required action:** Obtain written approval from Member C in the PR comment thread and document in `.ai/CONTEXT.md` before writing any implementation for this endpoint.

---

## 7. Phase 3 TDP Kickoff — Failing Tests to Write First

Per TDP protocol, write and commit these failing tests BEFORE any implementation:

1. `test/orders-get-list` — `GET /api/v1/orders` returns paginated list, enforces admin-only (401/403).
2. `test/orders-update-status` — `PATCH /api/v1/orders/:id/status` valid transition + DELIVERED→PENDING regression (422).
3. `test/orders-update-status-invalid` — `PATCH` with `status:"HACKED"` returns 400.
4. `test/inventory-update-stock` — `PATCH /api/v1/inventory/:id` valid, negative, and decimal quantity guards.
5. `test/orders-get-detail-not-found` — `GET /api/v1/orders/999999` returns 404.
