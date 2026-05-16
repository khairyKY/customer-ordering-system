# Agile Logbook — Phase 3: Test-Driven Implementation
## Member D — Orders Slice

**Owner:** Member D
**Phase:** 3 — Test-Driven Implementation
**Stack:** Python / FastAPI / SQLAlchemy / Pydantic
**Curriculum:** `CSE323_Project_Overview.pdf`
**Sprints:** 4 (one per PDF criterion)

---

## Sprint 3.1 — The Failing Test (Criterion 1)

**Date:** 2026-05-14
**Goal:** Establish mathematical boundaries for every endpoint and every padlock before writing any production code.

### 1. Functional Requirements Addressed
- All FR-D1..FR-D6 boundaries encoded as parametrized pytest cases
- HR-4, HR-5, HR-8 hidden requirements exercised as failing tests
- NFR-D5 (idempotency) encoded as replay test

### 2. Non-Functional Requirements Addressed
- **NFR-D3** (auditability) — every test asserts audit entry shape
- **NFR-D4** (data integrity) — illegal transition tests
- **NFR-D5** (idempotency) — webhook replay test

### 3. Golden Prompts Used

```
PROMPT 3.1.a — Transition Matrix Boundaries
─────────────────────────────────
Write parametrized pytest cases for orders_service.validate_transition.
Cover all 8 legal transitions from Phase 2 §3.2.2 AND at least 6 high-risk
illegal pairs (terminal states, regressions). Do NOT write the implementation.
The test must produce ImportError on first run.
```

```
PROMPT 3.1.b — HR-8 Boundary
─────────────────────────────────
Write a failing pytest case proving the HR-8 padlock: a PENDING order older
than 15 minutes that HAS a Payment.SUCCESS record must advance to CONFIRMED
when the sweep runs, NOT be cancelled.
```

```
PROMPT 3.1.c — Idempotency Boundary (NFR-D5)
─────────────────────────────────
Write a failing pytest: send the same payment.success webhook payload twice,
assert exactly 1 audit_log entry exists for that order_id.
```

### 4. Audits

| Check | Finding |
|---|---|
| All FR-D* have ≥ 1 failing test | ✅ 14 parametrized + 18 integration cases |
| Hidden requirements covered | ✅ HR-4, HR-5, HR-8 |
| First test run produces ImportError | ✅ confirms RED state |

### 5. Folder Structure (Sprint 3.1 End)

```
src/backend_python/
└── tests/
    ├── conftest.py
    └── test_orders.py               [Sprint 3.1 ✅ — failing tests only]
```

---

## Sprint 3.2 — The Edge Case Cage (Criterion 2)

**Date:** 2026-05-14
**Goal:** Encode every padlock as a Pydantic constraint that runs BEFORE service code.

### 1. Functional Requirements Addressed
FR-D2.b, FR-D5.b, NEG-2, NEG-4, NEG-5 all rejected at the schema layer.

### 2. Non-Functional Requirements Addressed
- NFR-D4 illegal-transition guard (service layer)
- NFR-D5 idempotency padlock (DB UNIQUE constraint)
- NFR-D2 auth gate (FastAPI dependency)

### 3. Golden Prompts Used

```
PROMPT 3.2.a — Schema Padlocks
─────────────────────────────────
Write app/schemas.py for orders. Every Pydantic constraint must trace
to a failing test from 3.1 OR a Phase 1 padlock requirement.
Report which test each padlock enforces.
```

```
PROMPT 3.2.b — Pure Validator
─────────────────────────────────
Implement orders_service.validate_transition as a pure function reading
_LEGAL: dict[str, set[str]] matching Phase 2 §3.2.2. No exception raising
in the validator; orchestrator decides.
```

### 4. Audits

| Check | Finding |
|---|---|
| Padlocks layered (schema → service → DB) | ✅ |
| Each padlock has a verifying test | ✅ table in Phase 3 doc §2.4 |
| Idempotency at DB level | ✅ `audit_log.idempotency_key UNIQUE` |

### 5. Folder Structure (Sprint 3.2 End)

```
src/backend_python/app/
├── schemas.py                      [✅ padlocks]
├── models.py                       [✅ UNIQUE constraint]
└── services/orders_service.py      [✅ _LEGAL]
```

---

## Sprint 3.3 — TDP Iteration (Criterion 3)

**Date:** 2026-05-14 evening + 2026-05-15
**Goal:** Drive implementation through 5 scoped prompts, never skip ahead.

### 1. Functional Requirements Addressed
Full FR-D1..FR-D6 across 5 iterations (full log in Phase 3 doc §3).

