# Phase 1 Agile Logbook — Member B
**Slice:** Payment
**Phase:** 1 — Requirement Discovery & Traceability
**Status:** ✅ Complete

---

## Sprint Goals

| Sprint | Goal | Status |
|---|---|---|
| Sprint 1 | Classify actors for the Payment slice; discover hidden requirements via adversarial persona | ✅ Done |
| Sprint 2 | Write 5 REQ_EC padlock requirements; establish idempotency and race-condition specs | ✅ Done |

**Phase 1 Objective:** Apply the adversarial "Student Z" persona to discover hidden edge cases in the Payment slice. Establish measurable padlock requirements that prevent financial exploits.

---

## Daily Standup Notes

### 2026-05-12 — Phase 1 Kickoff
- **Done:** Actor classification complete (Customer = Primary, Stripe = Supporting, Accounting = Offstage, Tax Authorities = Offstage, Internal DB = Supporting).
- **Doing:** Running adversarial persona discovery with "Malicious Student Z" — 5 attack vectors identified.
- **Blockers:** None.

### 2026-05-12 — REQ_EC Discovery Complete
- **Done:** 5 REQ_EC padlocks defined:
  - REQ_EC_1: Server-side rejection of `amount <= 0`
  - REQ_EC_2: Idempotency key with **300-second** dedup window (canonical — supersedes any 60s reference)
  - REQ_EC_3: Server-side cart re-calculation at moment of payment
  - REQ_EC_4: Non-negative floor `Max(0, Subtotal - Discount)` before tax
  - REQ_EC_5: 15-minute auto-cancellation for `PAYMENT_PENDING` orders
- **Doing:** Publishing Phase 1 docs to `md/phase1/`.
- **Blockers:** None.

### 2026-05-12 — Phase 1 Published
- **Done:** Phase 1 persona discovery, actor classification, and edge cases committed. Tax rate confirmed as **10% global mandate** (source of truth for all slices).
- **Doing:** Beginning Phase 2 design (Gherkin, SSDs).
- **Blockers:** None.

---

## Phase 1 Deliverables Checklist

- [x] Actor classification — `md/phase1/Phase1_ActorClassification.md`
- [x] Adversarial persona "Student Z" — `md/phase1/Phase1_PersonaDiscovery_updated.md` (canonical; 300s window)
- [x] 5 REQ_EC padlock requirements defined (REQ_EC_1 through REQ_EC_5)
- [x] Tax rate: **10%** — confirmed as Global Mandate for all slices
- [x] Currency: **USD** — fixed
- [x] Gateway timeout: **30 seconds**
- [x] Session expiry: **24 hours** (inherited from Auth slice — Member D)
- [x] Idempotency window: **300 seconds** (canonical; archive 60s version in `Phase1_PersonaDiscovery.md`)
- [ ] Idempotency window conflict (C-2): Archive old 60-second file or add deprecation banner — **OPEN**
