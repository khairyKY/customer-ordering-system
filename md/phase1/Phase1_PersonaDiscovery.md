# Phase 1 – Persona Discovery: "The Chaos Engineer" (Adversarial AI)

## Persona Profile

> **Persona:** A malicious script-kiddie **and** a frustrated user on a 3G connection in a tunnel.

This persona stress-tests the Payment Slice by combining intentional adversarial attacks with accidental failure conditions caused by poor connectivity and impatient user behavior.

---

## Edge Cases & Attack Vectors

| # | Edge Case / Attack Vector                          | Reasoning — *Why it breaks things*                                                                                                                  | Requirement Padlock                                                                                                                                  |
|---|----------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1 | **The Sub-Zero Heist** *(Negative Amount)*         | Attempting to submit a payment of `-$100.00` to trick the backend into "refunding" money to the attacker's card.                                    | **Validation Guard:** Backend Zod schema must enforce `amount > 0`.                                                                                  |
| 2 | **The Double-Click Blitz** *(Idempotency)*         | Frustrated user mashes "Pay" 10 times. Without guards, the gateway may charge the card 10 times for one order.                                      | **Idempotency Key:** Generate a unique `client_mutation_id` per session; ignore duplicate requests within a **60-second** window.                     |
| 3 | **The Gift-Card Loop** *(Negative Total)*          | Applying a `$50` promo code to a `$40` cart. If logic is naïve, the total becomes `-$10`, potentially crashing the tax calculator.                  | **Floor Logic:** `Max(0, Subtotal − Discount)` — Discounts cannot reduce the taxable subtotal below zero.                                            |
| 4 | **The Tunnel Drop** *(Zombie Authorization)*       | Network fails after Stripe authorizes the charge but before the backend saves the `payment_id`. User is charged, but order stays `PENDING`.          | **WebHook Reconciliation:** Implement a background listener to sync Gateway `"Succeeded"` events with internal DB states.                            |
| 5 | **The Session Swap** *(Race Condition)*            | User has two tabs open. Tab A: `Cart = $10`. Tab B: Adds items, `Cart = $100`. User clicks "Pay" on Tab A — paying the wrong amount.                | **Snapshot Validation:** Payment request must include a `cart_version` or checksum of items to ensure the price paid matches the current cart state. |

---

## Attack Vector Summary

| # | Attack Name           | Threat Type         | Mitigation Strategy           |
|---|-----------------------|---------------------|-------------------------------|
| 1 | The Sub-Zero Heist    | Malicious Input     | Schema validation (`amount > 0`) |
| 2 | The Double-Click Blitz| User Error / Abuse  | Idempotency key + time window |
| 3 | The Gift-Card Loop    | Business Logic Flaw | Floor function on subtotal    |
| 4 | The Tunnel Drop       | Network Failure     | WebHook reconciliation        |
| 5 | The Session Swap      | Race Condition      | Cart versioning / checksum    |

---

## Key Formulas & Guards

| Scenario                  | Rule / Formula                                             |
|---------------------------|------------------------------------------------------------|
| Negative amount attack    | `amount > 0` (enforced at schema level)                    |
| Negative total after promo| `Taxable_Subtotal = Max(0, Subtotal − Discount)`           |
| Final total with promo    | `Final_Total = Max(0, Subtotal − Discount) × 1.10`         |
| Idempotency window        | Reject duplicate `client_mutation_id` within **60 seconds**|

---

*Document scope: Payment Slice — Phase 1 Adversarial Persona & Edge Case Analysis*
