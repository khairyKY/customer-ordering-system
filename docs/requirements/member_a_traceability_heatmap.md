# Traceability Heatmap — Member A (Checkout & Shopping Cart)

**Member:** A — Checkout / Cart / Catalog Vertical Slice
**Generated:** 2026-05-18
**Source documents:** `docs/requirements/requirements_report_member_a.md`, `docs/requirements/member_a_edge_cases.md`
**Disclosure:** Synthesized by AI from the cited Phase 1 source documents and the
current codebase, per the CSE323 AI-as-Labor mandate. Verify against the slice owner's intent before submission.

---

## §1 — Persona

**Avatar:** "Malicious / Frustrated Customer" — simulated adversarial shopper exercising the checkout funnel under stress, lag, and tampering conditions.

## §2 — Edge Case → Component → Mitigation Map

| EC | Persona Behaviour | System Component | Mitigation (Padlock) | Test Evidence |
|---|---|---|---|---|
| **EC-A1** Ghost Inventory Race | Checks out while catalog marks item out-of-stock | Checkout API (`BE-01`), Prisma Models (`DB-01`) | Stock re-verified inside a DB transaction before decrement | `tests/e2e/payment.spec.js` (cart-state path) |
| **EC-A2** Price-Hacker Injection | Edits `unitPrice` in localStorage cart | Checkout API (`BE-01`) | Backend ignores client prices; re-fetches from DB | Backend cart re-pricing logic |
| **EC-A3** Slow-Network Double-Submission | Clicks "Place Order" repeatedly during lag | Cart Store (`FE-01`), `CartPage.jsx` | UI "Submitting" state disables button; backend idempotency key | `payment.spec.js` duplicate-submission test |
| **EC-A4** Invalid Promo Injection | Applies expired / foreign promo code | `CartPage.jsx` promo stub, Checkout API | Server-side validation of `expiresAt` / `isActive` | Promo-code validation test |
| **EC-A5** Address-Overflow Attack | Overflows shipping-address fields / injects scripts | Checkout API (`BE-01`) | Strict schema length constraints + sanitization | Schema-validation tests |

## §3 — Requirement → Component Heatmap

> **P** = PRIMARY owner · **R** = RELATED / secondary touch

| Requirement | Cart Store (FE-01) | Checkout API (BE-01) | Prisma Models (DB-01) |
|---|:---:|:---:|:---:|
| View cart before paying | **P** | R | R |
| Process secure payment & create order | R | **P** | R |
| Immutable, snapshotted order history | | R | **P** |
| EC-A1 Ghost Inventory Race | | **P** | R |
| EC-A2 Price-Hacker Injection | | **P** | R |
| EC-A3 Double-Submission | **P** | R | |
| EC-A4 Invalid Promo | R | **P** | |
| EC-A5 Address Overflow | | **P** | R |

## §4 — Zero-Orphan Check

| Metric | Count | Status |
|---|:---:|:---:|
| Edge cases identified | 5 | ✅ |
| Edge cases mapped to a component | 5/5 | ✅ |
| Components with ≥1 PRIMARY requirement | 3/3 | ✅ |
| Orphaned edge cases | 0 | ✅ |

> The checkout activity diagram with decision points is in `docs/requirements/member_a_edge_cases.md` §"UML Activity Diagram".
