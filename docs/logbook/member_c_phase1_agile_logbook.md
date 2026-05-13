# Phase 1 Agile Logbook — Member C
**Slice:** Tickets / Support System
**Phase:** 1 — Requirement Discovery & Traceability
**Status:** ✅ Complete (Tickets) | ~~Auth: N/A — owned by Member D~~

> ⚠️ **Ownership Clarification (2026-05-16):** Member C owns **Tickets ONLY**. Auth & User Management is owned by **Member D**. Earlier documentation incorrectly listed "Tickets + Auth" as Member C's scope. This logbook reflects the corrected, authoritative assignment.

---

## Sprint Goals

| Sprint | Goal | Status |
|---|---|---|
| Sprint 1 | Classify actors for Ticket slice; run "Alex the Anxious Shopper" persona discovery | ✅ Done |
| Sprint 2 | Define 5 ECs and padlocks; establish HuggingFace integration contract and fallback rules | ✅ Done |

**Phase 1 Objective:** Discover all actors, hidden requirements, and edge cases for the Ticket/Support vertical slice. Establish traceability from TC-01 through TC-10.

---

## Daily Standup Notes

### 2026-05-12 — Phase 1 Kickoff (Tickets Slice)
- **Done:** Actor classification complete:
  - Primary: Customer (Alex, `role: "customer"`), Support Agent (`role: "agent"`)
  - Supporting: HuggingFace Sentiment API (5,000ms timeout, MEDIUM fallback), Auth Service JWT (Member D — consumed)
  - Offstage: Ticket Database, Notification Queue
- **Doing:** Running "Alex — The Anxious Shopper" persona discovery.
- **Blockers:** Auth middleware not yet shipped (Member D). Using mock JWT for testing.

### 2026-05-12 — Edge Case Discovery Complete
- **Done:** 5 edge cases discovered and mapped:
  - EC-1: XSS / SQL Injection → DOMPurify + Prisma parameterized queries
  - EC-2: Duplicate Submission Spam → SHA-256 hash dedup (10-min / 600s window)
  - EC-3: HuggingFace API Timeout → AbortController 5,000ms + MEDIUM fallback
  - EC-4: Extreme Payload Size → `express.json({ limit: '10kb' })` + Zod constraints
  - EC-5: Emoji Overload / NaN Score → score-validity guard → MEDIUM fallback
- **Doing:** Writing traceability matrix (TC-01..TC-10).
- **Blockers:** None.

### 2026-05-13 — Phase 1 Published
- **Done:** Traceability matrix (10 FRs/ECs × 10 TCs heatmap) complete. Zero orphaned requirements. Zero orphaned test cases. Docs committed to `Phase 1/` root.
- **Doing:** Beginning Phase 2 Gherkin scripting.
- **Blockers:** Auth slice still pending (Member D); using `x-mock-role` header shim.

---

## Phase 1 Deliverables Checklist

- [x] Actor classification — `Phase 1/01a_persona_and_actors.md §2`
- [x] Adversarial persona "Alex — The Anxious Shopper" (B-1 through B-5)
- [x] 5 functional requirements: FR-01 (Create), FR-02 (Sentiment), FR-03 (View Own), FR-04 (Agent Queue), FR-05 (Status Update)
- [x] 5 edge cases: EC-1 (XSS/SQLi), EC-2 (Dedup), EC-3 (HF Timeout), EC-4 (Payload), EC-5 (NaN Score)
- [x] Traceability matrix: 10 FRs/ECs × 10 TCs — zero orphans — `Phase 1/01c_traceability_matrix.md`
- [x] Priority ENUM defined: CRITICAL / HIGH / MEDIUM / LOW
- [x] Sentiment score mapping: `< 0.25` → CRITICAL · `0.25–0.49` → HIGH · `0.50–0.74` → MEDIUM · `≥ 0.75` → LOW
- [x] HuggingFace fallback contract: timeout > 5,000ms OR invalid score → `priority: MEDIUM`, `sentiment_source: "fallback"`
- [ ] Auth slice work: **N/A — not in scope for Member C**
