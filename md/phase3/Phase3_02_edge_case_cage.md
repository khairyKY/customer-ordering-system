# Phase 3 — Criterion 2: Edge Case Cage (Padlocks)

> **Rubric Standard:** Boundary, threshold, and extreme constraints all addressed; AI hallucination blocked for all cases.

---

## Overview

The Zod schema (`payment.schema.ts`) acts as the **compile-time padlock layer**. It sits at the network boundary — before any controller or database logic runs — and makes it structurally impossible for invalid data to enter the system. Each field below is mapped back to the failing test it enforces.

---

## Padlock Mapping

| Field | Rule | Padlock Type | Blocks Test |
|---|---|---|---|
| `amount` | Positive number, max 2 decimal places | Boundary + Threshold | REQ_PAY_01, REQ_EC_1 |
| `promoCode` | Optional, alphanumeric only, max 20 chars | Extreme constraint | REQ_EC_4 |
| `idempotencyKey` | Required, valid UUID format | Threshold | REQ_EC_2 |
| `cartTotal` | Number `>= 0` via `.refine()` | Boundary | REQ_EC_1 |

---

## Field-by-Field Breakdown

### `amount`
- **Rule:** Must be a positive number, max 2 decimal places.
- **Why:** Prevents negative injection attacks and malformed currency values.
- **Padlock type:** Boundary (must be > 0) + Threshold (max 2 decimal places).

### `promoCode`
- **Rule:** Optional. If provided, must be alphanumeric only, max 20 characters.
- **Why:** Limits the attack surface for SQL injection or buffer overflows in promo inputs.
- **Padlock type:** Extreme constraint — rejects any non-alphanumeric character entirely.

### `idempotencyKey`
- **Rule:** Required. Must be a valid UUID format.
- **Why:** Ensures every request is uniquely identifiable to prevent double-billing.
- **Padlock type:** Threshold — request is rejected at schema level if the key is missing or malformed.

### `cartTotal`
- **Rule:** Must be a number `>= 0`, enforced via Zod `.refine()`.
- **Why:** Acts as a redundant padlock — ensures the logic layer never receives a negative cart state even if `amount` validation is somehow bypassed.
- **Padlock type:** Boundary — hard floor at zero.

---

## File Reference

```
payment.schema.ts — The Zod padlock. Validates all incoming payment data
                    at the network boundary before any logic or DB call runs.
```
