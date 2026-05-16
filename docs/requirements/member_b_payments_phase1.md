# Phase 1 — Requirements & Discovery: Payment Slice
**Member:** B — Payment Vertical Slice
**Date:** 2026-05-12 (ingested & standardized 2026-05-16)
**Status:** ✅ Complete
**Sources:** `md/phase1/Phase1_ActorClassification.md`, `Phase1_PersonaDiscovery_updated.md` (canonical), `Phase1_TraceabilityHeatmap.md`, `Phase1_TraceabilityMatrix_updated.md`

> ⚠️ **Canonicity Note:** `Phase1_PersonaDiscovery_updated.md` is canonical. The earlier `Phase1_PersonaDiscovery.md` stated a **60-second** idempotency window — that is superseded. The canonical window is **300 seconds**. See Issue C-2 in `docs/phases/combined_phase1.md`.

---

## §1 — Actor Classification

| Category | Actor | Rationale |
|---|---|---|
| **Primary** | Customer | Initiator of the pay intent. Interacts with the UI to provide payment credentials and authorize fund transfer. |
| **Supporting** | Payment Gateway *(Stripe)* | Downstream external system performing credit-card validation and fund capture. Our system acts as a **Client** to their API. |
| **Supporting** | Internal Database | Persists transaction logs, updates order status to `PAID`, ensures ACID atomicity during checkout finalization. |
| **Offstage** | Accounting Dept. | Requires immutable transaction reports for reconciliation. Does not interact with the flow directly. |
| **Offstage** | Tax Authorities | Passive stakeholders in the mandatory **10% tax rate** calculation. The system must prove tax was correctly captured. |

---

## §2 — Adversarial Persona: "The Chaos Engineer" (Student Z)

> *"I'm tech-savvy, I'm broke, and honestly, the university system is frustrating. I know how APIs work, and I'm going to find the one hole in the payment logic that lets me get my meal for free."*

**Profile Type:** Hybrid adversary — deliberate malicious intent combined with frustrated power-user behaviour.

---

### REQ_EC_1 — Negative Payment Amount Injection

> *"If I intercept the payment request and change `totalAmount` to `-50.00`, maybe the system treats it as a refund and credits my card."*

| Attribute | Detail |
|---|---|
| Attack Vector | Intercepted request with tampered `totalAmount` |
| Threat Type | Malicious Input / API Tampering |
| Validation Layer | Server-side Zod schema — **never** client-side |
| Guard Rule | `totalAmount > 0` enforced at API boundary |
| Rejection Code | `HTTP 400 Bad Request` |
| Trigger Threshold | Any value `<= 0` |

**Requirement:** Any `totalAmount <= 0` MUST be rejected with `HTTP 400` **before** any gateway communication occurs.

---

### REQ_EC_2 — Double-Submission Button Mash (Idempotency)

> *"I'll use a macro to click 'Confirm' 50 times in one second. Without guards, the gateway may charge the card 50 times for one order."*

| Attribute | Detail |
|---|---|
| Attack Vector | Macro-triggered rapid duplicate `POST /api/payments` |
| Threat Type | Concurrency Abuse / DoS |
| Mechanism | `SETNX` idempotency lock in Redis/Cache |
| **Window Duration** | **300 seconds (5 minutes)** — canonical |
| Duplicate Response | Cached result of first transaction — no new DB records |
| Rejection Code | `HTTP 409 Conflict` |

**Requirement:** Duplicate requests with the same idempotency key within **300 seconds** MUST return the cached result without creating new records.

---

### REQ_EC_3 — Cross-Tab Cart Tampering (Race Condition)

> *"Tab A: $10 burger. Tab B: Add $500 item. Pay from Tab A — backend doesn't re-verify and I get $510 of goods for $10."*

| Attribute | Detail |
|---|---|
| Attack Vector | Multi-tab cart mutation before stale-tab payment |
| Threat Type | Race Condition / Price Manipulation |
| Validation Method | Server re-queries DB cart at payment execution time |
| Tolerance | `±$0.01` floating-point rounding allowance |
| Mismatch Response | `HTTP 409 Conflict` or `422 Unprocessable` |

**Requirement:** Every payment MUST perform a **Server-Side Snapshot Validation**, re-calculating cart total from DB and rejecting if mismatch exceeds `±$0.01`.

---

### REQ_EC_4 — Promo Code Stack-Overflow (Balance Floor)

> *"I apply a $50 discount to a $5 cart. If the math isn't padlocked, the total becomes -$45 and the system credits me."*

| Attribute | Detail |
|---|---|
| Attack Vector | Discount code exceeding cart subtotal |
| Threat Type | Business Logic Exploit / Negative Invoice |
| Guard Formula | `Taxable_Subtotal = Max(0, Subtotal - Discount)` |
| Tax Application | `Final_Total = Max(0, Subtotal - Discount) × 1.10` |
| Minimum Output | `$0.00` — never negative |

