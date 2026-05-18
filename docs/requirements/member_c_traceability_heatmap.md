# Traceability Heatmap — Member C: Tickets / Support System

**Date:** 2026-05-20 (refreshed after the FastAPI migration sweep)
**Owner:** Member C
**Curriculum Source:** `CSE323_Project_Overview.pdf` — Phase 1 "Traceability Heatmap"
**Purpose:** Mathematically prove every requirement maps backward to a Business Goal and forward to a Test, with **zero orphans**.

---

## Legend

| Symbol | Meaning |
|---|---|
| ✅ | Trace exists and is verifiable |
| 🟢 | Implemented and passing on `main` |
| 🟡 | Designed; test pending Phase 3 |
| ❌ | **ORPHAN** — missing trace (must be resolved before Phase 3) |
| ⛓ | Cross-slice dependency (requires RFC) |

---

## 1. Master Heatmap (Backward Trace: Test ← Feature ← FR ← BG)

| BG | Business Goal | FR | NFR(s) | Feature / Endpoint | Persona Behaviour | Test IDs | Trace Status |
|---|---|---|---|---|---|---|---|
| **BG-1** | Provide a fast, acknowledgeable channel for customer issues | FR-01 | NFR-C1, NFR-C2 | `POST /api/v1/tickets` | B-1 | TC-01 | 🟢 |
| **BG-1** | — | FR-01.b | NFR-C2 | Auth gate on `POST /api/v1/tickets` (401 when anonymous) | — | TC-01.b | 🟢 |
| **BG-2** | Triage issues by urgency without manual customer input | FR-02 | NFR-C3 | `service.get_ai_priority` → HuggingFace sentiment | B-3 | TC-02 | 🟢 |
| **BG-2** | — | FR-02.b | NFR-C3.b | Score-to-priority mapping (`<0.25` CRITICAL · `<0.50` HIGH · `<0.75` MEDIUM · `≥0.75` LOW) | — | TC-02 (parametrised) | 🟢 |
| **BG-3** | Give the customer ongoing visibility of their tickets | FR-03 | NFR-C1, NFR-C4 | `GET /api/v1/tickets` (paginated, JWT-scoped) | — | TC-03 | 🟢 |
| **BG-4** | Equip the agent to work the queue in priority order | FR-04 | NFR-C4 | `GET /api/v1/tickets/triage` (CRITICAL→LOW, oldest-first tie-break) | — | TC-04 | 🟢 |
| **BG-4** | — | FR-04.b | NFR-C4 | Role gate — customers receive `403 Forbidden` | — | TC-04 (forbidden case) | 🟢 |
| **BG-2** | — | FR-05 | NFR-C4 | `PATCH /api/v1/tickets/{id}/status` — forward-only state machine | — | TC-05 | 🟢 |
| **BG-2** | — | FR-05.b | NFR-C4 | Illegal regression (`RESOLVED → OPEN`) returns `422` | — | TC-05 (illegal branch) | 🟢 |
| **BG-1** | Defend against malicious input | EC-1 | NFR-C5 | `sanitize_html` strips `<script>` + all tags before persistence | B-4 | TC-06 | 🟢 |
| **BG-1** | — | EC-2 | NFR-C2 | SHA-256 dedup over `user:subject:body`, 600 s sliding window → `409` | B-1 | TC-07 | 🟢 |
| **BG-2** | — | EC-3 | NFR-C3.c | HuggingFace 5 s timeout → `priority=MEDIUM`, `sentiment_source="fallback"` | B-5 | TC-08 | 🟢 |
| **BG-1** | — | EC-4 | NFR-C5 | Field length validation (`subject` 5–120, `body` 10–2000) → `422` before any HF call | B-2 | TC-09 | 🟢 |
| **BG-2** | — | EC-5 | NFR-C3.c | NaN / non-dict / missing-score guard → `priority=MEDIUM`, `sentiment_source="score_invalid"` | B-3 | TC-10 | 🟢 |

---

## 2. Forward Trace (BG → FR → Feature)

```
BG-1 (Issue intake — acknowledge fast, reject malice)
  ├─ FR-01    ─▶ POST  /api/v1/tickets
  ├─ FR-01.b  ─▶ Bearer-JWT auth gate on POST
  ├─ EC-1     ─▶ sanitize_html() at validator boundary
  ├─ EC-2     ─▶ SHA-256 dedup + 600 s window → 409
  └─ EC-4     ─▶ Pydantic length constraints → 422 (pre-AI)

BG-2 (Urgency triage — machine-inferred, not user-supplied)
  ├─ FR-02    ─▶ service.get_ai_priority() → HuggingFace
  ├─ FR-02.b  ─▶ score_to_priority() boundary mapping
  ├─ EC-3     ─▶ 5 s timeout → MEDIUM fallback
  ├─ EC-5     ─▶ Invalid-score guard → MEDIUM fallback
  ├─ FR-05    ─▶ PATCH /api/v1/tickets/{id}/status (state machine)
  └─ FR-05.b  ─▶ Forward-only transitions; illegal → 422

BG-3 (Customer visibility)
  └─ FR-03    ─▶ GET  /api/v1/tickets (JWT-scoped, paginated)

BG-4 (Agent triage workflow)
  ├─ FR-04    ─▶ GET  /api/v1/tickets/triage  ⛓ Member D JWT (role=agent)
  └─ FR-04.b  ─▶ role gate; non-agent → 403
```

