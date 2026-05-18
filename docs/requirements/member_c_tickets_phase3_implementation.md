# Phase 3: Test-Driven Implementation
## Member C — Tickets / Support System (Tickets Slice)

**Date:** 2026-05-20 (post-FastAPI migration)
**Slice:** `tickets`
**Owner:** Member C
**Curriculum Source:** `CSE323_Project_Overview.pdf` — Phase 3
**Phase 2:** [`member_c_tickets_phase2_design.md`](./member_c_tickets_phase2_design.md)
**Implementation:** `src/backend_python/` (FastAPI + Pydantic + httpx)

> **Stack:** Python 3.12 / FastAPI / Pydantic v2 / httpx (async HuggingFace client).
> Tests: pytest + FastAPI TestClient + in-memory SQLite for auth. Phase 1+2 docs
> are language-agnostic contracts; this Phase 3 doc realises them in Python and
> records the post-migration state of the canonical core.

---

## Deliverable Map (per CSE323 PDF, Phase 3)

| PDF Criterion | Section |
|---|---|
| **1. The Failing Test** — establish a mathematical boundary | §1 |
| **2. The Edge Case Cage** — boundary / threshold / extreme padlocks | §2 |
| **3. Iteration** — prompt the AI until logic fits the test boundary | §3 |
| **4. Vertical Slicing** — UI / Logic / DB delivered as one stack | §4 |

---

## 1. The Failing Test — Mathematical Boundaries

All failing tests were authored **before** the implementation existed in the
canonical backend. Each test below defines a strict mathematical boundary
that the production code must satisfy.

### 1.1 Score-to-priority boundary matrix (`tests/test_tickets_unit.py`)

```python
# Boundary: closed-on-the-right priority bands (FR-02)
@pytest.mark.parametrize("score,expected", [
    (0.0,   TicketPriority.CRITICAL),
    (0.249, TicketPriority.CRITICAL),
    (0.25,  TicketPriority.HIGH),
    (0.499, TicketPriority.HIGH),
    (0.50,  TicketPriority.MEDIUM),
    (0.749, TicketPriority.MEDIUM),
    (0.75,  TicketPriority.LOW),
    (1.0,   TicketPriority.LOW),
])
def test_score_to_priority_boundaries(score, expected):
    assert score_to_priority(score) is expected
```

### 1.2 Dedup window boundary (EC-2)

```python
def test_create_ticket_rejects_immediate_duplicate():
    data = TicketCreate(subject="Dup subject",
                        body="A body long enough to validate.")
    with _mock_post(0.5):
        first = _run(TicketService.create_ticket(data, "user_01"))
        with pytest.raises(HTTPException) as exc:
            _run(TicketService.create_ticket(data, "user_01"))
    assert first.status is TicketStatus.OPEN
    assert exc.value.status_code == 409  # boundary: 2nd submission inside 600s


def test_create_ticket_allows_resubmission_after_window_expires():
    """The legacy suite never proved the dedup window actually closes."""
    data = TicketCreate(subject="Dup subject 2",
                        body="A body long enough to validate.")
    with _mock_post(0.5):
        first = _run(TicketService.create_ticket(data, "user_01"))
        # Backdate the stored hash beyond the dedup window
        h = submission_hash("user_01", data.subject, data.body)
        tickets_service.submission_hashes[h] = (
            time.time() - tickets_service.DEDUP_WINDOW_SECONDS - 1
        )
        second = _run(TicketService.create_ticket(data, "user_01"))
    assert first.id != second.id  # boundary: window re-opens after 600s
```

### 1.3 State-machine boundary (FR-05)

```python
def test_status_open_to_in_progress_is_legal():
    t = _make_ticket("u1", TicketPriority.LOW)
    tickets_service.tickets.append(t)
    updated = TicketService.update_ticket_status(t.id, TicketStatus.IN_PROGRESS)
    assert updated.status is TicketStatus.IN_PROGRESS

def test_status_resolved_to_open_is_illegal():
    t = _make_ticket("u1", TicketPriority.LOW)
    t.status = TicketStatus.RESOLVED
    tickets_service.tickets.append(t)
    with pytest.raises(HTTPException) as exc:
        TicketService.update_ticket_status(t.id, TicketStatus.OPEN)
    assert exc.value.status_code == 422  # boundary: forward-only state machine

def test_status_unknown_ticket_is_404():
    """Distinguish lookup-miss (404) from illegal-transition (422)."""
    with pytest.raises(HTTPException) as exc:
        TicketService.update_ticket_status("does-not-exist", TicketStatus.IN_PROGRESS)
    assert exc.value.status_code == 404
```

### 1.4 HuggingFace robustness boundaries (EC-3, EC-5)

