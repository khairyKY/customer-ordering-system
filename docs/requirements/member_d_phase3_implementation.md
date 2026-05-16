# Phase 3: Test-Driven Implementation
## Member D — Admin & Order Fulfillment (Orders Slice)

**Date:** 2026-05-15
**Slice:** `orders`
**Owner:** Member D
**Curriculum Source:** `CSE323_Project_Overview.pdf` — Phase 3
**Phase 2:** [`member_d_phase2_design.md`](./member_d_phase2_design.md)
**Implementation:** `src/backend_python/` (FastAPI + SQLAlchemy + Pydantic)

> **Stack note:** Phase 1+2 docs were written generically (transition matrix, endpoint contracts, padlocks).
> Phase 3 implementation is Python/FastAPI. Same contracts, different runtime. The Node.js reference
> attempt was discarded after the team agreed Member D's slices ship as Python services.

---

## Deliverable Map (per CSE323 PDF, Phase 3)

| PDF Criterion | Section |
|---|---|
| **1. The Failing Test** — establish a mathematical boundary | §1 |
| **2. The Edge Case Cage** — boundary / threshold / extreme padlocks | §2 |
| **3. Iteration** — prompt the AI until logic fits the test boundary | §3 |
| **4. Vertical Slicing** — UI / Logic / DB delivered as one stack | §4 |

---

## 1. The Failing Test — Mathematical Boundaries

All failing tests were authored **before** any implementation existed. Each test below defines a strict mathematical boundary that the production code must satisfy.

### 1.1 Transition matrix boundaries (`tests/test_orders.py`)

```python
# Boundary: 8 legal transitions per Phase 2 §3.2.2
@pytest.mark.parametrize("from_,to", [
    ("PENDING", "CONFIRMED"),     ("PENDING", "CANCELLED"),
    ("CONFIRMED", "PROCESSING"),  ("CONFIRMED", "CANCELLED"),
    ("PROCESSING", "SHIPPED"),    ("PROCESSING", "CANCELLED"),
    ("SHIPPED", "DELIVERED"),     ("DELIVERED", "REFUNDED"),
])
def test_validate_transition_legal(from_, to):
    assert orders_service.validate_transition(from_, to) is True

# Boundary: terminal states + illegal regressions
@pytest.mark.parametrize("from_,to", [
    ("DELIVERED", "PENDING"),    ("CANCELLED", "PENDING"),
    ("REFUNDED", "PENDING"),     ("PENDING", "SHIPPED"),
    ("SHIPPED", "PENDING"),      ("SHIPPED", "PROCESSING"),
])
def test_validate_transition_illegal(from_, to):
    assert orders_service.validate_transition(from_, to) is False
```

### 1.2 Pagination boundary

```python
def test_list_orders_default_pagination(client, db, admin_headers):
    # Seed 25 PENDING orders with strictly increasing placed_at
    for i in range(25):
        db.add(Order(id=f"ord_{i:03d}", status=OrderStatus.PENDING.value, ...))
    db.commit()

    r = client.get("/api/v1/orders", headers=admin_headers)
    assert r.status_code == 200
    body = r.json()
    # Boundary: default limit = 20 items
    assert len(body["orders"]) == 20
    # Boundary: pagination math
    assert body["pagination"] == {"page": 1, "limit": 20, "total_count": 25, "total_pages": 2}
```

### 1.3 HR-8 padlock boundary — paid stale orders MUST advance, not cancel

```python
def test_sweep_advances_paid_stale_to_confirmed(db):
    """HR-8 — paid stale orders advance to CONFIRMED, not CANCELLED."""
    db.add(Order(id="ord_paid", status="PENDING",
                 placed_at=datetime.now(timezone.utc) - timedelta(minutes=16), ...))
    db.add(Payment(order_id="ord_paid", status="SUCCESS", amount=110.0))
    db.commit()

    result = sweep_stale_pending(db)
    assert "ord_paid" in result["confirmed"]
    assert db.get(Order, "ord_paid").status == "CONFIRMED"  # NOT "CANCELLED"
```

### 1.4 Idempotency boundary (NFR-D5)

```python
def test_payment_success_webhook_is_idempotent(client, db):
    payload = {"order_id": "ord_xyz", "payment_id": "p_1",
               "idempotency_key": "idem-1", "amount": 110, "occurred_at": "..."}
    client.post("/api/v1/events/payment.success", json=payload)
    client.post("/api/v1/events/payment.success", json=payload)  # replay

    # Boundary: exactly 1 audit log entry despite 2 webhook calls
    audit_entries = db.query(AuditLog).filter_by(order_id="ord_xyz").all()
    assert len(audit_entries) == 1
```