**Requirement:** Subtotal after discounts MUST be calculated as `Max(0, Subtotal - Discount)`. Total can never be negative.

---

### REQ_EC_5 — 3D-Secure Ghost Redirect (Zombie Order)

> *"I start payment, get the 3D-Secure redirect, then kill my internet. The order stays PAYMENT_PENDING forever, holding inventory hostage."*

| Attribute | Detail |
|---|---|
| Attack Vector | Connection drop mid-3D-Secure redirect |
| Threat Type | Zombie State / Inventory Deadlock |
| Affected State | `PAYMENT_PENDING` |
| **Timeout Threshold** | **15 minutes** without webhook confirmation |
| Reconciler Action | Auto-cancel order + release inventory |
| Mechanism | Background cron job |

**Requirement:** Orders stuck in `PAYMENT_PENDING` for > **15 minutes** MUST be auto-cancelled and inventory released. **Cross-slice:** Consumed by Member D's `FR-D6` / `sweepStalePendingOrders()`.

---

### Edge Case Summary

| ID | Attack Name | Threat Type | Guard | Response |
|---|---|---|---|---|
| `REQ_EC_1` | Negative Amount Injection | API Tampering | `totalAmount > 0` | `HTTP 400` |
| `REQ_EC_2` | Double-Submission Mash | Concurrency Abuse | Idempotency Key 300s | `HTTP 409` |
| `REQ_EC_3` | Cross-Tab Tampering | Race Condition | Server snapshot `±$0.01` | `HTTP 409/422` |
| `REQ_EC_4` | Promo Stack-Overflow | Business Logic | `Max(0, Sub - Disc)` | Clamped to $0.00 |
| `REQ_EC_5` | Ghost Redirect | Zombie State | 15-min cron cancel | Async action |

---

## §3 — Functional Requirements

| ID | Feature | Justification | Boundary |
|---|---|---|---|
| **PAY-01** | Secure Credential Input | Security Baseline | PCI-compliant masks; raw PAN never persisted |
| **PAY-02** | Tax Computation Engine | Legal Compliance | `Total = Subtotal × 1.10` — 10% global mandate |
| **PAY-03** | Promo Code Logic | Business Logic | `Final_Total = Max(0, Subtotal − Discount) × 1.10` |
| **PAY-04** | Atomic Finalization | Data Integrity | Single ACID transaction prevents Ghost Orders |

---

## §4 — System Requirements

| ID | Requirement | Technical Boundary |
|---|---|---|
| **REQ1** | Secure Card Processing | `TLS 1.3` + PCI gateway; no local PAN storage |
| **REQ2** | Mandatory 10% Tax | `Total = (Subtotal − Discount) × 1.10` |
| **REQ3** | Promo Code Logic | Alphanumeric codes; total floor = `$0.00` |
| **REQ4** | Alternative Payment (COD) | Cash on Delivery; bypasses card gateway |
| **REQ5** | Transaction Atomicity | Atomic: update order status + log payment |

---

## §5 — Use Cases

| ID | Use Case | Description |
|---|---|---|
| **UC1** | Process Card Payment | Customer submits card details for gateway authorization |
| **UC2** | Select COD Payment | Customer confirms order for pay-on-delivery |
| **UC3** | Apply Discount Code | Customer enters promo code; system validates and updates summary |
| **UC4** | View Order Summary | Customer reviews subtotal, discount, 10% tax before submitting |
| **UC5** | Handle Payment Failure | System provides feedback and retry on decline/invalid code |

---

## §6 — Traceability Matrix

| Requirement \ UC | UC1 Card | UC2 COD | UC3 Promo | UC4 Summary | UC5 Failure |
|---|:---:|:---:|:---:|:---:|:---:|
| **REQ1** Secure Card | ✅ | | | | ✅ |
| **REQ2** 10% Tax | ✅ | ✅ | | ✅ | |
| **REQ3** Promo Logic | | | ✅ | ✅ | ✅ |
| **REQ4** Alt Payment | | ✅ | | | |
| **REQ5** Atomicity | ✅ | ✅ | | | |

**Zero-Orphan Check:** ✅ All REQs covered by ≥ 1 UC · All UCs justified by ≥ 1 REQ

---

## §7 — Technical Constants

| Constant | Value | Source |
|---|---|---|
| Tax Rate | **10%** | Global Mandate — all slices |
| Currency | **USD** | Fixed |
| Gateway Timeout | **30 seconds** | Member B mandate |
| Session Expiry | **24 hours** | Auth slice (Member D) |
| Idempotency Window | **300 seconds** | Canonical (Phase1_PersonaDiscovery_updated.md) |
| Zombie Order Threshold | **15 minutes** | REQ_EC_5 → Member D FR-D6 |

---

*Source: `md/phase1/` — ingested & standardized 2026-05-16 | Rogue directory `md/` eliminated.*
