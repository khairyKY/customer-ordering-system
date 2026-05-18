# Phase 2 Agile Logbook — Member C
**Slice:** Tickets / Support System
**Phase:** 2 — Design & Specification
**Status:** ✅ Complete

> Reconstructed from git history and repository artifacts (2026-05-18). Verify against the slice owner's records before submission.

---

## Sprint Goals

| Sprint | Goal | Status |
|---|---|---|
| Sprint 2.1 | Author Gherkin scenarios for FR-01..05 and EC-01..05 | ✅ Done |
| Sprint 2.2 | Produce UML models (SSD + Activity Diagrams) | ✅ Done |
| Sprint 2.3 | Specify the HuggingFace integration and fallback contract | ✅ Done |

**Phase 2 Objective:** Design the tickets slice — Gherkin acceptance scenarios, UML models, the sentiment-priority mapping, and the HuggingFace failure contract — ready for Phase 3 implementation.

---

## Daily Standup Notes

### 2026-05-13 — Gherkin Scripting
- **Done:** Given/When/Then scenarios authored for the 5 functional requirements (FR-01..05) and the 5 edge cases (EC-01..05).
- **Doing:** Drawing the ticket-lifecycle UML models.
- **Blockers:** Auth slice not yet shipped (Member D) — using a mock JWT shim for design assumptions.

### 2026-05-14 — UML & Integration Contract
- **Done:** `docs/requirements/member_c_tickets_phase2_design.md` published — SSDs, Activity Diagrams, the sentiment-score → priority mapping (`<0.25` CRITICAL … `≥0.75` LOW), and the HuggingFace contract (5,000ms timeout → MEDIUM fallback).
- **Doing:** Handing off to Phase 3 implementation.
- **Blockers:** None.

---

## Phase 2 Deliverables Checklist

- [x] Gherkin scenarios for FR-01..05 and EC-01..05
- [x] System Sequence Diagrams + Activity Diagrams — `member_c_tickets_phase2_design.md`
- [x] Sentiment-score → priority mapping defined
- [x] HuggingFace fallback contract: timeout / invalid score → `MEDIUM`
- [x] Forward-only status state machine: OPEN → IN_PROGRESS → RESOLVED
