# Phase 2 — Design & Specification
## Team-Wide Combined Document

**Date:** 2026-05-13 · **Refreshed:** 2026-05-20
**Curriculum Source:** `CSE323_Project_Overview.pdf` — Phase 2
**Scope:** Gherkin, the QA refinement loop, ERD, UML (SSDs + Activity Diagrams), and API contracts. **All diagrams are Mermaid** so they render natively on GitHub (the earlier PlantUML blocks have been converted).

> **Stack note:** validation is **Pydantic v2**, persistence is **SQLAlchemy + SQLite**, the AI dependency is the **HuggingFace** inference API, and the canonical API prefix is **`/api/v1`** on port **8000**. Earlier drafts referencing Zod / Prisma / port 3001 were prototype-era and are superseded.

---

## Team Status

| Slice | Owner | Phase 2 Status |
|---|---|---|
| Checkout, Cart, Catalog | Member A (Khairy) | ✅ Complete — `docs/requirements/MEMBER_A_DESIGN_ARTIFACTS.md` (ERD + SSD + Activity + Gherkin) |
| Payment | Member B (Haitham) | ✅ Complete — `member_b_payments_phase2_design.md` |
| Tickets / Support | Member C (Diaa) | ✅ Complete — `member_c_tickets_phase2_design.md` |
| Auth, Orders, Admin | Member D (Mohamed) | ✅ Complete — `member_d_phase2_design.md`, `member_d_auth_phase2_design.md` |

---

# §1 — Entity Relationship Diagram (System-Wide)

The persisted core, owned across slices. The **cart** is session-scoped in-memory state (FastAPI `cart` router), not a SQL table; it materialises into `ORDER` + `ORDER_ITEM` rows at checkout. **Tickets** are likewise in-memory module state in the current build.

```mermaid
erDiagram
    USER ||--o{ ORDER : places
    ORDER ||--|{ ORDER_ITEM : contains
    ORDER ||--o{ AUDIT_LOG : "logs transitions"
    ORDER ||--o| PAYMENT : "settled by"
    ORDER_ITEM }o..|| PRODUCT : "snapshot of (no FK)"
    USER ||--o{ PAYMENT_METHOD : "saves"

    USER {
        string id PK
        string email UK
        string password_hash
        string role "customer|agent|admin"
        int failed_login_count
        datetime locked_until
    }
    PRODUCT {
        string id PK
        string name
        string sku UK
        int stock
        float price
    }
    ORDER {
        string id PK
        string status "PENDING..REFUNDED"
        string customer_id FK
        float subtotal
        float discount
        float tax
        float total
        json shipping_address
        datetime placed_at
        datetime updated_at
    }
    ORDER_ITEM {
        string id PK
        string order_id FK
        string product_id "value-copy, no FK"
        string product_name "snapshot"
        int quantity
        float unit_price "snapshot"
        float total_price
    }
    AUDIT_LOG {
        string id PK
        string order_id FK
        string from_status
        string to_status
        string actor
        string idempotency_key UK
        datetime occurred_at
    }
    PAYMENT {
        string id PK
        string order_id FK
        string status "PENDING|SUCCESS|FAILED"
        float amount
        string idempotency_key UK
    }
    PAYMENT_METHOD {
        string id PK
        string customer_id FK
        string brand
        string last4
        int exp_month
        int exp_year
        bool is_default
    }
```

**Design note:** `ORDER_ITEM.product_id` deliberately has **no foreign key** to `PRODUCT` — the catalog is a mirror, and order history must stay immutable even if a SKU is deleted. `product_name` and `unit_price` are snapshotted at order time.

---

# §2 — Gherkin Scripting (Combined)

## 2.1 Checkout — Member A

Full Gherkin (Add-to-Cart, Checkout-with-idempotency, Promo validation) lives in `docs/requirements/MEMBER_A_DESIGN_ARTIFACTS.md` §4. Representative scenario:

```gherkin
Feature: Checkout — Place Order with idempotency
  Scenario: Replayed click with same idempotency key is a no-op
    Given I am logged in and my cart contains "GPU-9000" x2
    And I have already submitted checkout with key "IDEM-002" -> order "ord_42"
    When I submit checkout again with key "IDEM-002"
    Then the returned order_id should be "ord_42"
    And only 1 row should exist in "orders" for that key
    And product stock should not be decremented a second time
```

## 2.2 Payment — Member B

