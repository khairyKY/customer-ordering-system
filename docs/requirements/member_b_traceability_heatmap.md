# Traceability Heatmap — Member B (Payment Slice)

**Member:** B — Payment Vertical Slice
**Generated:** 2026-05-18
**Source document:** `docs/requirements/member_b_payments_phase1.md`
**Disclosure:** Synthesized by AI from the cited Phase 1 source document and the
current codebase, per the CSE323 AI-as-Labor mandate. Verify against the slice owner's intent before submission.

---

## §1 — Persona

**Avatar:** "The Chaos Engineer" (Student Z) — hybrid adversary combining deliberate malicious intent with frustrated power-user behaviour, probing the payment logic for a free-meal exploit.

## §2 — Edge Case → Component → Mitigation Map

| EC | Persona Behaviour | System Component | Mitigation (Guard) | Response | Test Evidence |
|---|---|---|---|---|---|
| **REQ_EC_1** Negative Amount Injection | Tampers `totalAmount` to a negative value | Payment API boundary | `totalAmount > 0` enforced server-side before gateway call | `HTTP 400` | `src/backend/features/payment/test_payment.py` |
| **REQ_EC_2** Double-Submission Mash | Macro-clicks "Confirm" 50×/sec | Idempotency layer | Idempotency key, 300s window, cached first result | `HTTP 409` | `test_payment.py`, `tests/e2e/payment.spec.js` (duplicate test) |
| **REQ_EC_3** Cross-Tab Cart Tampering | Pays from a stale tab after another tab inflates the cart | Payment finalization | Server-side snapshot re-validation, `±$0.01` tolerance | `HTTP 409/422` | `test_payment.py` |
| **REQ_EC_4** Promo Stack-Overflow | Applies a discount exceeding the subtotal | Tax/promo engine | `Taxable = Max(0, Subtotal − Discount)` | Clamped to `$0.00` | `test_payment.py`, `payment.spec.js` (promo test) |
| **REQ_EC_5** 3D-Secure Ghost Redirect | Drops connection mid-redirect | Background reconciler | 15-min cron auto-cancel + inventory release | Async cancel | Cross-slice: Member D `sweep_service.py` |

## §3 — Requirement → Use Case Heatmap

> **P** = PRIMARY · **R** = RELATED. Carried forward from `member_b_payments_phase1.md` §6.

| Requirement | UC1 Card | UC2 COD | UC3 Promo | UC4 Summary | UC5 Failure |
|---|:---:|:---:|:---:|:---:|:---:|
| **REQ1** Secure Card Processing | **P** | | | | R |
| **REQ2** Mandatory 10% Tax | **P** | R | | R | |
| **REQ3** Promo Code Logic | | | **P** | R | R |
| **REQ4** Alternative Payment (COD) | | **P** | | | |
| **REQ5** Transaction Atomicity | **P** | R | | | |

## §4 — Functional Requirement → Edge Case Heatmap

| FR | REQ_EC_1 | REQ_EC_2 | REQ_EC_3 | REQ_EC_4 | REQ_EC_5 |
|---|:---:|:---:|:---:|:---:|:---:|
| **PAY-01** Secure Credential Input | **P** | R | | | |
| **PAY-02** Tax Computation Engine | | | R | **P** | |
| **PAY-03** Promo Code Logic | | | | **P** | |
| **PAY-04** Atomic Finalization | | **P** | **P** | | **P** |

## §5 — Zero-Orphan Check

| Metric | Count | Status |
|---|:---:|:---:|
| Edge cases identified | 5 | ✅ |
| Edge cases mapped to a component | 5/5 | ✅ |
| Requirements with ≥1 UC coverage | 5/5 | ✅ |
| Orphaned edge cases | 0 | ✅ |

> Pyramid placement: payment carries a 70/20/10 split — see `docs/requirements/TEST_PYRAMID_REPORT.md` and `docs/payment/verification_validation.md`.
