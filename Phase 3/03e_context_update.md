# CSE323 — Ticket System | Phase 3 Deliverable D5

## 03e: CONTEXT.md Execution Log Update

**Member:** C — Ticket System Vertical Slice
**Date:** 2026-05-16
**Status:** Phase 1, 2, and 3 Complete (Vertical Slice)

---

## Execution Log — May 16, 2026

### What Was Built

**Requirements & Design (Phase 1 & 2):**
- User persona Alex with 5 mapped behaviours and edge cases
- Full actor classification (Primary, Supporting, Offstage) and zero-orphan traceability matrix
- 26 Gherkin BDD scenarios and a measurable QA audit log (12 vague terms replaced)
- SSDs for happy path and all 5 failure paths, plus a full-lifecycle activity diagram
- OpenAPI 3.0.3 YAML contract for all 4 endpoints

**Implementation (Phase 3):**
- `POST /api/v1/tickets` endpoint with Zod validation and XSS sanitization
- SHA-256 deduplication (600-second window) with 409 Conflict error handling
- HuggingFace sentiment API integration with 5000ms AbortController timeout
- Score-based priority mapping: `score < 0.25` → CRITICAL, `< 0.50` → HIGH, `< 0.75` → MEDIUM, `>= 0.75` → LOW
- Fallback logic: ticket always persisted with `priority: MEDIUM` and `sentimentSource: "fallback"` on AI failure
- NaN/null score guard: `sentimentSource: "score_invalid"` when AI returns invalid data

---

### Test Cases Now Passing

- [x] **TC-01** — Create ticket happy path: 201 Created with correct response shape
- [x] **TC-02** — AI priority mapping: all 4 bands (CRITICAL, HIGH, MEDIUM, LOW)
- [x] **TC-06 (EC-1)** — XSS and SQL injection sanitization: script tags stripped, table not dropped
- [x] **TC-07 (EC-2)** — Duplicate submission: 201 then 409, HuggingFace called once
- [x] **TC-08 (EC-3)** — HuggingFace timeout: 201 with priority MEDIUM and sentimentSource `"fallback"`
- [x] **TC-09 (EC-4)** — Extreme payload: 422 before HuggingFace is called
- [x] **TC-10 (EC-5)** — NaN and null score: 201 with priority MEDIUM and sentimentSource `"score_invalid"`

**Total: 10 passed, 10 total across 2 test suites (TDP confirmed)**

---

### Files Created or Modified

| File | Description |
| ---- | ----------- |
| `src/backend/features/tickets/ticket.validators.js` | Zod schema with XSS sanitization |
| `src/backend/features/tickets/ticket.service.js` | Deduplication, HF integration, priority mapping |
| `src/backend/features/tickets/ticket.controller.js` | Request handling and service orchestration |
| `src/backend/features/tickets/ticket.routes.js` | Route registration with validation middleware |
| `src/backend/features/tickets/__tests__/ticket.integration.test.js` | TC-01, TC-02 |
| `src/backend/features/tickets/__tests__/ticket.edge.test.js` | EC-1 through EC-5 (TC-06 to TC-10) |
| `src/database/tickets.sql` | Full schema with constraints and indexes |
| `src/frontend/src/features/tickets/hooks/useTickets.js` | Data fetching hook |
| `src/frontend/src/features/tickets/store/ticketStore.js` | Zustand store |
| `src/frontend/src/features/tickets/types/ticket.types.js` | Type definitions and ENUMs |
| `Phase 1/01a_persona_and_actors.md` | Persona and actor classification |
| `Phase 1/01b_edge_cases.md` | 5 edge cases with padlocks and TDP tests |
| `Phase 1/01c_traceability_matrix.md` | Full traceability matrix |
| `Phase 2/02a_GHERKIN_TEAM.md` | 26 Gherkin BDD scenarios |
| `Phase 2/02b_QA_AUDIT.md` | QA ambiguity audit log |
| `Phase 2/02c_SSD_HAPPY.md` | SSD happy path |
| `Phase 2/02d_SSD_FAILURE.md` | SSD failure paths |
| `Phase 2/02e_ACTIVITY.md` | Activity diagram |
| `Phase 2/02f_API_CONTRACT.yaml` | OpenAPI 3.0.3 contract |
| `.ai/CONTEXT.md` | Sprint log and feature status updated |

---

### Key Decisions Made

| Decision | Value |
| -------- | ----- |
| Field names | `subject` and `body` (not title/description) |
| Priority ENUM | `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` (not URGENT) |
| Status ENUM | `OPEN`, `IN_PROGRESS`, `RESOLVED` (not CLOSED) |
| sentimentSource values | `"hf_model"`, `"fallback"`, `"score_invalid"`, `"low_content"` |
| AbortController timeout | 5000ms — per Phase 1 EC-3 definition |
| Dedup hash input | SHA-256(userId + subject + body), 600-second window |
| Validation order | subject max 120 chars, body max 2000 chars — enforced before any external API call |
| Resilience | HuggingFace failure always returns MEDIUM — ticket always persisted, 201 never blocked by AI |
| Storage | In-memory for Phase 3 — Prisma/PostgreSQL to be wired in Phase 4 |
| Auth | `mockAuthGuard` used in tests pending Member D confirming JWT payload structure |

---

### What Remains To Be Done

1. **TC-03** — `GET /api/v1/tickets`: customer views own tickets (JWT-scoped, paginated)
2. **TC-04** — `GET /api/v1/tickets/triage`: agent triage queue (role-gated, priority sorted)
3. **TC-05** — `PATCH /api/v1/tickets/:id/status`: status state machine
4. **Data Persistence** — replace in-memory storage with Prisma + PostgreSQL
5. **Auth** — replace `mockAuthGuard` with real JWT middleware from Member D
6. **Frontend** — `TicketForm.jsx` and `TicketList.jsx` implementation
7. **Phase 4** — test pyramid report, Playwright E2E scripts, Verification vs Validation statement

---

*Phase 3e — Context Update | CSE323 D5 | Member C — Ticket System*