```gherkin
Feature: Payment Processing
  Scenario Outline: Process credit-card payments with various card states
    Given a Customer is logged in with a valid JWT
    And the cart subtotal is $100.00 with a mandatory 10% tax
    When the Customer submits a payment with <card_status> credentials
    Then the system returns a <response_type> response
    And the transaction status is "<final_status>"

    Examples:
      | card_status        | response_type     | final_status |
      | valid              | 201 Created       | SUCCEEDED    |
      | expired            | 422 Unprocessable | FAILED       |
      | insufficient_funds | 422 Unprocessable | FAILED       |
      | stolen             | 403 Forbidden     | REJECTED     |

  Scenario: Promo code exceeding the subtotal is clamped to zero
    Given a cart subtotal of $40.00
    And a promo "GIANT_DISCOUNT" worth $50.00
    When the Customer applies the promo
    Then the taxable subtotal is clamped to $0.00
    And the 10% tax is $0.00 and the final total is $0.00
```

## 2.3 Tickets — Member C

> Score → Priority: `< 0.25` CRITICAL · `0.25–0.49` HIGH · `0.50–0.74` MEDIUM · `≥ 0.75` LOW

```gherkin
Feature: Ticket System Vertical Slice
  Background:
    Given the FastAPI backend is running at "http://localhost:8000"

  @FR-01 @Auth
  Scenario: Successfully create a ticket (happy path)
    Given the user is authenticated with a valid "customer" JWT
    When they POST to "/api/v1/tickets" with subject "Missing Item"
      and body "My order #12345 is missing the wireless mouse."
    Then the response status is 201
    And the ticket "status" is "OPEN"
    And the ticket "userId" matches the JWT "sub" claim

  @FR-04 @RoleGate
  Scenario: Agent retrieves the triage queue sorted by priority
    Given the user is authenticated as an "agent"
    When they GET "/api/v1/tickets/triage"
    Then the response status is 200
    And tickets are sorted CRITICAL > HIGH > MEDIUM > LOW
    And equal-priority tickets are ordered oldest-first

  @EC-03 @Fallback
  Scenario: HuggingFace timeout falls back to MEDIUM
    Given the HuggingFace API does not respond within 5000ms
    When a customer submits a new ticket
    Then the response status is 201
    And the ticket "priority" is "MEDIUM"
    And the ticket "sentiment_source" is "fallback"
```

## 2.4 Orders — Member D

```gherkin
Scenario: Admin fetches the paginated order list (D-1)
  Given I hold a JWT with claim role = "admin"
  And 25 Order records exist
  When I GET /api/v1/orders?page=1&limit=20
  Then I receive 200 OK with an "orders" array of 20 items
  And "pagination" = { page:1, limit:20, total_count:25, total_pages:2 }
  And orders are sorted by placed_at DESC

Scenario: Stale paid order is advanced, not cancelled (D-6 / HR-8)
  Given an Order with status "PENDING" placed 16 minutes ago
  And a Payment with status "SUCCESS" for this order
  When the sweep job runs
  Then the order status becomes "CONFIRMED" (not "CANCELLED")
  And the action is idempotent on repeat runs
```

---

# §3 — The Refinement Loop (Combined QA Audit)

Per PDF: eliminate unquantifiable adjectives, replace with measurable metrics.

| Vague Term | Measurable Replacement | Slice |
|---|---|---|
| "Fast" | API ≤ 1500 ms P95 (Tickets); UI repaint < 500 ms P95 (Orders) | C, D |
| "Secure" | JWT HS256 + `role` claim; Bcrypt password hash; PII redacted in logs | All |
| "Reliable" | Fail-closed fallback to MEDIUM on HF failure | C |
| "Duplicate" | SHA-256 hash + 300 s (Payment) / 600 s (Tickets) window | B, C |
| "Stale" | `status == PENDING AND placed_at < now − 15 min` | B → D |
| "Extreme" | `body > 2000` chars OR `subject > 120` chars | C |
| "Urgency" | Priority ENUM `CRITICAL / HIGH / MEDIUM / LOW` | C |
| "Idempotent" | Replaying the same key within the window → zero side effects | B, D |

Full audits: `docs/requirements/QA_AUDIT_LOG.md`, `member_c_tickets_phase2_design.md` §1 (12-row table), `member_d_phase2_design.md` §2.

---

# §4 — System Sequence Diagrams (Mermaid)

## 4.1 Payment — Member B

### Happy Path
```mermaid
sequenceDiagram
    participant C as Customer (UI)
    participant P as Payment API
    participant A as Auth (Member D)
    participant G as Stripe Gateway
    participant D as Database

    C->>P: POST /api/v1/payment {cart, idempotency_key}
    P->>A: verify Bearer JWT
    A-->>P: 200 {role: customer, user_id}
    P->>P: total = Max(0, subtotal - discount) * 1.10
    P->>G: authorize & capture
    G-->>P: 200 {txn_id}
    P->>D: BEGIN -> insert payment(SUCCESS) + order PAID -> COMMIT
    D-->>P: ok
    P-->>C: 201 {transaction_id, status: SUCCEEDED}
```