```python
def test_get_ai_priority_timeout_is_fallback():
    with patch("httpx.AsyncClient.post", side_effect=httpx.TimeoutException("t")):
        priority, source = _run(get_ai_priority("s", "b"))
    assert priority is TicketPriority.MEDIUM
    assert source == "fallback"          # boundary: 5s timeout → MEDIUM

def test_get_ai_priority_nan_score_is_score_invalid():
    with _mock_post(score=float("nan")):
        priority, source = _run(get_ai_priority("s", "b"))
    assert priority is TicketPriority.MEDIUM
    assert source == "score_invalid"     # boundary: NaN must not route to LOW

def test_get_ai_priority_non_dict_payload_is_score_invalid():
    with _mock_post(json_value=[["unexpected_string"]]):
        priority, source = _run(get_ai_priority("s", "b"))
    assert priority is TicketPriority.MEDIUM
    assert source == "score_invalid"     # boundary: legacy code crashed here
```

### 1.5 Boundary summary table

| Test ID | Boundary established | Source code that must satisfy |
|---|---|---|
| T-C-SCORE-MAP × 8 | All 4 priority bands honour their closed-on-the-right edge | `score_to_priority()` in `tickets_service.py` |
| T-C-DEDUP-IN | 2nd identical submission inside 600 s → `409` | `TicketService.create_ticket` window check |
| T-C-DEDUP-OUT | Submission after window expires creates a new ticket | Same — `time.time() - existing >= DEDUP_WINDOW_SECONDS` |
| T-C-STATE-LEGAL × 2 | `OPEN → IN_PROGRESS → RESOLVED` succeed | `_VALID_TRANSITIONS` dict |
| T-C-STATE-ILLEGAL × 2 | Any backward / skipping transition → `422` | Same — `new_status not in _VALID_TRANSITIONS[current]` |
| T-C-STATE-404 | Unknown ticket id → `404` (distinct from 422) | `next(... default=None)` + early raise |
| T-C-HF-TIMEOUT | `httpx.TimeoutException` → `MEDIUM` + `"fallback"` | `get_ai_priority` `try/except TimeoutException` |
| T-C-HF-NAN | `score=NaN` → `MEDIUM` + `"score_invalid"` | `math.isnan(score)` guard |
| T-C-HF-NONDICT | Non-dict sentiment payload → `MEDIUM` + `"score_invalid"` | `isinstance(sentiment, dict)` check |
| T-C-XSS | `<script>` in `subject` is stripped before persistence | `sanitize_html` validator on `TicketBase` |
| T-C-LENGTH-MIN / MAX | `subject` 5–120, `body` 10–2000 → `422` | Pydantic `Field(min_length=..., max_length=...)` |
| T-C-AUTH-401 | Anonymous `POST /tickets` → `401` | `get_current_user` dependency |
| T-C-AUTH-403 | Customer hitting `/triage` → `403` | `require_agent` dependency |

---

## 2. The Edge Case Cage — Padlocks

Three layers of padlocks, applied in order — each blocks invalid data before
it can reach the next layer.

### 2.1 Layer 1: Pydantic schema padlocks (`app/schemas.py`)

| Padlock | Field | Rule | Blocks |
|---|---|---|---|
| Type | `TicketBase.subject`, `body` | `str` via Pydantic v2 | NaN / int / bool injection |
| Length | `subject` | `min_length=5, max_length=120` | EC-4 oversized + empty submissions |
| Length | `body` | `min_length=10, max_length=2000` | EC-4 oversized + token-bombing HF |
| Validator | `subject` / `body` | `sanitize_html` stripping `<script>` then any tag | EC-1 XSS / SQL fragments before persistence |
| Required | `TicketUpdateStatus.status` | `TicketStatus` enum literal | Arbitrary strings, missing field |

### 2.2 Layer 2: Service-layer padlocks (`app/services/tickets_service.py`)

| Padlock | Mechanism | Blocks |
|---|---|---|
| Dedup hash | `SHA-256(user_id:subject:body)` keyed in `submission_hashes` | EC-2 repeated submissions |
| Dedup window | `now − stored < DEDUP_WINDOW_SECONDS (600 s)` | EC-2 — boundary closes after 10 min |
| HF timeout | `httpx.AsyncClient(timeout=5.0)` | EC-3 — service never blocks > 5 s on AI |
| HF schema guard | `isinstance(sentiment, dict)` + `math.isnan(score)` | EC-5 + new non-dict / NaN branches the legacy code crashed on |
| State machine | `new_status in _VALID_TRANSITIONS[current]` | FR-05 backward / skipping transitions |

### 2.3 Layer 3: Router-layer padlocks (`app/routers/tickets.py`)

