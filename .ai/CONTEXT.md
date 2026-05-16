# SYSTEM CONTEXT: CSE323 Customer Ordering System (COS)

## 1. MANDATE: AI-NATIVE VERTICAL SLICING
- **Architecture:** Feature-Based Vertical Slicing (Mandated by CSE322/323 Curriculum).
- **Human Role:** Orchestrator (Architect & Reviewer).
- **AI Role:** Labor (Logic Generation within boundaries).
- **Protocol:** Test-Driven Prompting (TDP) - Failing test MUST precede implementation.

## 2. DIRECTORY STRUCTURE
- `src/frontend/`: React/Tailwind code (Vertical slices under `features/`).
- `src/backend/`: Node/Express code (Vertical slices under `features/`).
- `src/database/`: Prisma models and migrations.

## 3. FEATURE OWNERSHIP (Updated 2026-05-13)
- **Member A (Khairy):** Checkout & Shopping Cart System.
- **Member B:** Payment.
- **Member C:** Tickets / Support System.
- **Member D:** Admin & Order Fulfillment + **Auth & User Management** (two slices).
- **Catalog:** ⚠️ Currently unowned — reassignment pending team decision.

## 4. FEATURE SLICE STATUS

| Slice | Owner | Status | Last Completed Task | Blockers |
|---|---|---|---|---|
| checkout | Member A | 🟢 Complete | Sprint 2 + Checkout Button | None |
| auth | Member D | 🟢 Phase 4 Complete | Phase 4: Testing Pyramid + Playwright POM + Verification/Validation report — 16/16 tests green; coverage ≥ 91% on all auth modules; Python/FastAPI implementation in `src/backend_python/` | Frontend pages pending (next turn) |
| catalog | Member C(?) | 🟡 In Progress | `feature/catalog-integration` branch active on origin | RFC-D001 unblocking depends on owner confirmation |
| payment | Member B | 🟢 Phase 3 Complete | Phase 3: TDP Implementation | None |
| orders | Member D | 🟢 Phase 4 Complete | Phase 4: Testing Pyramid + Playwright POM + V&V report — 32/32 tests green; coverage ≥ 87% on services/routers; Python/FastAPI implementation in `src/backend_python/` | Frontend pages pending; `payment.success` webhook contract published, Member B can integrate; NFR-D4.b optimistic concurrency deferred |

## Sprint 1 Execution Log
**Date:** 2026-05-10
**Status:** Initialized & Complete

### Files Created:
- **Database:** `src/database/schema.sql` (Mock/Initial schema for carts and cart_items).
- **Backend:**
  - `src/backend/controllers/cartController.js` (In-memory cart logic and total calculation).
  - `src/backend/routes/cartRoutes.js` (API endpoints: `GET /` and `POST /add`).
  - `src/backend/server.js` (Express entry point with CORS and JSON middleware).
- **Frontend:**
  - `src/frontend/src/api/cartApi.js` (Axios client for checkout slice communication).
  - `src/frontend/src/components/CartWidget.jsx` (UI state manager for cart display and test-add functionality).
  - `src/frontend/src/App.jsx` (Root layout integration).

### API Routes Established:
- `GET http://localhost:3001/api/cart` - Returns current cart state.
- `POST http://localhost:3001/api/cart/add` - Adds mock item to in-memory store.

### Success Criteria Confirmation:
- [x] Backend initialized with Express/Node.
- [x] Database mock schema defined.
- [x] Frontend can fetch and display empty cart state.
- [x] "Add Item" button triggers backend calculation and UI refresh.
- [x] Tax calculation (8%) verified in controller logic.

## Sprint 2 Execution Log
**Date:** 2026-05-10
**Status:** Complete

### Files Created/Updated:
- **Database:** `src/database/schema.sql` updated with `products` table.
- **Backend:**
  - `src/backend/controllers/productController.js` (Mock catalog data and retrieval).
  - `src/backend/routes/productRoutes.js` (Endpoint: `GET /`).
  - `src/backend/controllers/cartController.js` (Updated to handle stock validation, quantity updates, and removals).
  - `src/backend/routes/cartRoutes.js` (Added `PUT /update` and `DELETE /remove`).
  - `src/backend/server.js` (Integrated product routes).
