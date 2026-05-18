# Traceability Heatmap — Member C (Tickets / Support System)

**Member:** C — Tickets Vertical Slice
**Generated:** 2026-05-18
**Source document:** `docs/requirements/member_c_tickets_phase1.md`
**Disclosure:** Synthesized by AI from the cited Phase 1 source document and the
current codebase, per the CSE323 AI-as-Labor mandate. Verify against the slice owner's intent before submission.

---

## §1 — Persona

**Avatar:** "Alex — The Anxious Shopper" — a moderate-tech-literacy customer who treats digital silence as being ignored and acts repeatedly until acknowledged.

## §2 — Persona Behaviour → Edge Case → Component Map

| Behaviour | EC | System Component | Mitigation (Padlock) | Test Evidence |
|---|---|---|---|---|
| **B-1** Clicks "Submit" 8–10× in 30s | EC-2 Duplicate Submission | `service.py` `create_ticket` | `SHA-256(user+subject+body)` dedup, 600s window → `409` | `tests/test_tickets.py`, `test_edge_cases.py` |
| **B-2** Pastes a 50,000-char email dump | EC-4 Extreme Payload | `models.py` `TicketBase` | Field length validation (subject 5–120, body 10–2000) → `422` | `tests/test_unit.py` |
| **B-3** Uses emoji-only body | EC-5 Tokenizer Failure | `service.py` `get_ai_priority` | Invalid/`NaN` score guard → `MEDIUM`, `score_invalid` | `tests/test_edge_cases.py` |
| **B-4** Pastes a JS error popup as "proof" | EC-1 XSS / SQL Injection | `models.py` `sanitize_html` | Strip `<script>` + all HTML tags before persistence | `tests/test_edge_cases.py` |
| **B-5** Submits during a peak flash sale | EC-3 HuggingFace Timeout | `service.py` `get_ai_priority` | 5s timeout; persistence guaranteed; fallback → `MEDIUM` | `tests/test_edge_cases.py` |

## §3 — Functional Requirement → Component → Test Heatmap

| FR | Component | Primary TC | Status |
|---|---|:---:|:---:|
| **FR-01** Create Ticket | `routes.py` POST, `service.create_ticket` | TC-01 | 🟢 Implemented |
| **FR-02** Sentiment Scoring & Priority | `service.get_ai_priority` | TC-02 | 🟢 Implemented |
| **FR-03** View Own Tickets | `routes.py` GET, `service.get_tickets` | TC-03 | 🟢 Implemented |
| **FR-04** Agent Triage Queue | `routes.py` `/triage`, `service.get_triage_queue` | TC-04 | 🟢 Implemented |
| **FR-05** Update Ticket Status | `routes.py` PATCH, `service.update_ticket_status` | TC-05 | 🟢 Implemented |

## §4 — Requirement → Test Case Heatmap

> **P** = PRIMARY · **R** = RELATED. Carried forward from `member_c_tickets_phase1.md` §5.

| | TC-01 | TC-02 | TC-03 | TC-04 | TC-05 | TC-06 | TC-07 | TC-08 | TC-09 | TC-10 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **FR-01** Create Ticket | **P** | R | | | | R | R | R | R | R |
| **FR-02** Sentiment Scoring | | **P** | | | | | | R | | R |
| **FR-03** View Own Tickets | | | **P** | | | | | | | |
| **FR-04** Agent Triage Queue | | | | **P** | R | | | | | |
| **FR-05** Update Ticket Status | | | | | **P** | | | | | |
| **EC-1** XSS / SQL Injection | | | | | | **P** | | | | |
| **EC-2** Duplicate Submission | | | | | | | **P** | | | |
| **EC-3** HuggingFace Timeout | | | | | | | | **P** | | |
| **EC-4** Extreme Payload | | | | | | | | | **P** | |
| **EC-5** Tokenizer Failure | | | | | | | | | | **P** |

## §5 — Zero-Orphan Check

| Metric | Count | Status |
|---|:---:|:---:|
| Functional Requirements | 5 | ✅ |
| Edge cases identified | 5 | ✅ |
| Test cases defined | 10 | ✅ |
| Requirements with PRIMARY coverage | 10/10 | ✅ |
| Orphaned requirements / test cases | 0 | ✅ |

> **Implementation status:** The tickets slice is fully implemented in
> `src/backend/features/tickets/` (`routes.py`, `service.py`, `models.py`) with
> a passing test suite (`test_tickets.py`, `test_edge_cases.py`, `test_unit.py`).
> The earlier May-16 audit note describing "stubbed/commented logic" is **stale
> and superseded** by the current code.
