# Phase 1 – Traceability Matrix (Payment Slice)

## Overview

This document defines the system requirements and use cases for the Payment Slice, maps them against each other in a formal traceability matrix, and justifies every requirement-to-use-case relationship. A zero-orphan check is performed to confirm full coverage.

---

## 1. System Requirements

| ID       | Requirement Description       | Technical / Mathematical Boundary                                                                                                                    |
|----------|-------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------|
| **REQ1** | Secure Card Processing        | The system must encrypt card data (`TLS 1.3`) and process transactions via a PCI-compliant gateway without local storage of sensitive data.           |
| **REQ2** | Mandatory Tax Calculation     | The system must apply a fixed **10% tax rate** to the post-discount subtotal. `Total = (Subtotal − Discount) × 1.10`                                 |
| **REQ3** | Promo Code Logic              | The system must validate alphanumeric codes and apply either flat or percentage discounts, ensuring the total never drops below zero.                 |
| **REQ4** | Alternative Payment Support   | The system must support **Cash on Delivery (COD)** as a secondary payment method, bypassing the card processing gateway.                             |
| **REQ5** | Transaction Atomicity         | Every successful payment must trigger a single atomic operation that updates the order status and records the payment log.                            |

---

## 2. Use Cases

| ID      | Use Case Name          | Description                                                                                                                               |
|---------|------------------------|-------------------------------------------------------------------------------------------------------------------------------------------|
| **UC1** | Process Card Payment   | Customer enters card details and submits for gateway authorization.                                                                       |
| **UC2** | Select COD Payment     | Customer chooses to pay on delivery, confirming the order without instant digital payment.                                                |
| **UC3** | Apply Discount Code    | Customer enters a promo code; the system validates it and updates the order summary.                                                      |
| **UC4** | View Order Summary     | Customer reviews the final breakdown including subtotal, discount, and the 10% tax before final submission.                               |
| **UC5** | Handle Payment Failure | The system provides feedback and allows retry if a card is declined or a code is invalid.                                                 |

---

## 3. Traceability Matrix

| Requirement / Use Case  | UC1 — Card | UC2 — COD | UC3 — Promo | UC4 — Summary | UC5 — Failure |
|-------------------------|:----------:|:---------:|:-----------:|:-------------:|:-------------:|
| **REQ1** — Secure Card  | ✅         |           |             |               | ✅            |
| **REQ2** — 10% Tax      | ✅         | ✅        |             | ✅            |               |
| **REQ3** — Promo Logic  |            |           | ✅          | ✅            | ✅            |
| **REQ4** — Alt Payment  |            | ✅        |             |               |               |
| **REQ5** — Atomicity    | ✅         | ✅        |             |               |               |

---

## 4. Requirement Justification

### REQ1 → UC1, UC5 — Secure Card Processing
Secure card processing (REQ1) is the core driver for the card payment flow (UC1). Because security requirements dictate how errors are handled — including masking sensitive decline reasons — it also maps to the failure handling use case (UC5).

### REQ2 → UC1, UC2, UC4 — Mandatory Tax Calculation
The 10% tax is a legal and technical mandate. It must be applied for both payment methods (UC1, UC2) and must be visible to the customer during the order review phase (UC4) to ensure full transparency before submission.

### REQ3 → UC3, UC4, UC5 — Promo Code Logic
Promo logic (REQ3) is realized through the code entry and validation use case (UC3). The result must be reflected in the final order math (UC4), and the system must produce clear failure states for expired or invalid codes (UC5).

### REQ4 → UC2 — Alternative Payment Support
The alternative payment requirement is specifically fulfilled by the COD use case (UC2), ensuring the system remains accessible to users without digital payment credentials.

### REQ5 → UC1, UC2 — Transaction Atomicity
To prevent *"Ghost Orders"* — where a user is charged but the order is not confirmed — atomic finalization (REQ5) is the technical guarantee behind completing either a card checkout (UC1) or a COD confirmation (UC2).

---

## 5. Zero-Orphan Check

| Check                        | Result | Detail                                              |
|------------------------------|--------|-----------------------------------------------------|
| All REQs have at least one ✅ | ✅ Pass | No requirement is left unimplemented across use cases |
| All UCs have at least one ✅  | ✅ Pass | No use case exists without a justifying requirement  |

> **Conclusion:** Full bidirectional traceability is confirmed. Every requirement drives at least one use case, and every use case is justified by at least one system requirement.

---

*Document scope: Payment Slice — Phase 1 System Requirements, Use Cases & Traceability Matrix*
