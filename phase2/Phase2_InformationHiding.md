# Phase 2 – API Contracts & Information Hiding

## Overview

This document defines the formal API contract for the Payment Slice's primary endpoint. It specifies the request structure, authentication requirements, and all possible response shapes — exposing only what is necessary to the consumer while hiding internal implementation details.

---

## Endpoint Definition

| Property         | Detail                                              |
|------------------|-----------------------------------------------------|
| **Method**       | `POST`                                              |
| **Endpoint**     | `/api/payments`                                     |
| **Auth**         | `Authorization: Bearer <JWT_TOKEN>`                 |
| **Auth Source**  | Integrated with Member D's Auth Service contract    |
| **Content-Type** | `application/json`                                  |

> **Information Hiding Principle:** The internal tax calculation engine, promo validation logic, Stripe communication, and database commit are fully encapsulated. The consumer receives only a clean summary — never raw gateway responses, internal IDs, or DB state.

---

## Request Payload

```json
{
  "cartId": "uuid-v4-identifier",
  "paymentMethod": {
    "token": "tok_visa_123",
    "provider": "stripe"
  },
  "promoCode": "DISCOUNT2026"
}
```

### Request Field Reference

| Field                    | Type     | Required | Description                                                                              |
|--------------------------|----------|----------|------------------------------------------------------------------------------------------|
| `cartId`                 | `string` | Yes      | UUID v4 identifier of the active cart. Used for snapshot validation (race condition guard). |
| `paymentMethod.token`    | `string` | Yes      | Tokenized card reference from the payment provider. Raw card data is **never** sent.     |
| `paymentMethod.provider` | `string` | Yes      | Payment provider identifier. Currently supports `"stripe"`.                              |
| `promoCode`              | `string` | No       | Optional promotional discount code. Applied before tax computation (PAY-03).             |

---

## Response Contracts

### Success — `201 Created`

Returned when the payment is authorized, captured, and the order is atomically committed to the database.

```json
{
  "transactionId": "pay_xyz_789",
  "orderId": "ord_123",
  "status": "SUCCEEDED",
  "summary": {
    "subtotal": 100.00,
    "discount": 10.00,
    "tax": 9.00,
    "totalCharged": 99.00,
    "currency": "USD"
  },
  "timestamp": "2026-05-11T14:30:00Z"
}
```

### Success Response Field Reference

| Field                  | Type     | Description                                                                               |
|------------------------|----------|-------------------------------------------------------------------------------------------|
| `transactionId`        | `string` | Unique payment record ID. Used for reconciliation and refund reference.                   |
| `orderId`              | `string` | The associated order, now marked `PAID` in the database.                                  |
| `status`               | `string` | Final transaction state. Value: `"SUCCEEDED"`.                                            |
| `summary.subtotal`     | `number` | Cart total before discount or tax.                                                        |
| `summary.discount`     | `number` | Amount deducted by promo code. `0.00` if no code applied.                                 |
| `summary.tax`          | `number` | 10% tax applied to the clamped post-discount subtotal.                                    |
| `summary.totalCharged` | `number` | Final amount captured. Formula: `Max(0, subtotal - discount) * 1.10`                      |
| `summary.currency`     | `string` | ISO 4217 currency code. Currently `"USD"`.                                                |
| `timestamp`            | `string` | ISO 8601 UTC timestamp of transaction completion.                                         |

### 201 Calculation Verification

| Step                   | Formula                  | Result      |
|------------------------|--------------------------|-------------|
| Post-discount subtotal | `$100.00 - $10.00`       | `$90.00`    |
| Floor guard            | `Max(0, $90.00)`         | `$90.00`    |
| Tax (10%)              | `$90.00 * 0.10`          | `$9.00`     |
| **Total charged**      | `$90.00 + $9.00`         | **`$99.00`**|

---

### Error — `422 Unprocessable Entity`

Returned when the payment gateway rejects the transaction (e.g. insufficient funds, expired card).

```json
{
  "error": "PAYMENT_REJECTED",
  "message": "Insufficient funds on the provided card.",
  "code": 422
}
```

### Error Response Field Reference

| Field     | Type     | Description                                                                      |
|-----------|----------|----------------------------------------------------------------------------------|
| `error`   | `string` | Machine-readable error code for client-side handling (e.g. `PAYMENT_REJECTED`). |
| `message` | `string` | Human-readable explanation. Safe to surface in UI.                               |
| `code`    | `number` | Mirror of the HTTP status code for convenience.                                  |

> **Information Hiding:** Internal Stripe error codes, raw gateway payloads, and stack traces are **never** forwarded to the client. The error message is sanitized before leaving the API boundary.

---

## Full Response Code Matrix

| HTTP Status               | Trigger Condition                              | Status / Error Value        |
|---------------------------|------------------------------------------------|-----------------------------|
| `201 Created`             | Payment authorized and DB committed            | `"SUCCEEDED"`               |
| `401 Unauthorized`        | JWT missing, expired, or invalid               | `"UNAUTHORIZED"`            |
| `409 Conflict`            | Duplicate request within idempotency window    | `"TRANSACTION_IN_PROGRESS"` |
| `422 Unprocessable`       | Gateway rejects card (funds, expiry)           | `"PAYMENT_REJECTED"`        |
| `500 Internal Server Error` | Unhandled server fault                       | `"INTERNAL_ERROR"`          |

---

## Information Hiding Summary

| Internal Detail             | Exposed to Consumer | Reason                                                    |
|-----------------------------|---------------------|-----------------------------------------------------------|
| Raw Stripe API response     | No                  | Internal gateway contract — hidden behind API layer       |
| Database transaction ID     | No                  | Internal persistence detail — consumer receives `orderId` |
| Tax computation logic       | No                  | Business rule encapsulated in Payment API                 |
| Promo validation logic      | No                  | Internal rule engine — consumer only sends the code       |
| Sanitized payment summary   | Yes                 | Necessary for receipt display and audit confirmation      |
| `transactionId` + `orderId` | Yes                 | Required for support, reconciliation, and refund flows    |

---

*Document scope: Payment Slice — Phase 2 API Contract Design & Information Hiding Principles*
