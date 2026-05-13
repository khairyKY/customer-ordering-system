# Phase 1 – Persona Discovery: "The Chaos Engineer" (Adversarial AI)

## Persona Profile: Malicious / Frustrated Student 'Z'

> **Motivation:** *"I'm tech-savvy, I'm broke, and honestly, the university system is frustrating. I know how APIs work, and I'm going to find the one hole in the payment logic that lets me get my meal for free — or at least break the backend so nobody else can order either."*

**Profile Type:** Hybrid adversary — combines deliberate malicious intent with the erratic behavior of a genuinely frustrated power user.

---

## Advanced Edge Case Discovery — The "Padlock" Requirements

---

### Case 1: Negative Payment Amount Injection

**Persona Reasoning:**
> *"If I intercept the payment request and change the `totalAmount` to `-50.00` before it hits the server, maybe the system is dumb enough to treat it as a refund and add $50 to my account balance or credit my card."*

**Formal Requirement — `REQ_EC_1`:**
The system must implement server-side schema validation using strict numerical bounds. Any payment request where `totalAmount <= 0` must be rejected with an `HTTP 400 Bad Request` **before** any external gateway communication occurs.

| Attribute         | Detail                                                  |
|-------------------|---------------------------------------------------------|
| Attack Vector     | Intercepted request with tampered `totalAmount`         |
| Threat Type       | Malicious Input / API Tampering                         |
| Validation Layer  | Server-side schema (e.g., Zod) — never client-side      |
| Guard Rule        | `totalAmount > 0` enforced at API boundary              |
| Rejection Code    | `HTTP 400 Bad Request`                                  |
| Trigger Threshold | Any value `<= 0`                                        |

---

### Case 2: The Double-Submission "Button Mash"

**Persona Reasoning:**
> *"I'll use a macro to click 'Confirm' 50 times in one second. If the developer didn't handle concurrency, I might get 50 order confirmations for the price of one — or worse, crash their database transaction logs."*

**Formal Requirement — `REQ_EC_2`:**
The payment endpoint must enforce a unique **Idempotency Key** per checkout session. Duplicate requests sharing the same session token within a **300-second window** must return the cached result of the first transaction instead of creating new records.

| Attribute          | Detail                                                      |
|--------------------|-------------------------------------------------------------|
| Attack Vector      | Macro-triggered rapid duplicate `POST /api/payments` calls  |
| Threat Type        | Concurrency Abuse / Denial of Service                       |
| Mechanism          | `SETNX` idempotency lock in Redis/Cache                     |
| Key Format         | `payment_lock_{session_id}`                                 |
| Window Duration    | **300 seconds** (5 minutes)                                 |
| Duplicate Response | Cached result of first transaction — no new DB records      |
| Rejection Code     | `HTTP 409 Conflict`                                         |

---

### Case 3: Cross-Tab Cart Tampering *(Race Condition)*

**Persona Reasoning:**
> *"I'll open the checkout page for a $10 burger in Tab A. Then, in Tab B, I'll add a $500 expensive item to my cart. I'll go back to Tab A and hit 'Pay'. If the backend only checks the amount I sent from the UI and doesn't re-verify the current database cart state, I just got a $510 order for $10."*

**Formal Requirement — `REQ_EC_3`:**
Every payment execution must perform a **Server-Side Snapshot Validation**. The system must re-calculate the cart total from the database at the exact moment of payment and reject the transaction if the calculated total does not match the `client_provided_total`, within a `±0.01` rounding tolerance.

| Attribute            | Detail                                                          |
|----------------------|-----------------------------------------------------------------|
| Attack Vector        | Multi-tab cart mutation before stale-tab payment submission     |
| Threat Type          | Race Condition / Price Manipulation                             |
| Validation Method    | Server re-queries DB cart at payment execution time             |
| Tolerance            | `±$0.01` (floating-point rounding allowance)                    |
| Mismatch Response    | Transaction rejected — `HTTP 409 Conflict` or `422`            |
| Key Guard Field      | `cart_version` checksum or `client_provided_total`              |

