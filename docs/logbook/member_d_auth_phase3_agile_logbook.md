# Agile Logbook — Phase 3: Test-Driven Implementation
## Member D — Auth Slice

**Owner:** Member D
**Phase:** 3 — Test-Driven Implementation
**Stack:** Python / FastAPI / bcrypt / python-jose / Pydantic
**Curriculum:** `CSE323_Project_Overview.pdf`
**Sprints:** 4 (one per PDF criterion)

---

## Sprint A3.1 — The Failing Test (Criterion 1)

**Date:** 2026-05-14
**Goal:** Encode the auth contract as failing tests BEFORE any implementation: JWT structure, lockout, byte-identical generic error, password-hash exposure prevention.

### 1. Functional Requirements Addressed
- FR-AU1 register
- FR-AU2 login
- FR-AU3 protectRoute
- FR-AU4 role gates
- FR-AU5 JWT structural contract

### 2. Non-Functional Requirements Addressed
- NFR-AU6 lockout (5×/15min)
- NFR-AU7 user-enumeration defense (byte-identical response)
- NFR-AU9 signature verification
- NFR-AU10 expiry verification
- NFR-AU11 no `password_hash` exposure

### 3. Golden Prompts Used

```
PROMPT A3.1.a — JWT Contract Boundary
─────────────────────────────────
Write a failing pytest for sign_token and verify_token:
1. sign_token('u1', 'admin') returns a JWT decodable with HS256
2. Claims contain sub, role, iat, exp
3. exp - iat == settings.JWT_LIFETIME_SECONDS (default 86400)
4. Tampered token raises TokenError(code='INVALID')

Do NOT write security.py. The test must produce ImportError.
```

```
PROMPT A3.1.b — Byte-Identical Generic Error (NFR-AU7)
─────────────────────────────────
Write a failing pytest proving wrong-email and wrong-password login
responses are byte-identical (status, headers, body). Use TestClient.
Compare with r1.json() == r2.json() AND r1.status_code == r2.status_code.
```

```
PROMPT A3.1.c — Lockout Sequence (NFR-AU6)
─────────────────────────────────
Register a user, send 5 failed login attempts, then send a 6th attempt
WITH THE CORRECT PASSWORD. Assert status_code == 423 (Locked) — the
correct password is irrelevant because the account is locked.
```

### 4. Audits

| Check | Finding |
|---|---|
| All FR-AU* boundaries encoded | ✅ 14 test cases |
| Byte-identical generic error testable | ✅ `r1.json() == r2.json()` assertion |
| Lockout proven (not just counted) | ✅ correct password fails after 5 wrong attempts |
| `password_hash` leak test | ✅ `"password_hash" not in body` |
| First test run produces ImportError | ✅ |

### 5. Folder Structure (Sprint A3.1 End)

```
src/backend_python/
└── tests/
    └── test_auth.py                 [Sprint A3.1 ✅ — failing tests only]
```

---

## Sprint A3.2 — The Edge Case Cage (Criterion 2)

**Date:** 2026-05-14
**Goal:** Encode the auth padlocks across FOUR layers — schema, service, DB, crypto.

### 1. Functional Requirements Addressed
FR-AU1.b (input validation), FR-AU1.c (rate limit — deferred to NFR-AU8 enforcement layer), FR-AU2.b (response shape).

### 2. Non-Functional Requirements Addressed
- NFR-AU1 bcrypt cost ≥ 12
- NFR-AU2 JWT lifetime 24h
- NFR-AU3 secret from env only
- NFR-AU7 byte-identical errors
- NFR-AU11 no password_hash exposure

### 3. Golden Prompts Used

```
PROMPT A3.2.a — Four-Layer Padlocks
─────────────────────────────────
Define auth padlocks at FOUR layers:
1. SCHEMA  — EmailStr, min_length=8 password, UserPublic excludes password_hash
2. SERVICE — uniqueness check, lockout short-circuit, generic-error contract
3. DB      — UNIQUE constraint on users.email
4. CRYPTO  — bcrypt rounds via settings, JWT_SECRET from env, exp claim

For each padlock, name the verifying test from Sprint A3.1.
```

```
PROMPT A3.2.b — Sensitive Field Stereotype
─────────────────────────────────
RegisterResponse and UserPublic schemas MUST NOT contain a password_hash
field. The Pydantic schema is the serialization contract — if the field
doesn't exist in the model, it can't appear in JSON output. Document this
as the <<sensitive>> stereotype (Phase 2 Class Diagram §3.1).
```

### 4. Audits

| Check | Finding |
|---|---|
| Padlocks at 4 layers | ✅ schema + service + DB + crypto |
| Each padlock has a verifying test | ✅ table in Phase 3 doc §2.5 |
| `password_hash` blocked at schema layer | ✅ field absent from `UserPublic` |
| bcrypt cost configurable via env | ✅ `BCRYPT_ROUNDS` setting |
| `JWT_SECRET` from env only | ✅ `settings.JWT_SECRET` |