### 1.5 Boundary summary table

| Test ID | Boundary established | Source code that must satisfy |
|---|---|---|
| T-D-MATRIX-LEGAL × 8 | All 8 legal transitions in §3.2.2 succeed | `_LEGAL` dict in `orders_service.py` |
| T-D-MATRIX-ILLEGAL × 6 | All illegal regressions return false | Same |
| T-D-PAGE-DEFAULT | `limit=20`, math: `ceil(25/20) = 2 pages` | `find_all()` query offset/limit math |
| T-D-PAGE-2 | Page 2 returns remaining 5 | Same |
| T-D-DETAIL-OK | Order detail includes items, customer, shipping address | `OrderDetail` schema field set |
| T-D-DETAIL-404 | Missing id → `OrderNotFoundError` → 404 | `find_by_id()` raises domain error |
| T-D-STATUS-OK | PENDING → CONFIRMED returns 200 | `update_status()` mutation + audit |
| T-D-STATUS-422 | DELIVERED → PENDING returns 422 | `validate_transition()` check |
| T-D-STATUS-400 | `{"status":"HACKED"}` returns 422 (Pydantic Literal) | `UpdateStatusRequest` schema |
| T-D-INV-LOW | `stock < 5` → `low_stock=true` in response | `_decorate()` in `inventory_service.py` |
| T-D-INV-NEG / DEC / OVER | Invalid stock → 422 | `UpdateStockRequest` Pydantic constraints |
| T-D-SWEEP-CANCEL | Stale no-payment → CANCELLED | `sweep_stale_pending()` branch |
| T-D-SWEEP-CONFIRM (HR-8) | Stale + Payment.SUCCESS → CONFIRMED | Same — payment lookup before cancel |
| T-D-WEBHOOK-IDEMPOTENT | Replay webhook → 1 audit entry | `idempotency_key` short-circuit in `update_status()` |

---

## 2. The Edge Case Cage — Padlocks

Three layers of padlocks, applied in order — each blocks invalid data before it can reach the next layer.

### 2.1 Layer 1: Pydantic schema padlocks (`app/schemas.py`)

| Padlock | Field | Rule | Blocks |
|---|---|---|---|
| Type | `UpdateStatusRequest.status` | `Literal[7-status-enum]` | NEG-2 ("HACKED" status), arbitrary strings |
| Required | `UpdateStatusRequest` | `status` is required | HR-5 (empty body `{}`) |
| Bounds | `UpdateStockRequest.stock` | `int strict=True, ge=0, le=100_000` | NEG-4 (negative), NEG-5 (decimal `3.7`), HR-4 (`MAX_SAFE_INTEGER`) |
| Query | `?page` | `int, ge=1` | page=0 or negative |
| Query | `?limit` | `int, ge=1, le=100` | unbounded result sets |

### 2.2 Layer 2: Service-layer padlocks (`app/services/orders_service.py`)

| Padlock | Mechanism | Blocks |
|---|---|---|
| Transition matrix | `_LEGAL` dict lookup; raises `IllegalTransitionError` | NEG-3 (DELIVERED→PENDING) and 41 other illegal pairs |
| Order existence | `db.get(Order, id)` returning None → `OrderNotFoundError` | NEG-6 (unknown id), status-update on missing order |
| Idempotency | `AuditLog.idempotency_key` unique constraint + short-circuit lookup | Replay attacks, duplicate webhook fires |

### 2.3 Layer 3: DB-layer padlocks (`app/models.py`)

| Padlock | Mechanism | Blocks |
|---|---|---|
| `audit_log.idempotency_key` unique | SQLAlchemy `unique=True` | Race condition where two requests with same key try to write simultaneously |
| `orders.status` indexed | Filter performance | DoS via expensive scans |
| FK `audit_log.order_id` ON CASCADE | Audit entries removed when order deleted | Orphaned audit rows |

### 2.4 Padlock → Test mapping

Every padlock is enforced by at least one failing test from §1:

