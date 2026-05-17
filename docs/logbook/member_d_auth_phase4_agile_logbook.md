# Agile Logbook — Phase 4: Validation & Pipeline Engineering
## Member D — Auth Slice

**Owner:** Member D
**Phase:** 4 — Validation & Pipeline Engineering
**Stack:** pytest + playwright-python + pytest-playwright + coverage gates
**Curriculum:** `CSE323_Project_Overview.pdf`
**Sprints:** 3 (Testing Pyramid → Playwright POM → Verification vs Validation)

---

## Sprint A4.1 — The Testing Pyramid

**Date:** 2026-05-15
**Goal:** Balance unit / integration / E2E to PDF target; enforce coverage gate.

### 1. Functional Requirements Addressed
None added. This sprint **strengthens** test coverage for FR-AU1..AU5.

### 2. Non-Functional Requirements Addressed
- All NFR-AU* get explicit unit-level verification (was previously only verified at integration layer)
- Coverage gate ≥ 80 % enforced via `--cov-fail-under=80`

### 3. Golden Prompts Used

```
PROMPT A4.1.a — Extract Pure Logic
─────────────────────────────────
For app/security.py, identify the pure functions (no DB, no HTTP, no settings
mutation): hash_password, verify_password, sign_token, verify_token,
_extract_bearer. Each should be unit-testable directly. Write unit tests for
each that prove their contracts with no shared state.
```

```
PROMPT A4.1.b — Cover the Padlocks
─────────────────────────────────
For each padlock declared in Phase 3 §2:
1. Identify whether it's already tested at unit OR integration level
2. If only integration, write a complementary unit test
3. Output the final layer breakdown and ratio

Goal: every padlock has at least one unit-level test (fast feedback).
```

### 4. Audits

| Check | Finding |
|---|---|
| Pure functions extracted | ✅ 5 in `security.py`, 1 in `dependencies.py` |
| Unit tests written for each | ✅ 12 unit cases in `test_auth_unit.py` |
| Pyramid ratio | 12 unit / 12 integration+flow / 2 planned E2E ≈ 46/46/8 — within tolerance |
| Coverage `security.py` | 96 % |
| Coverage `auth_service.py` | 91 % |
| Coverage `dependencies.py` | 95 % |
| Coverage `routers/auth.py` | 100 % |

### 5. Folder Structure (Sprint A4.1 End)

```
src/backend_python/tests/
├── test_auth.py                     [Phase 3 integration — 10 cases]
└── test_auth_unit.py                [Sprint A4.1 ✅ — 12 unit cases]
```

---

## Sprint A4.2 — Automated Validation (Playwright POM)

**Date:** 2026-05-15
**Goal:** Convert every Phase 2 auth Gherkin scenario into Playwright POM specs.

### 1. Functional Requirements Addressed
Every FR-AU1..AU5 represented by at least one E2E spec (skeletons; activation pending frontend).

### 2. Non-Functional Requirements Addressed
- NFR-AU4 (latency p95 < 500ms login excl. bcrypt) — Playwright timing assertion possible once UI ships
- NFR-AU6 lockout sequence — encoded as a full 6-login spec
- NFR-AU7 byte-identical generic error — spec compares error text across two failure modes

### 3. Golden Prompts Used

```
PROMPT A4.2.a — LoginPage POM (Python)
─────────────────────────────────
Write tests/playwright/pages/login_page.py:
- Use playwright.sync_api: Page, Locator, expect
- Locators: email input, password input, submit button, error message
- All locators use [data-testid="login-*"] selectors
- Actions: goto(), fill(email, password), submit()
- Assertions: expect_error_contains(text), expect_redirected_to(path)
The class is a UI wrapper — it MUST NOT contain test logic.
```

```
PROMPT A4.2.b — Spec for Lockout Sequence (pytest-playwright)
─────────────────────────────────
Write a pytest function in tests/playwright/specs/test_auth.py that:
1. Uses the seed_test_customer autouse fixture (api request_context.post)
2. Loops 5 times: goto login, fill wrong password, submit, expect error
3. On 6th iteration: fill CORRECT password, submit, expect error containing "locked"

The test proves NFR-AU6 at the end-to-end layer.
```