---

### Case 4: Promo Code "Stack-Overflow" *(Balance Floor)*

**Persona Reasoning:**
> *"I found a $50 student-discount code. I'll add a $5 item to my cart and apply it. If the math isn't 'padlocked', the total becomes -$45. I want to see if the system breaks, sends me a 'negative' invoice, or actually credits me the difference."*

**Formal Requirement — `REQ_EC_4`:**
The promo code application logic must implement a **Non-Negative Floor Constraint**. The final subtotal after discounts but before tax must be calculated as `Max(0, Subtotal - Discount)`. The system must explicitly block any transaction that results in a negative final total.

| Attribute            | Detail                                                         |
|----------------------|----------------------------------------------------------------|
| Attack Vector        | Applying a discount code larger than the cart subtotal         |
| Threat Type          | Business Logic Exploit / Negative Invoice Generation           |
| Guard Formula        | `Taxable_Subtotal = Max(0, Subtotal - Discount)`               |
| Tax Application      | `Final_Total = Max(0, Subtotal - Discount) * 1.10`             |
| Minimum Output       | `$0.00` — system can never produce a negative charge           |
| Rejection Behaviour  | Total clamped to `$0.00`; no credit issued to user             |

---

### Case 5: The 3D-Secure "Ghost Redirect"

**Persona Reasoning:**
> *"I'll start the payment and wait for the bank's 3D-Secure redirect. Right as I click 'Authorize' on the bank's page, I'll kill my internet or close the browser. I want to see if the order gets stuck in a 'Pending' zombie state that holds inventory stock hostage forever."*

**Formal Requirement — `REQ_EC_5`:**
The system must implement an **Asynchronous Order Reconciler**. Any order in a `PAYMENT_PENDING` state for longer than **15 minutes** without a successful webhook confirmation from the gateway must be automatically cancelled, and the inventory stock must be released back to the catalog.

| Attribute             | Detail                                                           |
|-----------------------|------------------------------------------------------------------|
| Attack Vector         | Deliberate connection drop mid-3D-Secure redirect                |
| Threat Type           | Zombie State / Inventory Deadlock                                |
| Affected State        | `PAYMENT_PENDING`                                                |
| Timeout Threshold     | **15 minutes** with no gateway webhook received                  |
| Reconciler Action     | Auto-cancel order + release inventory to catalog                 |
| Mechanism             | Background job / cron worker polling pending orders              |
| Prevents              | Stock held hostage, ghost orders, and blocked checkout for others|

---

## Edge Case Summary

| Case | Attack Name                   | Threat Type             | Requirement | Key Guard                                      |
|------|-------------------------------|-------------------------|-------------|------------------------------------------------|
| 1    | Negative Amount Injection     | API Tampering           | `REQ_EC_1`  | `totalAmount > 0` — server schema validation   |
| 2    | Double-Submission Button Mash | Concurrency Abuse       | `REQ_EC_2`  | Idempotency Key — 300s window                  |
| 3    | Cross-Tab Cart Tampering      | Race Condition          | `REQ_EC_3`  | Server-side snapshot re-validation `±$0.01`    |
| 4    | Promo Code Stack-Overflow     | Business Logic Exploit  | `REQ_EC_4`  | `Max(0, Subtotal - Discount)` floor constraint |
| 5    | 3D-Secure Ghost Redirect      | Zombie State / Deadlock | `REQ_EC_5`  | 15-min reconciler — auto-cancel + stock release|

---

## Internal Logic Protection *(Hidden Focus)*

> The focus of these requirements is strictly on **External Boundary Protection**. By defining these "Padlocks," we ensure the internal logic remains a **black box** to the user while maintaining a secure, impenetrable perimeter.

All five padlock requirements operate at the **API boundary layer** — no internal business logic, tax engine, or database schema is exposed. The adversary sees only standardized HTTP error responses, never system internals.

---

*Document scope: Payment Slice — Phase 1 Adversarial Persona & Advanced Edge Case Discovery*