### Failure Path — Double-Submission Block
```mermaid
sequenceDiagram
    participant C as Customer (UI)
    participant P as Payment API

    C->>P: POST /api/v1/payment (request #1, key=K)
    P->>P: store key K (300s window)
    Note over P: processing first request...
    C->>P: POST /api/v1/payment (request #2, key=K)
    P->>P: key K already seen within window
    P-->>C: 409 Conflict {cached first result}
```

## 4.2 Tickets — Member C (converted from PlantUML to Mermaid)

### Happy Path — Ticket Creation
```mermaid
sequenceDiagram
    participant Customer
    participant API as Ticket API (FastAPI)
    participant Auth as get_current_user (Member D)
    participant DB as Ticket Store
    participant AI as HuggingFace API

    Customer->>API: POST /api/v1/tickets (Bearer JWT)
    API->>Auth: verify token
    Auth-->>API: {user_id, role: customer}
    API->>API: validate (subject 5-120, body 10-2000) + sanitize_html
    API->>DB: dedup check SHA-256(user:subject:body) in 600s
    DB-->>API: no duplicate
    API->>AI: POST sentiment {text}
    AI-->>API: {score: 0.05}
    API->>API: score_to_priority(0.05) -> CRITICAL
    API->>DB: insert ticket(status: OPEN)
    DB-->>API: {ticket_id}
    API-->>Customer: 201 {ticket_id, priority: CRITICAL, status: OPEN}
```

### Failure Paths — Auth / Validation / Dedup / HF Timeout / NaN
```mermaid
sequenceDiagram
    participant Customer
    participant API as Ticket API (FastAPI)
    participant Auth as get_current_user
    participant DB as Ticket Store
    participant AI as HuggingFace API

    Customer->>API: POST /api/v1/tickets (Bearer JWT)
    API->>Auth: verify token
    alt invalid / missing JWT
        Auth-->>API: error
        API-->>Customer: 401 Unauthorized
    else valid JWT
        Auth-->>API: {user_id, role}
        alt subject/body violate length
            API-->>Customer: 422 Validation failed
        else valid payload
            API->>DB: dedup check
            alt duplicate within 600s
                DB-->>API: existing ticket
                API-->>Customer: 409 Conflict
            else no duplicate
                API->>AI: POST sentiment
                alt HF timeout over 5000ms
                    AI--xAPI: AbortError
                    API->>DB: insert(priority MEDIUM, source "fallback")
                    API-->>Customer: 201 (MEDIUM, fallback)
                else HF returns NaN / non-dict
                    AI-->>API: {score: NaN}
                    API->>DB: insert(priority MEDIUM, source "score_invalid")
                    API-->>Customer: 201 (MEDIUM, score_invalid)
                end
            end
        end
    end
```

## 4.3 Orders — Member D

### PATCH /orders/{id}/status — Happy + 422
```mermaid
sequenceDiagram
    participant Admin
    participant API as Orders API
    participant SVC as orders_service
    participant DB as Database

    Admin->>API: PATCH /api/v1/orders/{id}/status {status}
    API->>API: require_admin (JWT role check)
    API->>SVC: update_status(id, status)
    SVC->>DB: find order by id
    alt order found and transition legal
        SVC->>SVC: validate_transition(from, to) = true
        SVC->>DB: update status + insert audit_log
        SVC-->>API: updated order
        API-->>Admin: 200 {id, status, updated_at}
    else illegal transition
        SVC->>SVC: validate_transition = false
        API-->>Admin: 422 Invalid status transition
    end
```

## 4.4 Checkout — Member A

The full Add-to-Cart and Checkout/Order-Submission SSDs are in `docs/requirements/MEMBER_A_DESIGN_ARTIFACTS.md` §2 (Mermaid `sequenceDiagram`), including the payment handoff, idempotency key, and the FOR UPDATE / ROLLBACK stock-conflict branch.

---

# §5 — Activity Diagrams (Mermaid)

## 5.1 Payment — Member B
```mermaid
flowchart TD
    Start([Start Payment]) --> Auth[Verify Bearer JWT]
    Auth --> Valid{Valid?}
    Valid -- No --> E401[401 Unauthorized]
    Valid -- Yes --> Calc[Compute Subtotal minus Discount]
    Calc --> Clamp[Apply Max 0 floor]
    Clamp --> Tax[Add 10 percent tax]
    Tax --> Gate[Call Payment Gateway]
    Gate --> Resp{Gateway status?}
    Resp -- 200 --> Commit[Atomic DB commit]
    Resp -- 4xx or 5xx --> Fail[Log failure, return 422]
    Commit --> Done([201 Created])
```