| Padlock | Mechanism | Blocks |
|---|---|---|
| Auth | `get_current_user` (Bearer JWT, Member D's HS256) | Anonymous mutation/read attempts |
| Role gate (triage) | `dependencies=[Depends(require_agent)]` on `/triage` and `/{id}/status` | Customers escalating to agent operations |
| Pagination | `page: int = Query(1, ge=1)`, `limit: int = Query(10, ge=1, le=100)` | Unbounded result sets, page=0 |

---

## 3. Iteration — Prompt-Engineering Log (TDP)

The Test-Driven Prompting protocol used to land the slice on the canonical
backend. Each row captures one failing → passing cycle.

| Iter | Failing test | Prompt summary | Resulting commit |
|---|---|---|---|
| 1 | `test_score_to_priority_boundaries[0.25]` | "Map sentiment scores to 4 priority bands; boundary 0.25 belongs to HIGH not CRITICAL" | Initial `score_to_priority` (closed-on-right) |
| 2 | `test_get_ai_priority_nan_score_is_score_invalid` | "Guard against `math.isnan(score)` — legacy code returned LOW because `nan < 0.25` is `False`" | `math.isnan` guard added to `get_ai_priority` |
| 3 | `test_get_ai_priority_non_dict_payload_is_score_invalid` | "Sentiment payload may be a string — wrap dict access in `isinstance(sentiment, dict)`" | Defensive isinstance check |
| 4 | `test_create_ticket_allows_resubmission_after_window_expires` | "Prove the dedup window actually closes by back-dating the stored hash" | No code change — verified existing logic |
| 5 | `test_status_unknown_ticket_is_404` | "Distinguish missing-id (404) from illegal-transition (422)" | Early `next(...) is None` raise of 404 |
| 6 | `test_anonymous_cannot_create_ticket` | "Replace `X-User-ID` header mock with `get_current_user` Bearer-JWT dep" | Router rewritten against canonical auth |

All 60 ticket-related tests pass on `main` post-migration (12 integration + 48
unit). See [`member_c_tickets_phase4_validation.md`](./member_c_tickets_phase4_validation.md) §1 for the
pyramid math.

---

## 4. Vertical Slicing — UI / Logic / DB Delivered Together

### 4.1 Layer inventory

| Layer | Path | Responsibility |
|---|---|---|
| Frontend (UI) | `src/frontend/src/features/tickets/components/TicketForm.jsx`, `TicketList.jsx` | Customer ticket submission + own-ticket list. Wired into `App.jsx` post-2026-05-20. |
| Frontend (state / API client) | `src/frontend/src/features/tickets/api/ticketApi.js`, `store/ticketStore.js`, `hooks/useTickets.js` | Fetch / mutate against `/api/v1/tickets` |
| Backend router | `src/backend_python/app/routers/tickets.py` | HTTP surface — auth deps, status codes, response models |
| Backend service | `src/backend_python/app/services/tickets_service.py` | Dedup, HF adapter, state machine, triage sort |
| Schemas | `src/backend_python/app/schemas.py` (Ticket section) | Pydantic v2 validators incl. `sanitize_html` |
| Storage | Module-level in-memory dicts inside `tickets_service.py` | `tickets: list[Ticket]`, `submission_hashes: dict[str, float]` — documented limitation; production swap would be Redis |
| External | HuggingFace `distilbert-base-uncased-finetuned-sst-2-english` | Optional sentiment input; fail-closed to `MEDIUM` |

### 4.2 Cross-slice contracts honoured

- **Auth (Member D):** Bearer-JWT verification via
  `app.dependencies.get_current_user` + role gate via `require_agent`. No
  header-injected mock remains anywhere in the slice.
- **Roles (Member D):** Customer / Agent / Admin enum from
  `app/models.py::Role`. Triage endpoints accept `agent` or `admin`.
- **CORS / middleware (Member D):** Slice inherits the application-wide
  `PromptInjectionGuard` and PII `RedactionFilter`. No bespoke middleware is
  added in the tickets slice.

### 4.3 Vertical slice demo path (manual)

```bash
# 1. Boot the FastAPI core
cd src/backend_python
uvicorn app.main:app --reload --port 8000

# 2. Mint a customer JWT via the auth slice
TOKEN=$(curl -s -X POST localhost:8000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@example.com","password":"S3curePass!"}' | jq -r .token)

# 3. File a ticket — note the auto-priority comes back as MEDIUM (HF offline in dev)
curl -X POST localhost:8000/api/v1/tickets \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"subject":"Order missing","body":"My order #12345 never arrived."}'

# 4. List own tickets
curl localhost:8000/api/v1/tickets -H "Authorization: Bearer $TOKEN"

# 5. As an agent, view the triage queue and transition the ticket
AGENT=$(curl -s -X POST localhost:8000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"agent@example.com","password":"agntPass!1"}' | jq -r .token)
curl localhost:8000/api/v1/tickets/triage -H "Authorization: Bearer $AGENT"
```

---

*Disclosure: this Phase 3 implementation document was produced with AI
assistance, but every code path, test name, and file path it references
exists in the repository at the audit date — verified by `pytest --collect-only`
and `git ls-files`.*
