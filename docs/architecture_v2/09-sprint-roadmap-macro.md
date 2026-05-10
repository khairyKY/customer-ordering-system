# 09 — Sprint Roadmap (Macro Overview)

## Sprint Overview

| Sprint | Name | Week | Primary Goal | Exit Criteria |
|---|---|---|---|---|
| **Sprint 0** | Infrastructure & Foundations | Week 1 | Dev environment, schema, shared types | `docker compose up -d` starts cleanly; Prisma migrations apply; TypeScript compiles; all members can run tests locally |
| **Sprint 1** | Cart Core | Week 2 | Cart store, backend API, basic UI | All cart endpoints return correct responses via curl/Postman; Zustand store unit tested; API client calls backend successfully |
| **Sprint 2** | Cart UX Polish | Week 3 | Drawer UI, quantity controls, promo codes | Visual regression tests pass; quantity updates are optimistic; promo code validation provides clear error messages |
| **Sprint 3** | Checkout Flow | Week 4 | Multi-step form, validation | User can complete all checkout steps; form validation shows inline errors; step navigation preserves form state |
| **Sprint 4** | Order Placement | Week 5 | Order creation, confirmation | Placing order creates Order + OrderItem records; cart is cleared; confirmation page displays correctly |
| **Sprint 5** | Testing & Hardening | Week 6 | E2E tests, edge cases, coverage | E2E happy path passes; 80% line coverage on all checkout files; rubric self-review complete |

---

## Sprint 0 — Infrastructure & Foundations

**Goal:** Establish the dev environment, database schema, and shared contracts so all subsequent sprint work can proceed without infrastructure blockers.

| Task ID | Title | TDP | Description |
|---|---|---|---|
| S0-T1 | Docker Compose Environment | Yes | `db` (PostgreSQL 15), `backend` (Node.js hot-reload), `frontend` (Vite) |
| S0-T2 | Prisma Schema — Checkout Domain | No | Define Cart, CartItem, Order, OrderItem, PromoCode models; run `prisma migrate dev` |
| S0-T3 | Shared TypeScript Types | No | Coordinate `Product` type with Member C; define all checkout-owned types |

---

## Sprint 1 — Cart Core

**Goal:** Foundational cart functionality — Zustand store, backend API, Zod validation, API client.

| Task ID | Title | TDP | Description |
|---|---|---|---|
| S1-T1 | Zod Validation Schemas | Yes | `addItemSchema`, `updateQuantitySchema` — backend validators |
| S1-T2 | CartService — Core Business Logic | Yes | `getOrCreateCart`, `addItem`, `updateItemQuantity`, `removeItem`, `clearCart` |
| S1-T3 | Cart REST API Routes | Yes | All 7 cart endpoints; controllers call CartService |
| S1-T4 | Zustand Cart Store | Yes | Frontend state + actions + optimistic updates + rollback |
| S1-T5 | Cart API Client | No | `cartApi.ts` — typed Axios wrappers for all cart endpoints |

---

## Sprint 2 — Cart UX Polish

**Goal:** Full visual cart experience with real backend integration.

| Task ID | Title | TDP | Description |
|---|---|---|---|
| S2-T1 | CartItem Component | Yes | Product image, name, price, quantity stepper, remove button |
| S2-T2 | CartSummary Component | Yes | Subtotal, discount, shipping estimate, total, CTA button |
| S2-T3 | CartDrawer Component | Yes | Accessible slide-in panel; focus-trapped; keyboard navigable |
| S2-T4 | PromoCodeInput + Backend Validation | Yes | UI component + `POST /api/v1/cart/promo` endpoint |

---

## Sprint 3 — Checkout Flow

**Goal:** Multi-step checkout: Cart Review → Shipping → Payment → Confirmation.

| Task ID | Title | TDP | Description |
|---|---|---|---|
| S3-T1 | CheckoutStepper Component | Yes | Visual progress indicator; ARIA-accessible |
| S3-T2 | ShippingForm Component | Yes | `react-hook-form` + Zod resolver; mirrors backend validation |
| S3-T3 | PaymentForm Component (Simulated) | Yes | Masked card input; mock `paymentRef = crypto.randomUUID()` |
| S3-T4 | CheckoutForm Orchestrator | Yes | Manages step state, collects data across steps, coordinates submission |

---

## Sprint 4 — Order Placement & Confirmation

**Goal:** Backend order placement transaction; frontend confirmation page.

| Task ID | Title | TDP | Description |
|---|---|---|---|
| S4-T1 | CheckoutService.placeOrder | Yes | Prisma transaction: validate → create order → decrement stock → clear cart |
| S4-T2 | Order Placement API Endpoint | Yes | `POST /api/v1/checkout/order`; returns 201 on success |
| S4-T3 | OrderConfirmation Component | Yes | Fetches by `orderId` URL param; displays full order breakdown |

---

## Sprint 5 — Testing & Hardening

**Goal:** Comprehensive coverage, E2E test, edge cases, rubric self-review.

| Task ID | Title | TDP | Description |
|---|---|---|---|
| S5-T1 | E2E — Complete Checkout Happy Path | No | Playwright test: catalog → add to cart → checkout → confirmation |
| S5-T2 | Edge Case Coverage | No | Guest cart merge, duplicate product merge, OOS badge, case-insensitive promo, floating point guard |
| S5-T3 | Coverage Report & Rubric Self-Review | No | 80% line coverage; rubric mapping table complete |

---

## Key Milestone Dependencies

```
S0 (Infrastructure) ──► S1 (Cart Core) ──► S2 (Cart UX) ──► S3 (Checkout Flow)
                                                                      │
                                                                      ▼
                                                             S4 (Order Placement)
                                                                      │
                                                                      ▼
                                                             S5 (Testing & Hardening)
```

- S1 is blocked until S0 migration and shared types are complete.
- S3 and S4 require Member C's `Product` type (coordinated in S0-T3).
- S5 E2E tests require Member C's product catalog to have at least one seeded product.

---

## Velocity Guard

If a sprint's remaining tasks cannot be completed at current velocity, lowest-priority tasks move to Sprint 5 (Hardening), which has a built-in buffer.

The E2E test in S5-T1 is the **immovable deadline anchor** — everything before it must be complete before the final submission.