## 5.2 Tickets — Member C (converted from PlantUML to Mermaid)
```mermaid
flowchart TD
    Start([POST /api/v1/tickets]) --> JWT{Valid JWT?}
    JWT -- No --> E401[401 Unauthorized]
    JWT -- Yes --> Valid{subject 5-120 AND body 10-2000?}
    Valid -- No --> E422[422 Validation failed]
    Valid -- Yes --> Hash[SHA-256 user:subject:body]
    Hash --> Dedup{Hash seen within 600s?}
    Dedup -- Yes --> E409[409 Duplicate]
    Dedup -- No --> AI[Call HuggingFace sentiment]
    AI --> Timeout{Response within 5000ms?}
    Timeout -- No --> FB1[priority MEDIUM, source fallback]
    Timeout -- Yes --> NaN{Score NaN or non-dict?}
    NaN -- Yes --> FB2[priority MEDIUM, source score_invalid]
    NaN -- No --> Map[Map score to priority band, source hf_model]
    FB1 --> Insert[Insert ticket OPEN]
    FB2 --> Insert
    Map --> Insert
    Insert --> Ok([201 Created])
```

## 5.3 Orders — Member D
```mermaid
flowchart TD
    Start([PATCH /orders/:id/status]) --> JWT{Valid JWT?}
    JWT -- No --> E401[401 Unauthorized]
    JWT -- Yes --> Role{role == admin?}
    Role -- No --> E403[403 Forbidden]
    Role -- Yes --> Schema{Body matches status enum?}
    Schema -- No --> E422a[422 Validation]
    Schema -- Yes --> Find[Fetch order by id]
    Find --> Found{Order found?}
    Found -- No --> E404[404 Not Found]
    Found -- Yes --> Trans{Transition legal in matrix?}
    Trans -- No --> E422b[422 Illegal transition]
    Trans -- Yes --> Update[Update DB + write audit_log]
    Update --> Ok([200 OK])
```

## 5.4 Checkout — Member A
Add-to-Cart, Checkout/Place-Order, and Update-Cart-Quantity activity diagrams (with stock-headroom, promo-validation, and payment-outcome branches) are in `MEMBER_A_DESIGN_ARTIFACTS.md` §3.

---

# §6 — API Contracts (Information Hiding)

## 6.1 System-Wide Public Endpoint Map (current routers)

| Endpoint | Slice | Auth |
|---|---|---|
| `POST /api/v1/auth/{register,login}` | Auth (D) | public |
| `GET/POST/PUT/DELETE /api/v1/cart*` | Checkout (A) | session/JWT |
| `GET /api/v1/products`, `GET /api/v1/products/{id}` | Catalog (A) | public |
| `POST /api/v1/payment`, payment-methods CRUD | Payment (B) | Bearer JWT (customer) |
| `POST/GET /api/v1/tickets` | Tickets (C) | Bearer JWT (customer) |
| `GET /api/v1/tickets/triage`, `PATCH /api/v1/tickets/{id}/status` | Tickets (C) | Bearer JWT (agent) |
| `GET/PATCH /api/v1/orders*`, `GET/PATCH /api/v1/inventory*` | Orders (D) | Bearer JWT (admin) |
| `POST /api/v1/events/payment.success` | Orders (D) | internal event |

## 6.2 Information Hiding Summary

| Slice | Public Contract | Hidden |
|---|---|---|
| Payment | `{transaction_id, status, summary}` | Stripe response, tax engine, promo validator, DB txn IDs |
| Tickets | `{ticket_id, priority, status, sentiment_source}` | dedup-hash algorithm, HF model choice, in-memory store layout |
| Orders | `{id, status, updated_at}` | transition-matrix internals, audit-log mechanism, pagination math |
| Checkout | `{cart, subtotal, tax, total}` | server-side re-pricing, in-memory cart structure |

---

# §7 — Phase 2 Status

| Item | Owner | Status |
|---|---|---|
| Auth Phase 2 (Gherkin + SSD + activity + contract) | Member D | ✅ `member_d_auth_phase2_design.md` |
| PlantUML → Mermaid conversion (Tickets) | Member C / docs | ✅ Done in this refresh — §4.2, §5.2 |
| System-wide ERD | Member A / docs | ✅ §1 above + `MEMBER_A_DESIGN_ARTIFACTS.md` §1 |
| Catalog Phase 2 | Member A | ✅ Owned; endpoints in `catalog.py` |

---

*End of Combined Phase 2 Document.*