| Padlock | Verifying test |
|---|---|
| `Literal[OrderStatus]` | `test_update_status_unknown_value_422` |
| `status` required | `test_update_status_empty_body_422` |
| `stock` integer | `test_update_stock_rejects_invalid[3.7]` |
| `stock >= 0` | `test_update_stock_rejects_invalid[-10]` |
| `stock <= 100_000` | `test_update_stock_rejects_invalid[999999]` |
| Transition matrix | 14 parametrized cases + `test_update_status_illegal_transition_422` |
| Idempotency unique | `test_payment_success_webhook_is_idempotent` |

---

## 3. TDP Iteration Log

Implementation followed a strict prompt sequence. Each iteration was scoped — no implementation prior to the failing test for that scope.

### Iteration 1 — Establish boundaries (no implementation allowed)
**Prompt:**
> Write failing pytest scenarios for `orders_service.validate_transition` covering all 8 legal transitions and 6 high-risk illegal ones. Do NOT write the implementation. The test must reference `from app.services.orders_service import validate_transition` which does not yet exist.

**Output:** `tests/test_orders.py::test_validate_transition_legal` + `_illegal` parametrized cases.
**Verification:** `pytest tests/test_orders.py` → `ImportError: cannot import name 'validate_transition'` — canonical RED state.

### Iteration 2 — Define padlocks
**Prompt:**
> Write `app/schemas.py` Pydantic models for `UpdateStatusRequest`, `UpdateStockRequest`, `OrderListResponse`, and friends. Every field's type/constraint must be traceable to a failing test from Iteration 1 OR to a Phase 1 hidden requirement (HR-4 upper bound, HR-5 empty body).

**Output:** `UpdateStatusRequest.status: OrderStatusLiteral`, `UpdateStockRequest.stock: Annotated[int, Field(ge=0, le=100_000, strict=True)]`, etc.
**Verification:** Each Pydantic constraint matched against the test boundary table from §1.

### Iteration 3 — Service layer
**Prompt:**
> Implement `app/services/orders_service.py` with `validate_transition`, `find_all`, `find_by_id`, `update_status`. The implementation must make the Iteration 1 tests pass and use the Iteration 2 schemas. Encode the 7×7 transition matrix as a `dict[str, set[str]]` named `_LEGAL`.

**Output:** Service module with pure-function transition matrix + DB-backed query methods + audited mutation.
**Verification:** `pytest tests/test_orders.py -k validate_transition` → all 14 cases GREEN. Pagination + status-update tests GREEN after one fix (initially I forgot `db.refresh(order)` after status update; test caught it).

### Iteration 4 — HTTP routes
**Prompt:**
> Implement `app/routers/orders.py` exposing GET /orders, GET /orders/{id}, PATCH /orders/{id}/status. Use FastAPI dependencies for auth (`require_admin`). Domain exceptions are converted to HTTP responses by the global handler — routes do NOT use try/except.

**Output:** Three route functions, all admin-gated, all using the service.
**Verification:** Integration tests in `tests/test_orders.py` → all green.

### Iteration 5 — Cron sweep + payment webhook
**Prompt:**
> Implement `sweep_stale_pending(db)` per Phase 1 FR-D6 and the HR-8 padlock: stale orders with Payment.SUCCESS must advance to CONFIRMED, not be cancelled. Implement `handle_payment_success(db, payload)` per Phase 2 §5.4 with idempotency on the audit_log.idempotency_key column.

**Output:** `app/services/sweep_service.py` + `app/routers/events.py` + `app/scheduler.py`.
**Verification:** `test_sweep_advances_paid_stale_to_confirmed` GREEN on first run (HR-8 padlock works).
`test_payment_success_webhook_is_idempotent` GREEN (idempotency_key column unique constraint prevents duplicate audit rows).

### Final boundary fit
| Test | Boundary | Implementation that satisfies it |
|---|---|---|
| `validate_transition` legal × 8 | Matrix accepts | `_LEGAL` dict has the 8 entries |
| `validate_transition` illegal × 6 | Matrix rejects | Same — those pairs are not in `_LEGAL` |
| Pagination math (25 → 2 pages) | `ceil(25/20)` | `math.ceil(total_count / limit)` |
| HR-8 paid stale → CONFIRMED | Branch on Payment.SUCCESS | `if payment is not None` branch in sweep |
| Idempotency (1 audit despite 2 webhooks) | Unique constraint + short-circuit | `AuditLog.idempotency_key unique=True` + check in `update_status` |

---

## 4. Vertical Slicing — UI / Logic / DB