- **Frontend:**
  - `src/frontend/src/api/productApi.js` (Client for catalog).
  - `src/frontend/src/api/cartApi.js` (Added update/remove methods).
  - `src/frontend/src/components/ProductGrid.jsx` (Responsive grid display for products).
  - `src/frontend/src/components/CartWidget.jsx` (Upgraded with quantity controls and remove actions).
  - `src/frontend/src/App.jsx` (Layout for Catalog and Cart side-by-side).

### API Routes Established:
- `GET http://localhost:3001/api/products` - Returns 6 mock products.
- `PUT http://localhost:3001/api/cart/update` - Modifies item quantity with stock check.
- `DELETE http://localhost:3001/api/cart/remove` - Removes item from session cart.

### Success Criteria Confirmation:
- [x] Product catalog fetchable from backend.
- [x] Stock validation enforced during add/update.
- [x] Cart subtotal and tax (10%) recalculated on every change.
- [x] UI allows full catalog-to-cart lifecycle (Add -> Update -> Remove).

### Feature Log: Checkout Button (feat/checkout-button)
**Date:** 2026-05-10
**Status:** Feature Initialized

- **Component:** `CartWidget.jsx` updated with a "Proceed to Checkout" button.
- **Functionality:** 
  - Validates if cart is empty before enabling.
  - Triggers a simulated routing alert.
  - Clears local cart state upon click to reset the UI loop.

---

## Member D — Admin & Order Fulfillment: Phase 1 Log
**Date:** 2026-05-10
**Status:** Phase 1 Complete — Requirements & Edge Cases

### Slice Boundaries
- **Backend:** `src/backend/features/orders/`
- **Frontend:** `src/frontend/src/features/orders/`
- **Database:** Migrations scoped to `orders` table (coordinate schema with Member A)
- **Slice Token:** `orders`

### API Contract (Planned — Not Yet Implemented)
| Method | Endpoint | Description | Status |
|---|---|---|---|
| GET | `/api/orders` | Paginated admin order list | ❌ Not Started |
| GET | `/api/orders/:id` | Single order detail | ❌ Not Started |
| PATCH | `/api/orders/:id/status` | Update fulfillment status | ❌ Not Started |
| GET | `/api/inventory` | Product stock list | ❌ Not Started |
| PATCH | `/api/inventory/:id` | Update product stock quantity | ❌ Not Started |

### Actors Defined
- **Admin** — Primary actor. JWT with `role === "admin"` claim required on all endpoints.
- **System** — Consumes `orders` + `order_items` records created by Member A's `placeOrder` transaction.
- **Customer** — Out-of-scope boundary actor.

### Phase 1 Deliverables
- 5 user stories written in Gherkin (D-1 through D-5).
- Ambiguity audit complete — all vague terms replaced with measurable constraints.
- 7 negative acceptance test scenarios identified (NEG-1 through NEG-7).
- Full requirements document: `docs/requirements/member_d_phase1_requirements.md`

