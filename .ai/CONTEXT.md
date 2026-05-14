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
- `docs/`: All project documentation.

## Documentation Architecture
- **Requirements & Design:** All Phase 1 and Phase 2 documentation for ALL team members (including Members B and C) is permanently located in `docs/requirements/`.
- **Logbooks:** Individual activity logs reside in `docs/logbook/`.
- **Architectural Rules:** Core system standards are in `docs/architecture_v2/`.
- **Vault Integrity:** The rogue directories `md/`, `Phase 1/`, and `Phase 2/` have been deleted. Do not reference them.

## 3. FEATURE OWNERSHIP (Updated 2026-05-13)
- **Member A (Khairy):** Checkout & Shopping Cart System.
- **Member B:** Payment.
- **Member C:** Tickets / Support System.
- **Member D:** Admin & Order Fulfillment + **Auth & User Management** (two slices).
- **Catalog:** **Member A** (Khairy) — reassigned 2026-05-16 per Scrum Master executive decision. Scope: product browsing, search, and stock-read endpoints consumed by the Checkout slice.

## 4. FEATURE SLICE STATUS

| Slice | Owner | Status | Last Completed Task | Blockers |
|---|---|---|---|---|
| checkout | Member A | 🟢 Complete | Sprint 2 + Checkout Button | None |
| auth | **Member D** | 🟡 In Progress | Phase 1 Complete (2026-05-13) — see `docs/requirements/member_d_auth_phase1_requirements.md` | None — JWT contract locked for consumers. **Auth is EXCLUSIVELY owned by Member D. Member C owns Tickets only.** |
| catalog | **Member A** | 🟡 In Progress | Ownership transferred 2026-05-16 — product mock data already served by `productController.js` | RFC-D001 (catalog stock write by Member D) requires Member A approval |
| payment | Member B | 🟢 Phase 3 Complete | Phase 3: TDP Implementation | None |
| orders | Member D | 🟡 In Progress | Phase 1 v2.1 + Phase 2 v2.1 (PDF-aligned + cross-slice integrated with Member A & B) | RFC-D001 (catalog write); awaiting Member B's `protectRoute` middleware (auth Phase 1 in progress) |

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

## UI Component Library
**Location:** `src/frontend/src/components/ui/`

### Components:
- `<Button variant="primary|secondary|danger">` - Standardized buttons with tap animations.
- `<Card>` - Consistent container for sections and grids.
- `<Input label="..." error="...">` - Standardized form fields.

### MANDATE:
All team members **MUST** use these library components for common UI elements. **DO NOT** write raw HTML tags (`<button>`, `<input>`) or manual Tailwind utility classes for these basic elements. This ensures visual consistency across all feature slices.

## UI Standardization Sweep
**Date:** 2026-05-10
**Status:** Complete & Verified

### Audit Summary:
- **`App.jsx`:** Refactored layout to use semantic tags and standardized Tailwind typography. Layout enforced as side-by-side Flex/Grid.
- **`ProductGrid.jsx`:** 100% compliance. All raw buttons and divs replaced with `<Button>` and `<Card>`.
- **`CartWidget.jsx`:** 100% compliance. Replaced the last remaining raw "X" button with a library `<Button>` component.
- **Verification:** Global search confirms zero instances of raw `<button>` or `<input>` tags in the `src/components/` and `src/App.jsx` files.

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
| GET | `/api/orders` | Paginated admin order list | 🗒 Not Started |
| GET | `/api/orders/:id` | Single order detail | 🗒 Not Started |
| PATCH | `/api/orders/:id/status` | Update fulfillment status | 🗒 Not Started |
| GET | `/api/inventory` | Product stock list | 🗒 Not Started |
| PATCH | `/api/inventory/:id` | Update product stock quantity | 🗒 Not Started |

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
1. `test/orders-get-list` — paginated list + 401/403 guards.
2. `test/orders-update-status` — valid transition + DELIVERED→PENDING regression (422).
3. `test/orders-update-status-invalid` — `status:"HACKED"` returns 400.        
4. `test/inventory-update-stock` — valid, negative, decimal quantity guards.   
5. `test/orders-get-detail-not-found` — 404 on missing order.

### Phase 1 v2.1 + Phase 2 v2.1 — Cross-Slice Integration Complete (2026-05-13)
- Phases redone against authoritative `CSE323_Project_Overview.pdf`.
- v1 docs archived as `*_v1.md` with deprecation banners.
- Sprint 1.4 (Phase 1 logbook) + Sprint 2.5 (Phase 2 logbook) added — integrate Member A's checkout artifacts and Member B's payment+auth slice publications.   
- New requirements absorbed: FR-D6 (15-min stale-pending auto-cancel per Member B REQ_EC_5), FR-D6.b (sweep checks Payment.SUCCESS first), NFR-D5 (idempotent advancement), HR-8 (paid-but-cancelled cross-slice failure mode).
- New cross-slice contracts: Story D-6 Gherkin, SSD-D6 cron flow, §3.1 Initiator dimension on transition matrix, §5.4 `payment.success` Event Contract.
- Cross-Slice Coordination Map locked down in Phase 1 §1.4.

---

## Git Branching Conventions
**Enforced as of:** 2026-05-16 | **Authority:** Scrum Master (Khairy) + CONTEXT.md

All branches MUST follow this naming scheme. PRs with non-compliant branch names are **auto-rejected** by CI (`branch-name-lint` job in `.github/workflows/ci.yml`).

### Branch Types

| Prefix | Purpose | Example |
|---|---|---|
| `feat/` | New feature work within a vertical slice | `feat/cart-checkout`, `feat/auth-jwt-refresh` |
| `bugfix/` | Non-urgent bug fix (caught in dev/QA) | `bugfix/payment-crash`, `bugfix/cart-tax-rounding` |
| `hotfix/` | Urgent production fix requiring immediate merge to `main` | `hotfix/order-status-loop` |
| `refactor/` | Internal code restructuring — no new features, no bug fixes | `refactor/cart-controller-zod` |
| `chore/` | Documentation, dependency updates, config, tooling, maintenance | `chore/update-readme`, `chore/upgrade-prisma` |
| `test/` | Writing or updating automated tests only | `test/orders-get-list`, `test/checkout-e2e` |
| `docs/` | Documentation-only changes in `docs/` or `.ai/` | `docs/phase4-validation-report` |

### Rules
1. **Slice token required:** Branch name must embed the slice name after the prefix, e.g. `feat/cart-...`, `feat/payment-...`, `feat/auth-...`, `test/orders-...`.
2. **No direct push to `main` or `develop`.** All changes arrive via Pull Request.
3. **Rebase before merge** — no merge commits on `develop`.
4. **Feature branches are short-lived** — must merge or be abandoned within 5 working days.
5. **One concern per branch** — a `feat/` branch must not contain doc-only changes; use a separate `chore/` or `docs/` branch.
