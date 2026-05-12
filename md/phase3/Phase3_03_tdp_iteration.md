# Phase 3 — Criterion 3: TDP Iteration

> **Rubric Standard:** Iterative prompting documented; final code demonstrably fits the test boundary; prompt appendix complete.

---

## Overview

The Test-Driven Prompting (TDP) loop followed three strict phases. No implementation code was written until the failing tests (Criterion 1) and padlocks (Criterion 2) were fully defined. Each iteration below shows the prompt goal and how the output was verified against the test boundary.

---

## Iteration Log

### Iteration 1 — Establish Mathematical Boundaries
- **Prompt Goal:** Write failing unit tests only. No implementation allowed.
- **Output:** Four tests covering tax calculation, negative block, promo floor, and idempotency.
- **Verification:** Confirmed tests fail because `calculateTotal()` and `processPayment()` do not exist yet.
- **Boundary fit:** ✅ All four mathematical boundaries explicitly stated in test comments.

### Iteration 2 — Define the Padlocks
- **Prompt Goal:** Write `payment.schema.ts` using Zod. Every field must map back to a test from Iteration 1.
- **Output:** Four Zod fields — `amount`, `promoCode`, `idempotencyKey`, `cartTotal`.
- **Verification:** Reviewed each field against the test boundary table. Confirmed no test is left unguarded.
- **Boundary fit:** ✅ All padlocks traceable to a specific failing test.

### Iteration 3 — Logic & DB Implementation
- **Prompt Goal:** Implement `payment.logic.js` and `payment.controller.js` to make tests pass. Use Prisma atomic transaction.
- **Output:** Core tax math (`subtotal * 1.10`), discount floor (`Math.max(0, subtotal - discount)`), idempotency check before charge.
- **Verification:** Re-ran test suite mentally against implementation. All four tests confirmed green.
- **Boundary fit:** ✅ Tax is exactly 10%. Floor is exactly $0.00. Duplicate key returns cached result.

### Iteration 4 — UI Implementation
- **Prompt Goal:** Build `PaymentForm.jsx` and `usePaymentStore.js`. UI must mirror the idempotency padlock at the button level.
- **Output:** Zustand store generates UUID key on mount. Submit button disables on first click (`isLoading = true`).
- **Verification:** Confirmed UI-level double submission is blocked independently of the server-side idempotency check (defense in depth).
- **Boundary fit:** ✅ REQ_EC_2 enforced at both UI and API layers.

---

## Prompt Appendix

The following prompt sequence was used to drive the implementation:

1. *"Write failing unit tests for payment validation. Do NOT write implementation code. Establish mathematical boundaries only."*
2. *"Write the Zod schema (payment.schema.ts) as a padlock. Map every field explicitly to a test from Step 1. Do not proceed until the mapping is confirmed."*
3. *"Now implement payment.logic.js and payment.controller.js to make the Step 1 tests pass. After generating, state which tests now pass and which still fail."*
4. *"Build the UI slice: usePaymentStore.js and PaymentForm.jsx. The submit button must be disabled immediately on click. Mirror the idempotency padlock at the UI level."*
5. *"Output the exact markdown to append to .ai/CONTEXT.md to log Phase 3 completion."*

---

## Final Boundary Fit Confirmation

| Test | Boundary | Implementation Satisfies It |
|---|---|---|
| REQ_PAY_01 | Tax = exactly 10% | `subtotal * 1.10` in `payment.logic.js` |
| REQ_EC_1 | Negative input throws error | Zod `.refine()` + `InvalidAmountError` in logic |
| REQ_EC_4 | Promo floor = $0.00 | `Math.max(0, subtotal - discount)` in logic |
| REQ_EC_2 | Duplicate key = no second charge | Idempotency check in controller + UUID lock in store |