```
┌─────────────────────────────────────────────────────────────┐
│                       UI Layer                              │
│  (Next turn — React pages in src/frontend/src/features/     │
│   orders/, inventory/. Currently using Swagger UI for       │
│   manual testing at http://localhost:8000/docs.)            │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP — Bearer JWT
┌────────────────────────▼────────────────────────────────────┐
│                  Logic / API Layer                          │
│  app/routers/orders.py        ── GET /orders, /{id}         │
│  app/routers/orders.py        ── PATCH /{id}/status         │
│  app/routers/inventory.py     ── GET /inventory, PATCH /:id │
│  app/routers/events.py        ── POST /events/payment.success│
│  app/services/orders_service.py    ── transition matrix     │
│  app/services/inventory_service.py ── stock + low_stock     │
│  app/services/sweep_service.py     ── cron + webhook handler│
│  app/schemas.py                    ── Pydantic padlocks     │
│  app/dependencies.py               ── require_admin gate    │
│  app/scheduler.py                  ── APScheduler */5 min   │
└────────────────────────┬────────────────────────────────────┘
                         │ SQLAlchemy 2.0
┌────────────────────────▼────────────────────────────────────┐
│                   Database Layer                            │
│  orders                                                     │
│  order_items                                                │
│  audit_log         (idempotency_key UNIQUE)                 │
│  products          (RFC-D001 sandbox mirror)                │
│  payments          (read-only mirror of Member B's data)    │
└─────────────────────────────────────────────────────────────┘
```

### 4.1 File inventory

| Layer | File | Lines | Role |
|---|---|---|---|
| API | `app/routers/orders.py` | ~50 | HTTP surface for orders |
| API | `app/routers/inventory.py` | ~30 | HTTP surface for inventory |
| API | `app/routers/events.py` | ~25 | Payment webhook |
| Logic | `app/services/orders_service.py` | ~95 | Transition matrix + queries |
| Logic | `app/services/inventory_service.py` | ~35 | Stock + low_stock decoration |
| Logic | `app/services/sweep_service.py` | ~85 | Cron sweep + webhook handler |
| Logic | `app/schemas.py` (orders portion) | ~70 | Pydantic padlocks |
| Logic | `app/dependencies.py` | ~55 | `require_admin` gate |
| Infra | `app/scheduler.py` | ~45 | APScheduler wrapper |
| DB | `app/models.py` (orders portion) | ~80 | Order, OrderItem, AuditLog, Product, Payment |
| Tests | `tests/test_orders.py` | ~280 | 20+ test cases covering all 4 criteria |

### 4.2 Failure resilience matrix

| Failure | Layer that catches it |
|---|---|
| Unknown status `"HACKED"` | Pydantic schema (HTTP 422) |
| Empty body `{}` | Pydantic schema (HTTP 422) |
| Stock = -10 / 3.7 / 999999 | Pydantic schema (HTTP 422) |
| Illegal transition DELIVERED → PENDING | `validate_transition()` (HTTP 422) |
| Unknown order id | `find_by_id()` raises `OrderNotFoundError` (HTTP 404) |
| Missing/invalid JWT | `require_admin` dep (HTTP 401/403) |
| Duplicate webhook replay | `idempotency_key` unique constraint + service short-circuit |
| Stale pending order paid but app crashed mid-transition | Cron sweep next run detects Payment.SUCCESS, advances order |

### 4.3 Test count by criterion (Testing Pyramid input for Phase 4)

| Type | Count | Examples |
|---|---|---|
| Unit | 16 | Transition matrix (14 parametrized), `_decorate()`, transition `_LEGAL` membership |
| Integration | 12 | HTTP routes via FastAPI TestClient, DB round-trip via in-memory SQLite |
| Cron / Event | 4 | Sweep happy path, sweep HR-8 path, sweep skip-fresh, webhook idempotency |

Total: **32 test cases.** All currently GREEN.

---

## 5. Exit Criteria — Phase 3

- [x] **Criterion 1** — Failing tests committed for every endpoint + every padlock + HR-8 + idempotency
- [x] **Criterion 2** — Three-layer padlocks (Pydantic + service + DB) all mapped to failing tests
- [x] **Criterion 3** — TDP iteration log with 5 distinct prompts, each scoped
- [x] **Criterion 4** — Vertical slice diagram + file inventory + failure resilience matrix
- [x] All 32 tests passing locally on Python 3.12 / SQLite
- [x] Logbook entry written (`docs/logbook/member_d_phase3_agile_logbook.md`)
- [ ] Phase 4 — Testing Pyramid + Playwright POM + Verification/Validation report (next doc)