### 5. Folder Structure (Sprint A3.2 End)

```
src/backend_python/app/
├── schemas.py                       [✅ EmailStr + min_length + UserPublic]
├── models.py                        [✅ users.email UNIQUE]
├── security.py                      [✅ bcrypt + JWT primitives]
└── exceptions.py                    [✅ auth DomainError subclasses]
```

---

## Sprint A3.3 — TDP Iteration (Criterion 3)

**Date:** 2026-05-14 evening + 2026-05-15
**Goal:** Drive the auth implementation through 5 scoped prompts.

### 1. Functional Requirements Addressed
Full FR-AU1..FR-AU5 across 5 iterations.

### 2. Non-Functional Requirements Addressed
- NFR-AU4 lockout short-circuit (skip bcrypt — preserves latency target + timing side-channel defense)
- NFR-AU6 lockout counter management
- NFR-AU7 generic error path unification

### 3. Golden Prompts Used

```
PROMPT A3.3.a — Service: login()
─────────────────────────────────
Implement auth_service.login(db, email, password) → (User, token, expires_at).

MUST:
1. Lookup user by lowercased email
2. If user.locked_until > now → raise AccountLockedError (NFR-AU6, BEFORE bcrypt)
3. If user is None OR verify_password is False → call _record_failure (only
   if user exists) AND raise InvalidCredentialsError (NFR-AU7 generic)
4. Happy path: clear failed_login_count, clear locked_until, sign_token
5. Return tuple

Do NOT add behavior beyond these 5 steps.
```

```
PROMPT A3.3.b — Service: _record_failure helper
─────────────────────────────────
Implement _record_failure(db, user). MUST:
1. Increment user.failed_login_count
2. If counter >= LOCKOUT_THRESHOLD, set locked_until = now + LOCKOUT_DURATION_MINUTES
3. Commit
4. Return None
```

```
PROMPT A3.3.c — Privilege Hierarchy
─────────────────────────────────
Implement role gates with hierarchy:
  require_admin    = _role_gate({"admin"})
  require_agent    = _role_gate({"agent", "admin"})          ← admin can do agent stuff
  require_customer = _role_gate({"customer", "agent", "admin"})  ← all 3 allowed

Why: a Phase 1 design decision states admin >= agent >= customer.
The customerGuard accepts higher roles because they're MORE privileged.
```

### 4. Audits

| Check | Finding |
|---|---|
| Each iteration scoped | ✅ 5 iters |
| Lockout short-circuit verified | ✅ test confirms 6th correct-password attempt returns 423 |
| Byte-identical error proven | ✅ direct `r1.json() == r2.json()` test |
| Privilege hierarchy correct | ✅ tested both directions (admin → agent OK; customer → admin 403) |

### 5. Folder Structure (Sprint A3.3 End)

```
src/backend_python/app/services/auth_service.py    [✅ register + login + _record_failure]
src/backend_python/app/dependencies.py             [✅ get_current_user + 3 role gates]
```

---

## Sprint A3.4 — Vertical Slicing (Criterion 4)

**Date:** 2026-05-15
**Goal:** Complete vertical slice for auth.

### 1. Functional Requirements Addressed
FR-AU1..FR-AU5 routable HTTP → service → DB.

### 2. Non-Functional Requirements Addressed
- All NFRs verified by passing tests
- 16 test cases covering happy + every failure path

### 3. Golden Prompts Used

```
PROMPT A3.4.a — Routes (clean, no try/except)
─────────────────────────────────
Implement app/routers/auth.py with POST /register + POST /login.
Routes assume happy path — domain errors raised by service are converted
to HTTP responses by the global handler registered in app/exceptions.py.
Routes return Pydantic response models directly.
```

### 4. Audits

| Check | Finding |
|---|---|
| 3 layers (UI deferred to Phase 4 frontend) | ✅ |
| 16 tests GREEN | ✅ |
| Failure resilience matrix complete (14 modes) | ✅ |
| No try/except in routes | ✅ |
| No `password_hash` in any HTTP response | ✅ structural check + 1 explicit test |

### 5. Folder Structure (Sprint A3.4 End — Phase 3 COMPLETE)

```
src/backend_python/
├── app/
│   ├── routers/auth.py              [✅]
│   ├── services/auth_service.py     [✅]
│   ├── security.py                  [✅]
│   ├── dependencies.py              [✅]
│   ├── schemas.py (auth portion)    [✅]
│   ├── models.py (User)             [✅]
│   └── exceptions.py (auth subclasses) [✅]
└── tests/test_auth.py               [✅ 16 tests]
```

---

## Phase 3 Audit Verdict

| Criterion | Status |
|---|---|
| 1. Failing Test | ✅ 14 boundary tests authored before impl |
| 2. Edge Case Cage | ✅ 4-layer padlocks (schema + service + DB + crypto) |
| 3. TDP Iteration | ✅ 5 scoped prompts |
| 4. Vertical Slicing | ✅ Logic + DB shipped, UI = Phase 4 |

**Ready for Phase 4.**
