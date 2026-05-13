# Phase 3 — Criterion 1: Failing Test First

> **Rubric Standard:** Failing unit tests written before implementation; tests establish a clear mathematical boundary.

---

## Overview

All four tests below were written **before any implementation code existed**. Each test defines a strict mathematical boundary that the system must satisfy. At the time of writing, every test below was in a **failing state** — the functions `calculateTotal()` and `processPayment()` did not yet exist.

---

## Unit Tests

```js
test('REQ_PAY_01: Calculates final total with exactly 10% tax', () => {
  // Subtotal = 100.00
  // Tax (10%) = 100.00 * 0.10 = 10.00
  // Total = 100.00 + 10.00 = 110.00
  expect(calculateTotal(100.00, 0)).toBe(110.00);
});
```

```js
test('REQ_EC_1: Blocks processing if the cart subtotal is negative', () => {
  // Input subtotal = -10.00
  // Expected: The system should identify this as invalid input
  // Action: Throw 'InvalidAmountError' to stop the flow
  expect(() => calculateTotal(-10.00, 0)).toThrow('InvalidAmountError');
});
```

```js
test('REQ_EC_4: Enforces a $0.00 floor when discounts exceed the subtotal', () => {
  // Subtotal = 40.00, Discount = 50.00
  // Math: Max(0, 40.00 - 50.00) = 0.00
  // Total: 0.00 * 1.10 = 0.00
  expect(calculateTotal(40.00, 50.00)).toBe(0.00);
});
```

```js
test('REQ_EC_2: Prevents double charges via Idempotency Key matching', async () => {
  // Call 1: Send payment with Key "UUID-123" -> System processes and saves
  // Call 2: Send EXACT SAME payment with Key "UUID-123" again
  // Expected: Second call should see the existing key in the DB
  // Result: Return the cached success response instead of charging the card again
  const secondCall = await processPayment(duplicatePaymentData);
  expect(secondCall.isDuplicate).toBe(true);
});
```

---

## Mathematical Boundary Summary

| Test ID | Boundary Established | Input | Expected Output |
|---|---|---|---|
| REQ_PAY_01 | 10% tax must be exact | `subtotal = 100.00` | `110.00` |
| REQ_EC_1 | Negative amounts are illegal | `subtotal = -10.00` | throws `InvalidAmountError` |
| REQ_EC_4 | Discount cannot push total below zero | `subtotal = 40, discount = 50` | `0.00` |
| REQ_EC_2 | Same idempotency key = no second charge | duplicate key `"UUID-123"` | `isDuplicate: true` |
