# Phase 1: Requirements Report (D2) — Member A
**Feature Domain:** Checkout & Shopping Cart System

## 1. Actor Classification & Rationale
| Actor | Classification | Rationale |
| :--- | :--- | :--- |
| **Customer** | **Primary** | The initiator of the checkout sequence; interacts directly with the Cart UI to achieve the business goal of purchasing items. |
| **Payment Gateway API** | **Supporting** | Provides the external service required to authorize transactions. The system cannot finalize the "Place Order" goal without its response. |
| **Kitchen/Fulfillment** | **Offstage** | Consumes the result of a successful checkout (Order Record) but does not interact with the Checkout system directly during the process. |
| **System Admin** | **Offstage** | Monitors transaction logs and manages promo codes; background maintenance role. |

## 2. Persona Discovery (AI-Driven Edge Cases)
*Simulated via "Malicious/Frustrated Customer" AI Avatar*

1. **The Ghost Inventory Race:** User submits checkout while a background process (Member C's catalog) marks an item as out-of-stock. *Requirement:* Backend must use a Prisma Transaction to re-verify stock *before* decrementing.
2. **The Price-Hacker Injection:** A malicious user modifies the `unitPrice` in the frontend local storage cart before submission. *Requirement:* Backend MUST ignore frontend price data and re-fetch current prices from the DB during checkout validation.
3. **The Slow-Network Double-Submission:** User clicks "Place Order" multiple times during a 5-second lag. *Requirement:* UI must implement a "Submitting" state to disable the button; Backend should implement idempotency keys for order creation.
4. **The Invalid Promo Injection:** User attempts to apply a promo code belonging to another user's account or an expired campaign. *Requirement:* Server-side Zod validation against `expiresAt` and `isActive` fields.
5. **The Address-Overflow Attack:** Malicious input into the "Shipping Address" fields designed to overflow database string limits or inject scripts. *Requirement:* Strict Zod schema constraints on address field lengths and sanitization.

## 3. Traceability Matrix (Member A Slice)
- **FE-01 (Cart Store):** Justified by User Story: "As a customer, I want to see my items before paying."
- **BE-01 (Checkout API):** Justified by Business Goal: "Process secure payments and create order records."
- **DB-01 (Prisma Models):** Justified by Data Integrity Requirement: "Order history must be immutable and snapshotted."