---

## 3. NFR Coverage Cross-Tab

| NFR | Description | Covered By Features | Test Method |
|---|---|---|---|
| **NFR-C1** | API response time ≤ 1500 ms p95 | All endpoints | Pytest timing assertions + Playwright `wait_for_response` |
| **NFR-C2** | Auth gating via Member D's JWT | `POST`, `GET`, `GET /triage`, `PATCH` | Integration tests assert `401` when `Authorization` is absent |
| **NFR-C3** | AI sentiment integration | `POST /tickets` | Unit tests mock `httpx.AsyncClient.post` across happy + 5 failure modes |
| **NFR-C3.b** | Score-to-priority is deterministic | `score_to_priority` (pure function) | Parametrised unit tests on the 4 boundary points |
| **NFR-C3.c** | AI failure is non-fatal — ticket still persists | `get_ai_priority` | Unit + integration: `TimeoutException`, `ConnectError`, non-dict payload, NaN |
| **NFR-C4** | Role-gated agent operations | `GET /triage`, `PATCH .../status` | Integration tests for `403` when customer hits agent routes |
| **NFR-C5** | Hostile input defence (XSS / oversize) | `sanitize_html`, Pydantic constraints | Unit on `sanitize_html`, integration on `422` and `<script>` strip |

---

## 4. Persona Behaviour Traceability

| Behaviour | Persona | Escalates To | Tested By |
|---|---|---|---|
| B-1 — Repeated 8–10 submit clicks | Anxious Shopper (Alex) | EC-2 (dedup) | TC-07 (integration), `test_create_ticket_rejects_immediate_duplicate` (unit) |
| B-2 — 50 000-char paste | Anxious Shopper | EC-4 (length 422) | TC-09 (integration), Pydantic schema unit tests |
| B-3 — Emoji-only body | Anxious Shopper | EC-5 (invalid-score guard) | TC-10 (integration), NaN unit test |
| B-4 — JavaScript-popup paste | Anxious Shopper | EC-1 (sanitize_html) | TC-06 (integration), `test_sanitize_*` unit tests |
| B-5 — Peak-traffic submission | Anxious Shopper | EC-3 (HF timeout) | TC-08 (integration), `test_get_ai_priority_timeout_is_fallback` (unit) |

---

## 5. Orphan Audit

| Check | Result |
|---|---|
| Every FR has ≥1 Feature | ✅ |
| Every Feature has ≥1 Test | ✅ — all 🟢 implemented and passing |
| Every NFR has ≥1 Verifying Test | ✅ |
| Every Persona Behaviour escalates to FR/EC | ✅ |
| Every BG has ≥1 FR | ✅ |
| **Total Orphans** | **0** |

---

## 6. Cross-Slice Dependencies Surfaced

| Dependency | Counterparty | Status |
|---|---|---|
| ⛓ Bearer JWT verification via `app.dependencies.get_current_user` / `require_agent` | **Member D** — Auth slice | ✅ Live since 2026-05-20 migration; previously a header-injected mock (`X-User-ID`) |
| ⛓ Customer / Agent role values | Member D — `Role` enum (`models.py`) | ✅ Consumed read-only; no schema edits from this slice |
| ⛓ HuggingFace `distilbert-base-uncased-finetuned-sst-2-english` | External (HuggingFace Inference API) | ✅ Stable; fail-closed to `MEDIUM` per EC-3/EC-5 |
| ⛓ Frontend `TicketForm.jsx` / `TicketList.jsx` mount points | **Member A** (frontend orchestration) | 🟡 Wired in `App.jsx` as of `fix/e2e-build-tickets-ui-and-payment-wizard`; Playwright E2E specs at `test_tickets_e2e.py` |

No active blockers remain on this slice post-migration. The single outstanding workstream is the frontend Playwright suite turning green, which depends on Member A's `App.jsx` routing — not on backend changes.

---

## 7. Implementation Index

All references below resolve against the canonical FastAPI core after the
2026-05-20 migration sweep. The legacy `src/backend/features/tickets/`
directory has been removed.

| Component | Path |
|---|---|
| HTTP router | `src/backend_python/app/routers/tickets.py` |
| Service layer | `src/backend_python/app/services/tickets_service.py` |
| Pydantic schemas (`TicketBase`, `TicketCreate`, `Ticket`, etc.) | `src/backend_python/app/schemas.py` |
| Integration tests | `src/backend_python/tests/test_tickets.py` (12 cases) |
| Unit tests | `src/backend_python/tests/test_tickets_unit.py` (48 cases) |
| Playwright E2E | `src/backend_python/tests/playwright/specs/test_tickets_e2e.py` (4 cases) |

---

*Disclosure: this heatmap was generated with AI assistance under the project's
documented AI-as-Labor methodology. All FR / EC / TC IDs reference Member C's
own Phase 1 document (`member_c_tickets_phase1.md`); every test ID and path
above resolves to a file that exists on disk at the audit date.*
