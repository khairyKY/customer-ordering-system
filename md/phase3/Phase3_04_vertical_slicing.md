# Phase 3 — Criterion 4: Vertical Slicing

> **Rubric Standard:** UI / Logic / DB delivered as one working vertical slice; failure resilience demonstrated.

---

## Overview

The Payment Feature is delivered as a **complete vertical slice** — one feature, owned end-to-end by Member B, spanning the Database layer, Logic/API layer, and UI layer. Each layer is self-contained and fails independently without breaking the other members' features.

---

## The Vertical Slice Diagram

```
┌─────────────────────────────────────────────┐
│               UI Layer                      │
│  PaymentForm.jsx — Checkout form            │
│  usePaymentStore.js — State & API calls     │
└─────────────────────┬───────────────────────┘
                      │ POST /api/payment/process
┌─────────────────────▼───────────────────────┐
│              Logic / API Layer              │
│  payment.route.js — Route + auth guard      │
│  payment.controller.js — Orchestration      │
│  payment.logic.js — Tax & discount math     │
│  payment.schema.ts — Zod validation         │
└─────────────────────┬───────────────────────┘
                      │ Prisma atomic transaction
┌─────────────────────▼───────────────────────┐
│              Database Layer                 │
│  Payment model — Transaction records        │
│  PromoCode model — Discount management      │
└─────────────────────────────────────────────┘
```

---

## File Inventory

### Database Layer (`src/database/`)
| File | Role |
|---|---|
| `schema.prisma` | Defines `Payment` and `PromoCode` models. Atomic transactions ensure promo deduction and payment save are never partial. |

**Payment Model Fields:** `id`, `orderId`, `amount`, `tax`, `discount`, `total`, `paymentMethod`, `idempotencyKey`, `status`

**PromoCode Model Fields:** `id`, `code`, `discount`, `usageLimit`, `usageCount`, `expiryDate`, `isActive`

---

### Logic / API Layer (`src/backend/`)
| File | Role |
|---|---|
| `payment.test.js` | Defines the strict mathematical boundaries and error conditions before any code is written. |
| `payment.schema.ts` | The Zod padlock that rejects invalid or malicious data at the network boundary. |
| `payment.logic.js` | Contains the core math for 10% tax and the non-negative discount floor logic. |
| `payment.controller.js` | Coordinates validation, idempotency checks, and the atomic database transaction. |
| `payment.route.js` | Exposes the payment endpoint and applies Member D's `protectRoute` authentication middleware. |

---

### UI Layer (`src/frontend/`)
| File | Role |
|---|---|
| `usePaymentStore.js` | Zustand store — generates a unique idempotency key on mount, manages `isLoading`, `error`, and `isSuccess` states, exposes `submitPayment()` action. |
| `PaymentForm.jsx` | Checkout form with credit card fields, promo code input, and a live breakdown (Subtotal → 10% Tax → Final Total). Submit button disables on first click. |

---

## API Endpoint Contract

| Property | Value |
|---|---|
| Method | `POST` |
| Path | `/api/payment/process` |
| Auth | Required — `protectRoute` middleware (Member D's JWT) |

**Request Body:**
```json
{
  "amount": "number",
  "promoCode": "string (optional)",
  "idempotencyKey": "uuid-string",
  "cartTotal": "number"
}
```

**Success Response (201):**
```json
{
  "status": "SUCCESS",
  "total": "number",
  "transactionId": "uuid-string"
}
```

**Error Responses:**
- `400` — Input failed Zod validation (e.g., negative amount)
- `401` — No valid session token provided
- `500` — Database or gateway communication failure

---

## Failure Resilience

| Failure Scenario | How the Slice Handles It |
|---|---|
| Invalid input reaches the API | Rejected by Zod schema before any logic or DB call runs |
| Negative cart total | Blocked at schema layer (`cartTotal >= 0`) AND logic layer (`InvalidAmountError`) |
| Promo code over-applied | `Math.max(0, subtotal - discount)` floors at `$0.00`; DB `usageCount` is only decremented inside the atomic transaction |
| User double-clicks submit | Button disabled immediately on first click (`isLoading = true`) |
| Duplicate API request | Idempotency key checked in controller; second call returns cached result, no new DB write |
| Auth failure | `protectRoute` middleware from Member D rejects before reaching Member B's controller |

---

## Context Log Reference

```
.ai/CONTEXT.md — Updated to record Phase 3 sprint, API contracts,
                  Prisma models added, and assumptions about Member D's
                  protectRoute middleware.
```