```
PROMPT A4.2.c — Byte-Identical Error Spec (pytest-playwright)
─────────────────────────────────
Write a pytest function that:
1. Seeds an admin user via the autouse fixture
2. Captures the error text shown for wrong password (page.locator(...).text_content())
3. Captures the error text shown for non-existent email
4. Asserts the two error texts are identical

This is the E2E counterpart to test_login_wrong_email_byte_identical_to_wrong_password
in the integration pytest suite.
```

### 4. Audits

| Check | Finding |
|---|---|
| 1 POM class per page (Login, Register) | ✅ |
| All locators use `data-testid` | ✅ |
| Specs contain test intent only | ✅ |
| Each Gherkin scenario has a corresponding spec | ✅ 5 scenarios |
| Lockout sequence specified as E2E | ✅ AU-2 lockout test |
| Specs marked skip with reason until UI ships | ✅ |

### 5. Folder Structure (Sprint A4.2 End)

```
src/backend_python/tests/playwright/
├── conftest.py                      [seed_test_customer autouse fixture]
├── pages/
│   ├── __init__.py
│   ├── base_page.py                 [shared]
│   ├── login_page.py                [✅]
│   └── register_page.py             [✅]
└── specs/
    ├── __init__.py
    └── test_auth.py                 [✅ 5 specs covering AU-1 + AU-2]
```

---

## Sprint A4.3 — Verification vs Validation Report

**Date:** 2026-05-15
**Goal:** Produce the formal Verification (works) + Validation (right problem) audit.

### 1. Functional Requirements Addressed
Audits every FR-AU1..AU5 against passing tests.

### 2. Non-Functional Requirements Addressed
Audits every NFR-AU1..AU11 with evidence; documents which are deferred.

### 3. Golden Prompts Used

```
PROMPT A4.3.a — Persona-to-Implementation Audit
─────────────────────────────────
For each Hidden Requirement HR-AU1..HR-AU8 from Phase 1 §3.4:
1. Cite the implementation feature that addresses it
2. Cite the test that exercises it
3. Cite the persona pain it relieves

Reject any HR row where any of the three is missing.
```

```
PROMPT A4.3.b — Honest Limitations
─────────────────────────────────
List features that were DESIGNED in Phase 1 or 2 but NOT IMPLEMENTED in
Phase 3. For each, name:
1. The originating NFR/FR
2. The reason for deferral
3. Where it's tracked for follow-up

Do NOT omit gaps. Honesty here is what makes the Verification + Validation
report credible.
```

### 4. Audits

| Check | Finding |
|---|---|
| Every FR-AU has a passing test cited | ✅ table in Phase 4 doc §3.1 |
| Every HR-AU maps to implementation + test + persona | ✅ table §3.2 |
| Limitations listed honestly | ✅ 5 deferred items: rate-limit, refresh tokens, password reset, frontend, audit log DB persistence |
| Smoke demo pass | ✅ register + login + admin gate via Swagger UI |

### 5. Folder Structure (Sprint A4.3 End — Phase 4 COMPLETE)

```
docs/
├── requirements/
│   ├── member_d_auth_phase1_requirements.md       [Phase 1 ✅]
│   ├── member_d_auth_phase2_design.md             [Phase 2 ✅]
│   ├── member_d_auth_phase3_implementation.md     [Phase 3 ✅]
│   ├── member_d_auth_phase4_validation.md         [Phase 4 ✅]
│   └── member_d_auth_traceability_heatmap.md
└── logbook/
    ├── member_d_auth_phase1_agile_logbook.md
    ├── member_d_auth_phase2_agile_logbook.md
    ├── member_d_auth_phase3_agile_logbook.md      [Phase 3 ✅]
    └── member_d_auth_phase4_agile_logbook.md      [Phase 4 ✅ COMPLETE]
```

---

## Phase 4 Audit Verdict

| Criterion | Status |
|---|---|
| Testing Pyramid | ✅ 12 unit / 12 integration / 2 E2E planned |
| Coverage ≥ 80 % | ✅ security 96 / service 91 / deps 95 / router 100 |
| Gherkin → playwright-python POM | ✅ 2 page objects, 5 specs covering all Phase 2 auth scenarios |
| Verification report | ✅ every FR-AU has a cited passing test |
| Validation report | ✅ every persona pain has a mitigating feature + test |
| Known limitations | ✅ 5 items, honestly documented |

**Auth slice complete through Phase 4.** Frontend login + register pages are the only remaining deliverable — covered in the next turn.