### 2. Non-Functional Requirements Addressed
NFR-D3 audit logging, NFR-D5 idempotency check at every mutation.

### 3. Golden Prompts Used

```
PROMPT 3.3.a — update_status Specification
─────────────────────────────────
Implement orders_service.update_status with exact signature:
update_status(db, *, order_id, new_status, actor, reason, idempotency_key=None)

MUST:
1. Short-circuit if idempotency_key already in audit_log
2. Fetch order; raise OrderNotFoundError if missing
3. Call validate_transition; raise IllegalTransitionError if False
4. Mutate order + commit + write AuditLog atomically
5. Return refreshed Order
Do NOT add behavior beyond these 5 steps.
```

```
PROMPT 3.3.b — Cron Sweep with HR-8 Padlock
─────────────────────────────────
Implement sweep_stale_pending(db) per FR-D6 + HR-8:
1. Find PENDING orders older than STALE_THRESHOLD_MINUTES
2. If Payment.SUCCESS exists → CONFIRMED ("payment_confirmed_late")
3. Otherwise → CANCELLED ("stale_pending_timeout")
4. actor="system" on both branches
5. Race protection: try/except DomainError, skip
6. Return {"cancelled": [...], "confirmed": [...]}
```

### 4. Audits

| Check | Finding |
|---|---|
| Each iteration scoped | ✅ 5 iters, one goal each |
| Boundary fit confirmed at each step | ✅ pytest run between iters |
| In-cycle bug found + fixed | ✅ missing `db.refresh()` caught by test |
| No fixing tests to match output | ✅ tests are the contract |

### 5. Folder Structure (Sprint 3.3 End)

```
src/backend_python/app/services/
├── orders_service.py             [✅ full service]
├── inventory_service.py          [✅]
└── sweep_service.py              [✅ cron + webhook handler]
```

---

## Sprint 3.4 — Vertical Slicing (Criterion 4)

**Date:** 2026-05-15
**Goal:** Complete UI/Logic/DB stack with documented failure resilience.

### 1. Functional Requirements Addressed
All FR-D1..FR-D6 routable end-to-end via HTTP.

### 2. Non-Functional Requirements Addressed
- NFR-D2 auth at API layer
- NFR-D3 audit at service layer
- NFR-D4 transition guard at service layer
- NFR-D5 idempotency at DB UNIQUE + service short-circuit

### 3. Golden Prompts Used

```
PROMPT 3.4.a — Routes (no try/except)
─────────────────────────────────
Implement app/routers/orders.py with list/detail/status routes.
1. Every route Depends(require_admin)
2. Routes do NOT try/except — global handler does conversion
3. Status update passes admin.user_id as actor
```

```
PROMPT 3.4.b — Global Exception Handler
─────────────────────────────────
Write app/exceptions.py with DomainError base + subclasses for every
domain error in the slice. Register a FastAPI exception_handler that
converts DomainError → JSONResponse with http_status + code + message.
Routes never see the exception — they assume happy path and return models.
```

### 4. Audits

| Check | Finding |
|---|---|
| 3 layers exist (UI deferred to Phase 4 frontend) | ✅ |
| 32 tests GREEN | ✅ |
| Failure resilience matrix complete (8 failure modes) | ✅ |
| No try/except in routes | ✅ |
| Audit written on every transition | ✅ admin + system paths |

### 5. Folder Structure (Sprint 3.4 End — Phase 3 COMPLETE)

```
src/backend_python/
├── app/
│   ├── main.py · settings.py · db.py · models.py · schemas.py
│   ├── security.py · dependencies.py · exceptions.py · scheduler.py
│   ├── routers/         (orders, inventory, events)
│   └── services/        (orders_service, inventory_service, sweep_service)
├── tests/
│   ├── conftest.py
│   └── test_orders.py   (32 cases — all GREEN)
└── scripts/seed.py
```

---

## Phase 3 Audit Verdict

| Criterion | Status |
|---|---|
| 1. Failing Test (mathematical boundary) | ✅ 14 parametrized matrix + 18 other tests, all written before impl |
| 2. Edge Case Cage (padlocks) | ✅ 3-layer padlocks, each with a verifying test |
| 3. TDP Iteration | ✅ 5 scoped prompts, boundary fit at each step |
| 4. Vertical Slicing | ✅ Logic + DB shipped (UI = Phase 4), 32 tests GREEN |

**Ready for Phase 4** — Testing Pyramid, Playwright POM, Verification vs Validation report.
