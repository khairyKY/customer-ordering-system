# Phase 1 Requirements — Member D: Admin & Order Fulfillment
**Date:** 2026-05-10
**Slice:** `orders`
**Owner:** Member D
**Status:** Complete

---

## 1. Actor Classification

| Actor | Type | Description |
|---|---|---|
| **Admin** | Primary | Internal staff user. Manages order fulfillment pipeline and product inventory. Requires JWT with `role === "admin"`. |
| **System** | Secondary | Consumes `orders` + `order_items` records created by Member A's `placeOrder` transaction. |
| **Customer** | Out-of-scope boundary | Places orders via Member A's checkout slice. This slice does not create orders. |

---

## 2. User Stories (Gherkin)

### Story D-1: View All Orders
```gherkin
Feature: Admin Order Dashboard

  Scenario: Admin views the complete order list
    Given I am authenticated as an Admin
    When I navigate to the order management page
    Then I see a list of all orders
    And each row displays: order ID, customer name, status, grand total, and creation date
    And the list is sorted by creation date descending
```

### Story D-2: Update Order Status
```gherkin
Feature: Admin Order Status Update

  Scenario: Admin advances an order through the fulfillment pipeline
    Given I am authenticated as an Admin
    And an order exists with status "PENDING"
    When I update that order's status to "PROCESSING"
    Then the order record in the database reflects status "PROCESSING"
    And the updated status appears in the order list within 500ms of API response
```

### Story D-3: View Single Order Detail
```gherkin
Feature: Admin Order Detail View

  Scenario: Admin inspects a specific order
    Given I am authenticated as an Admin
    And an order exists with ID "ORD-001" containing 2 line items
    When I click on order "ORD-001" in the order list
    Then I see each ordered product with its name, quantity, unit price, and line total
    And I see the subtotal, 10% tax amount, and grand total
    And I see the shipping address provided at checkout
```

### Story D-4: View Product Inventory
```gherkin
Feature: Admin Inventory Management

  Scenario: Admin reviews current stock levels
    Given I am authenticated as an Admin
    When I navigate to the inventory management page
    Then I see each product with its name, SKU, and current stock quantity
    And any product with stock quantity less than 5 units is visually flagged as low-stock
```

### Story D-5: Update Product Stock Quantity
```gherkin
Feature: Admin Stock Replenishment

  Scenario: Admin restocks a low-inventory product
    Given I am authenticated as an Admin
    And product "PROD-003" currently has a stock quantity of 2
    When I submit a stock update setting the quantity to 50
    Then the product's stock quantity is persisted as 50
    And the inventory list reflects the updated quantity within 500ms of API response
    And the low-stock flag is no longer shown for that product
```

---

## 3. Ambiguity Audit

| Vague Term | Replaced With |
|---|---|
| "immediately" / "instantly" | Within 500ms of API response receipt — enforced by React Query cache invalidation |
| "low-stock" | `stock_quantity < 5` — integer comparison on the `products` table |
| "authenticated as Admin" | JWT in `Authorization: Bearer <token>` header with decoded `role === "admin"` claim |
| "sorted by creation date descending" | `ORDER BY created_at DESC` on the `orders` table |
| "grand total" | `subtotal + (subtotal × 0.10)` — consistent with Member A's 10% tax rate |
| "within 500ms" | Measured from `200 OK` response timestamp to DOM repaint — verifiable via Playwright `waitForSelector` |

---

## 4. Negative Acceptance Tests (Edge Cases)

```gherkin
  # NEG-1: Privilege escalation — non-admin role
  Scenario: Regular customer attempts to access admin order list
    Given I am authenticated as a Customer (role: "user")
    When I send GET /api/orders
    Then I receive HTTP 403 Forbidden
    And the response body contains "Insufficient permissions"

  # NEG-2: Invalid status value — Zod schema must catch this
  Scenario: Admin submits an unrecognized order status
    Given I am authenticated as an Admin
    And an order exists with ID "ORD-005"
    When I submit a status update with value "HACKED"
    Then I receive HTTP 400 Bad Request
    And the response body identifies "status" as the invalid field

  # NEG-3: Illegal status regression — business rule enforcement
  Scenario: Admin attempts to revert a completed order to pending
    Given I am authenticated as an Admin
    And an order exists with status "DELIVERED"
    When I submit a status update to "PENDING"
    Then I receive HTTP 422 Unprocessable Entity
    And the response body contains "Invalid status transition"

  # NEG-4: Negative stock value
  Scenario: Admin submits a negative stock quantity
    Given I am authenticated as an Admin
    When I submit a stock update for product "PROD-001" with quantity -10
    Then I receive HTTP 400 Bad Request
    And the response body identifies "quantity" as the invalid field

  # NEG-5: Non-integer stock value
  Scenario: Admin submits a decimal stock quantity
    Given I am authenticated as an Admin
    When I submit a stock update for product "PROD-001" with quantity 3.7
    Then I receive HTTP 400 Bad Request
    And the response body identifies "quantity" as must be a whole number

  # NEG-6: Order not found
  Scenario: Admin requests detail for a non-existent order
    Given I am authenticated as an Admin
    When I send GET /api/orders/999999
    Then I receive HTTP 404 Not Found
    And the response body contains "Order not found"

  # NEG-7: Unauthenticated request
  Scenario: Request arrives with no Authorization header
    Given no JWT is present in the request
    When I send GET /api/orders
    Then I receive HTTP 401 Unauthorized
    And the response body contains "Authentication required"
```

---

## 5. Planned API Contract

| Method | Endpoint | Auth Required | Success Code | Description |
|---|---|---|---|---|
| GET | `/api/orders` | Admin | 200 | Paginated order list, sorted by `created_at DESC` |
| GET | `/api/orders/:id` | Admin | 200 | Single order with all line items |
| PATCH | `/api/orders/:id/status` | Admin | 200 | Update fulfillment status with transition guard |
| GET | `/api/inventory` | Admin | 200 | All products with current stock quantities |
| PATCH | `/api/inventory/:id` | Admin | 200 | Update product stock quantity |

---

## 6. Phase 2 Next Steps (TDP — Failing Tests First)

1. Write failing test: `GET /api/orders` → returns paginated list, enforces admin-only access.
2. Write failing test: `PATCH /api/orders/:id/status` → valid transition + `DELIVERED → PENDING` regression guard.
3. Write failing test: `PATCH /api/inventory/:id` → valid update, rejects negative and decimal quantities.