### Key Design Constraints
- "Low-stock" threshold: `stock_quantity < 5`
- Tax rate: 10% (consistent with Member A's cart logic)
- Status transition guard: `DELIVERED` → `PENDING` is an illegal regression (HTTP 422)
- All admin endpoints require `Authorization: Bearer <token>` with `role === "admin"`
- UI updates must reflect within 500ms of API response (React Query cache invalidation)

### Blockers
- **RFC-D001** — `PATCH /api/v1/inventory/:id` writes `Product.stock` (Member C's domain). Needs written approval from Member C before implementation.
- **Auth middleware** — Member B's `protectRoute` ships with their auth slice (currently Phase 1). Until then, our routes mount a mock `x-mock-role` guard.
- ~~Tax rate ambiguity~~ — **CLOSED 2026-05-13**. 10% confirmed as Global Mandate per Member B Phase 1 Log L181.

### Phase 2 Deliverables (Complete)
- Refined Gherkin for all 5 stories (D-1 through D-5) with schema-accurate field names.
- System Sequence Diagrams for all 5 endpoints (happy paths + guard paths).
- OrderStatus transition machine — 7×7 valid/invalid matrix.
- Zod schemas: `updateOrderStatusSchema`, `orderListQuerySchema`, `updateStockSchema`.
- Formal API contract with error codes.
- Full document: `docs/requirements/member_d_phase2_design.md`

### Next 5 Tasks (Phase 3 — TDP: failing tests first)
~~1. `test/orders-get-list` — paginated list + 401/403 guards.~~ ✅ Complete
~~2. `test/orders-update-status` — valid transition + DELIVERED→PENDING regression (422).~~ ✅ Complete
~~3. `test/orders-update-status-invalid` — `status:"HACKED"` returns 400.~~ ✅ Complete
~~4. `test/inventory-update-stock` — valid, negative, decimal quantity guards.~~ ✅ Complete
~~5. `test/orders-get-detail-not-found` — 404 on missing order.~~ ✅ Complete

### Phase 3 — Node.js Attempt (SUPERSEDED 2026-05-15)
~~Initial TDP attempt was Node.js / Express / Zod under `src/backend/features/orders/`. Discarded after team agreed Member D's slices ship as a Python/FastAPI sister service.~~ The Node folder was deleted; the failing-test discipline and padlock catalog from that attempt were carried forward into the Python rewrite.

### Phase 3 — Python Implementation Complete (2026-05-15)
- **Stack:** FastAPI + SQLAlchemy 2.0 + Pydantic v2 + python-jose + bcrypt + APScheduler
- **Location:** `src/backend_python/` (sister service to Member A/B's Node backend; port 8000)
- **JWT bridge:** HS256 + shared `JWT_SECRET` — both backends interoperable
- **Tests:** 32 GREEN for orders + 16 GREEN for auth = **48 total**
- **Padlocks (orders):** 3 layers — Pydantic schema (5) + service (3) + DB (3) — 11 mapped to verifying tests
- **Padlocks (auth):**   4 layers — schema (4) + service (4) + DB (2) + crypto (4) — 14 mapped to verifying tests
- **HR-8 closed in code** — `sweep_service.sweep_stale_pending()` checks `Payment.SUCCESS` before cancelling
- **NFR-D5 closed in code** — `audit_log.idempotency_key UNIQUE` + `update_status()` short-circuit
- **NFR-AU7 closed in code** — `InvalidCredentialsError` raised on both wrong-email and wrong-password paths; byte-identical test passes
- **Phase 3 docs:** `docs/requirements/member_d_phase3_implementation.md` (orders) + `docs/requirements/member_d_auth_phase3_implementation.md` (auth)
- **Phase 3 logbooks:** `docs/logbook/member_d_phase3_agile_logbook.md` + `docs/logbook/member_d_auth_phase3_agile_logbook.md`

### Phase 4 — Validation & Pipeline Engineering Complete (2026-05-15)
- **Testing Pyramid:**
  - Orders: 22 unit / 16 integration / 3 planned E2E (Sprint 4.1 added 6 pure-function tests for `_decide`, `_calc_total_pages`, `_decorate`, `LOW_STOCK_THRESHOLD`)
  - Auth:   12 unit / 12 integration / 2 planned E2E (Sprint A4.1 added 7 pure-function tests for `hash_password`, `verify_password`, `sign_token`, `verify_token`, `_extract_bearer`, role-gate hierarchy)
- **Coverage gates:** `--cov-fail-under=80`. Achieved: services 87-91 %, routers 92-100 %, security 96 %
- **Playwright POM:**
  - Orders pages: `OrderListPage`, `OrderDetailPage`, `InventoryPage` + 7 specs covering Stories D-1..D-6
  - Auth pages: `LoginPage`, `RegisterPage` + 5 specs covering Stories AU-1..AU-2 (lockout sequence + byte-identical generic error specs included)
  - Specs use `data-testid` locators only — `test.skip()` markers until frontend ships next turn
- **Verification report:** every FR-D/FR-AU has a passing test cited (Phase 4 doc §3.1)
- **Validation report:** every Phase 1 Hidden Requirement (HR-1..HR-8 for orders; HR-AU1..HR-AU8 for auth) has a mitigating feature + test (Phase 4 doc §3.2)
- **Known limitations honestly documented:**
  - Orders: NFR-D4.b optimistic concurrency deferred; RFC-D001 still sandbox
  - Auth: registration rate-limit (NFR-AU8) deferred to Redis-backed sprint; refresh tokens out of scope; audit-log DB persistence is follow-up sprint
- **Phase 4 docs:** `docs/requirements/member_d_phase4_validation.md` + `docs/requirements/member_d_auth_phase4_validation.md`
- **Phase 4 logbooks:** `docs/logbook/member_d_phase4_agile_logbook.md` + `docs/logbook/member_d_auth_phase4_agile_logbook.md`

### Integration Notes for Teammates
- **Run our service:** `cd src/backend_python && uvicorn app.main:app --port 8000` — Swagger UI at http://localhost:8000/docs
- **JWT bridge:** Set `JWT_SECRET` to the SAME 32+ char value in Member B's `.env` to verify our tokens
- **Payment events:** POST to `http://localhost:8000/api/v1/events/payment.success` with `{ order_id, payment_id, idempotency_key, amount, occurred_at }` — see Phase 2 §5.4
- **Demo creds (after `python -m scripts.seed`):** `admin@example.com / admin123` and `alice@example.com / Sup3rPass!`

### Phase 1 v2.1 + Phase 2 v2.1 — Cross-Slice Integration Complete (2026-05-13)
- Phases redone against authoritative `CSE323_Project_Overview.pdf`.
- v1 docs archived as `*_v1.md` with deprecation banners.
- Sprint 1.4 (Phase 1 logbook) + Sprint 2.5 (Phase 2 logbook) added — integrate Member A's checkout artifacts and Member B's payment+auth slice publications.
- New requirements absorbed: FR-D6 (15-min stale-pending auto-cancel per Member B REQ_EC_5), FR-D6.b (sweep checks Payment.SUCCESS first), NFR-D5 (idempotent advancement), HR-8 (paid-but-cancelled cross-slice failure mode).
- New cross-slice contracts: Story D-6 Gherkin, SSD-D6 cron flow, §3.1 Initiator dimension on transition matrix, §5.4 `payment.success` Event Contract.
- Cross-Slice Coordination Map locked down in Phase 1 §1.4.

---

## Member B — Payment Features: Phase 1 Log
**Date:** 2026-05-12
**Status:** Phase 1 Complete — Advanced Requirements & Edge Case Discovery

### Slice Boundaries
- **Backend:** `src/backend/features/payment/`
- **Frontend:** `src/frontend/src/features/payment/`
- **Database:** `payments` table + `order_logs` (coordinate with Member A for Order table foreign keys)
- **Slice Token:** `payment`

### Actors Defined
- **Customer** — Primary. Initiates checkout and provides payment credentials.
- **Payment Gateway (Stripe/Mock)** — Supporting. Authorizes transactions and provides status webhooks.
- **Finance System** — Offstage. Consumes payment logs for reconciliation.

### Phase 1 Deliverables: Advanced "Padlock" Requirements
The following Edge Case Requirements (REQ_EC) were discovered using an adversarial AI persona (Student 'Z') to ensure a secure perimeter:

1. **REQ_EC_1 (Negative Amount):** Server-side rejection of `amount <= 0`.
2. **REQ_EC_2 (Idempotency):** 300s window for duplicate request suppression via session key.
3. **REQ_EC_3 (Race Condition):** Final server-side cart re-calculation at moment of payment.
4. **REQ_EC_4 (Negative Floor):** Subtotal constraint `Max(0, Subtotal - Discount)` before tax.
5. **REQ_EC_5 (Zombie Recovery):** 15-minute auto-cancellation for orders stuck in `PAYMENT_PENDING`.

### Key Technical Constants
- **Tax Rate:** 10% (Global mandate)
- **Currency:** USD (Fixed)
- **Gateway Timeout:** 30 seconds
- **Session Expiry:** 24 hours (Inherited from Auth slice)

---

## Member B — Payment Features: Phase 3 Log
**Date:** 2026-05-12
**Status:** Phase 3 Complete — TDP Vertical Slice

### API Contract (Implemented)
| Method | Endpoint | Description | Request Body | Response |
|---|---|---|---|---|
| POST | `/api/payment/process` | Atomic payment execution | `{ amount, promoCode, idempotencyKey, cartTotal }` | `{ status: 'SUCCESS', total }` |

### Prisma Models Added
- **Payment:** Stores transaction logs, tax, discount, and idempotency key.
- **PromoCode:** Stores validation logic, usage limits, and counts.

### Key Padlocks (payment.schema.js)
- **Amount Padlock:** `z.number().positive().multipleOf(0.01)`
- **Idempotency Padlock:** `z.string().uuid()`
- **Logic Floor:** `Math.max(0, subtotal - discount)` enforced in `payment.logic.js`.

### UI Integration
- **Zustand Store:** `usePaymentStore.js` manages client-side idempotency key and loading states.
- **Component:** `PaymentForm.jsx` implements double-click prevention and live calculation.

### Assumptions
- Member D's `protectRoute` middleware expects an `Authorization: Bearer <token>` header.
- Cart data is passed from Member A's slice as the `amount` field.
