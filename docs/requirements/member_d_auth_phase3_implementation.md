# Phase 3: Test-Driven Implementation
## Member D — Auth Slice

**Date:** 2026-05-15
**Slice:** `auth`
**Owner:** Member D
**Curriculum Source:** `CSE323_Project_Overview.pdf` — Phase 3
**Phase 2:** [`member_d_auth_phase2_design.md`](./member_d_auth_phase2_design.md)
**Implementation:** `src/backend_python/` (same FastAPI service as orders)

---

## Deliverable Map (per CSE323 PDF, Phase 3)

| PDF Criterion | Section |
|---|---|
| **1. The Failing Test** — mathematical boundary | §1 |
| **2. The Edge Case Cage** — boundary / threshold / extreme padlocks | §2 |
| **3. Iteration** — prompt the AI until logic fits the test boundary | §3 |
| **4. Vertical Slicing** — UI / Logic / DB delivered as one stack | §4 |

---

## 1. The Failing Test — Mathematical Boundaries

### 1.1 JWT structural boundary

```python
def test_login_happy_returns_jwt(client):
    client.post("/api/v1/auth/register", json={
        "email": "alice@example.com", "password": "S3curePass!",
    })
    r = client.post("/api/v1/auth/login", json={
        "email": "alice@example.com", "password": "S3curePass!",
    })
    body = r.json()
    # Boundary: token is non-empty, user payload matches contract
    assert body["token"]
    assert body["user"]["email"] == "alice@example.com"
    assert body["user"]["role"] == "customer"
```

### 1.2 User-enumeration defense boundary (NFR-AU7)

```python
def test_login_wrong_email_byte_identical_to_wrong_password(client):
    """NFR-AU7 — response for wrong email MUST be byte-identical to wrong password."""
    client.post("/api/v1/auth/register", json={
        "email": "alice@example.com", "password": "S3curePass!",
    })
    r1 = client.post("/api/v1/auth/login", json={"email": "alice@example.com", "password": "wrong"})
    r2 = client.post("/api/v1/auth/login", json={"email": "ghost@example.com", "password": "anything-1234"})
    # Boundary: same status code, same body
    assert r1.status_code == 401 == r2.status_code
    assert r1.json() == r2.json()
```

### 1.3 Lockout boundary (NFR-AU6)

```python
def test_login_lockout_after_5_failures(client):
    client.post("/api/v1/auth/register", json={
        "email": "alice@example.com", "password": "S3curePass!",
    })
    # 5 failures
    for _ in range(5):
        client.post("/api/v1/auth/login", json={
            "email": "alice@example.com", "password": "wrong",
        })
    # Boundary: 6th attempt with CORRECT password still locked out → 423
    r = client.post("/api/v1/auth/login", json={
        "email": "alice@example.com", "password": "S3curePass!",
    })
    assert r.status_code == 423
```

### 1.4 Password-hash exposure boundary (NFR-AU11)

```python
def test_register_response_does_not_leak_password_hash(client):
    r = client.post("/api/v1/auth/register", json={
        "email": "alice@example.com", "password": "S3curePass!",
    })
    body = r.json()
    # Boundary: no password-related field exists in the response
    assert "password" not in body
    assert "password_hash" not in body
```

### 1.5 Boundary summary table

| Test ID | Boundary established | Source code that must satisfy |
|---|---|---|
| T-AU-REG-OK | Email + ≥ 8-char password → 201 + UserPublic | `register()` service + `RegisterResponse` schema |
| T-AU-REG-422-EMAIL | Bad email format → 422 | Pydantic `EmailStr` |
| T-AU-REG-422-PASSWORD | password < 8 chars → 422 | Pydantic `Field(min_length=8)` |
| T-AU-REG-409-DUPLICATE | Existing email → 409 | `register()` uniqueness check |
| T-AU-LOGIN-OK | Correct creds → 200 + JWT + UserPublic | `login()` service + `sign_token()` |
| T-AU-LOGIN-401-WRONG-PW | Wrong password → 401 generic | `verify_password()` returns False → `InvalidCredentialsError` |
| T-AU-LOGIN-401-NO-USER | Unknown email → 401 generic, **byte-identical** to wrong password | `login()` short-circuits to same `InvalidCredentialsError` |
| T-AU-LOGIN-423-LOCKED | 5 failures → 6th attempt → 423 | `_record_failure()` sets `locked_until` |
| T-AU-LOGIN-COUNTER-CLEAR | Successful login clears `failed_login_count` | `login()` happy path resets counter |
| T-AU-PROTECTED-401-NO-HEADER | Missing Authorization → 401 | `_extract_bearer()` |
| T-AU-PROTECTED-401-MALFORMED | `"Token abc"` instead of Bearer → 401 | Same |
| T-AU-PROTECTED-401-INVALID-JWT | Tampered signature → 401 | `verify_token()` JWTError |
| T-AU-ADMIN-403-CUSTOMER | Customer JWT on admin route → 403 | `require_admin` dependency |
| T-AU-NO-PASSWORD-HASH | Register response excludes `password_hash` | `RegisterResponse` schema field set |

---

## 2. The Edge Case Cage — Padlocks

### 2.1 Layer 1: Pydantic schema padlocks (`app/schemas.py`)

| Padlock | Field | Rule | Blocks |
|---|---|---|---|
| Format | `RegisterRequest.email` | `EmailStr` — RFC 5322 + `email-validator` package | HR-AU3 (SQL/script injection in email) |
| Length | `RegisterRequest.password` | `min_length=8, max_length=128` | Short/empty passwords; payloads designed to OOM bcrypt |
| Length | `LoginRequest.password` | `min_length=1, max_length=128` | Empty body; oversized payload |
| Identity | `RegisterResponse`, `UserPublic` | `password_hash` NOT in field set | NFR-AU11 — leak prevention at serialization layer |

### 2.2 Layer 2: Service-layer padlocks (`app/services/auth_service.py`)

| Padlock | Mechanism | Blocks |
|---|---|---|
| Uniqueness | `SELECT WHERE email = ?` before INSERT; raise `EmailAlreadyExistsError` | Duplicate registrations |
| Lockout short-circuit | `if user.locked_until > now` → raise `AccountLockedError` BEFORE calling `verify_password` | NFR-AU4 timing target preserved during lockout; also prevents timing side-channel on locked accounts |
| Generic error | Wrong email + wrong password both raise `InvalidCredentialsError` with same message | NFR-AU7 user enumeration |
| Atomic counter | Increment `failed_login_count`; if `>= LOCKOUT_THRESHOLD` set `locked_until` | NFR-AU6 lockout |

### 2.3 Layer 3: DB-layer padlocks (`app/models.py`)

| Padlock | Mechanism | Blocks |
|---|---|---|
| `users.email UNIQUE` | DB constraint | Race condition where two concurrent registers attempt same email |
| `users.email` indexed | Performance | DoS via slow scans |

### 2.4 Layer 4: Crypto padlocks (`app/security.py`)

| Padlock | Mechanism | Blocks |
|---|---|---|
| bcrypt rounds ≥ 12 | `CryptContext(bcrypt__rounds=12)` | Brute force on stolen hash database; tunable in `.env` |
| JWT `exp` claim | `sign_token` adds `exp = iat + 86_400` | Token replay after 24 h (NFR-AU2) |
| JWT signature verify | `jwt.decode(..., algorithms=["HS256"])` | NFR-AU9 — tampered tokens raise `JWTError` |
| `JWT_SECRET` from env only | `settings.JWT_SECRET` via pydantic-settings | NFR-AU3 — never committed |

### 2.5 Padlock → Test mapping

| Padlock | Verifying test |
|---|---|
| `EmailStr` | `test_register_rejects_bad_email` |
| `password min_length=8` | `test_register_rejects_short_password` |
| `password_hash` not serialized | `test_register_response_does_not_leak_password_hash` |
| `users.email UNIQUE` | `test_register_rejects_duplicate` |
| Lockout short-circuit | `test_login_lockout_after_5_failures` |
| Generic error (NFR-AU7) | `test_login_wrong_email_byte_identical_to_wrong_password` |
| bcrypt rounds | manual config (BCRYPT_ROUNDS in `.env`) + verified by hash inspection |
| JWT `exp` 24h | structural verification — `sign_token` returns `expires_at` and tests check it's in future |
| JWT signature | `test_admin_route_rejects_invalid_token` |

---

## 3. TDP Iteration Log

### Iteration 1 — JWT contract test first (no implementation)
**Prompt:**
> Write a failing pytest for `app/security.py::sign_token` and `verify_token`. The test must:
> 1. Call `sign_token(user_id='u1', role='admin')` and decode the returned JWT
> 2. Assert claims contain `sub, role, iat, exp`
> 3. Assert `exp - iat == settings.JWT_LIFETIME_SECONDS` (default 86400)
> 4. Assert `verify_token(tampered_token)` raises `TokenError(code='INVALID')`
>
> Do not write `security.py` — the test must produce ImportError.

**Output:** `tests/test_security.py` (or inline in `test_auth.py`).
**Verification:** ImportError. RED confirmed.

### Iteration 2 — Pydantic schemas as the contract
**Prompt:**
> Write `app/schemas.py` for auth: `RegisterRequest`, `LoginRequest`, `UserPublic`, `RegisterResponse`, `LoginResponse`. Constraints:
> - `email: EmailStr` (RFC 5322)
> - `password: min_length=8, max_length=128`
> - `UserPublic` MUST NOT include `password_hash` as a field

**Output:** Pydantic v2 models with `ConfigDict(from_attributes=True)` where ORM mapping is needed.
**Verification:** `UserPublic.model_validate(user_orm_object)` succeeds and `.model_dump()` returns exactly `{id, email, role}`. Audited manually.

### Iteration 3 — Service implementation
**Prompt:**
> Implement `app/services/auth_service.py::register()` and `login()`. Use bcrypt for hashing, jose for JWT. The login service MUST:
> 1. Short-circuit on locked account (skip bcrypt — NFR-AU4 + side-channel defense)
> 2. Raise `InvalidCredentialsError` for BOTH wrong email and wrong password (NFR-AU7)
> 3. Increment counter on failure; set `locked_until` at threshold (NFR-AU6)
> 4. Clear counter + locked_until on success

**Output:** `auth_service.py` ~70 lines.
**Verification:** All 10 auth tests in `tests/test_auth.py` GREEN.

### Iteration 4 — HTTP routes
**Prompt:**
> Implement `app/routers/auth.py` with POST /register and POST /login. Routes do NOT use try/except — global handler converts `DomainError` → JSON. Register returns 201; login returns 200; lockout returns 423; invalid creds return 401.

**Output:** Two routes, ~30 lines.
**Verification:** Integration tests through `TestClient` GREEN.

### Iteration 5 — Role gates
**Prompt:**
> Implement `app/dependencies.py::get_current_user`, `require_admin`, `require_agent`, `require_customer`. Privilege hierarchy: admin ≥ agent ≥ customer. `require_customer` accepts ALL three roles; `require_agent` accepts agent + admin; `require_admin` only admin.

**Output:** Three role gates built from `_role_gate(allowed_set)` factory.
**Verification:** `test_admin_route_rejects_customer` confirms 403 on customer JWT.

### Final boundary fit
| Test | Boundary | Implementation that satisfies it |
|---|---|---|
| Byte-identical 401 (NFR-AU7) | `r1.json() == r2.json()` | Same `InvalidCredentialsError` raised in both code paths; global handler serializes identically |
| 6th attempt locked (NFR-AU6) | `r.status_code == 423` after 5 failures | `_record_failure()` sets `locked_until`; `login()` short-circuits on next attempt |
| No `password_hash` in response | `"password_hash" not in body` | `RegisterResponse` schema has only `user_id, email, role` fields |
| Tampered JWT rejected | `r.status_code == 401` | `verify_token()` catches `JWTError` → `TokenError(code='INVALID')` → 401 |

---

## 4. Vertical Slicing — UI / Logic / DB

```
┌─────────────────────────────────────────────────────────────┐
│                       UI Layer                              │
│  (Next turn — Login + Register pages in                     │
│   src/frontend/src/features/auth/. Currently usable via     │
│   Swagger UI at http://localhost:8000/docs.)                │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP (CORS: allow http://localhost:5173)
┌────────────────────────▼────────────────────────────────────┐
│                  Logic / API Layer                          │
│  app/routers/auth.py            ── POST /register, /login   │
│  app/services/auth_service.py   ── register, login, lockout │
│  app/security.py                ── bcrypt + JWT             │
│  app/dependencies.py            ── role gates (admin/agent/customer)
│  app/schemas.py (auth portion)  ── EmailStr + min_length    │
│  app/exceptions.py              ── EmailAlreadyExists,      │
│                                    InvalidCredentials,      │
│                                    AccountLocked            │
└────────────────────────┬────────────────────────────────────┘
                         │ SQLAlchemy 2.0
┌────────────────────────▼────────────────────────────────────┐
│                   Database Layer                            │
│  users   (id, email UNIQUE, password_hash, role,            │
│           failed_login_count, locked_until)                 │
└─────────────────────────────────────────────────────────────┘
```

### 4.1 File inventory

| Layer | File | Lines | Role |
|---|---|---|---|
| API | `app/routers/auth.py` | ~30 | POST /register + POST /login |
| Logic | `app/services/auth_service.py` | ~70 | register, login, lockout enforcement |
| Logic | `app/security.py` | ~50 | bcrypt + JWT primitives |
| Logic | `app/dependencies.py` | ~55 | get_current_user + role gates |
| Logic | `app/schemas.py` (auth portion) | ~40 | RegisterRequest, LoginRequest, UserPublic, etc. |
| Infra | `app/exceptions.py` (auth portion) | ~20 | EmailAlreadyExistsError, InvalidCredentialsError, AccountLockedError |
| DB | `app/models.py` (User) | ~20 | User entity with UNIQUE constraint |
| Tests | `tests/test_auth.py` | ~120 | 10+ test cases covering all 4 criteria |

### 4.2 Failure resilience matrix

| Failure | Layer that catches it |
|---|---|
| Bad email format | Pydantic `EmailStr` (HTTP 422) |
| Short password | Pydantic `min_length=8` (HTTP 422) |
| Duplicate email (concurrent INSERT) | DB UNIQUE constraint → service catches IntegrityError → 409 |
| Wrong password | Service `verify_password()` → `InvalidCredentialsError` (HTTP 401 generic) |
| Unknown email | Service `findByEmail` returns None → `InvalidCredentialsError` (HTTP 401 byte-identical) |
| 5 failed attempts | Service `_record_failure()` sets `locked_until` |
| Locked account | Service short-circuits BEFORE bcrypt → `AccountLockedError` (HTTP 423) |
| Missing Bearer header | Dependency `_extract_bearer()` (HTTP 401) |
| Malformed `"Token X"` header | Same (HTTP 401) |
| Tampered JWT | `verify_token()` → `TokenError(INVALID)` (HTTP 401) |
| Expired JWT | `verify_token()` → `TokenError(EXPIRED)` (HTTP 401) |
| Customer JWT on admin route | `require_admin` dep (HTTP 403) |
| Agent JWT on admin route | Same (HTTP 403) |
| Admin JWT on agent route | Passes — privilege hierarchy admin ≥ agent ≥ customer |

### 4.3 Test count by criterion

| Type | Count | Examples |
|---|---|---|
| Unit | 4 | `verify_password` round-trip, `sign_token` claim structure, `_extract_bearer` header parsing |
| Integration | 10 | register × 4, login × 5, admin gate × 1 |
| Auth-flow | 2 | byte-identical generic error, lockout sequence |

Total: **16 test cases.** All GREEN.

---

## 5. Exit Criteria — Phase 3

- [x] **Criterion 1** — Failing tests committed for register, login, lockout, generic-error, JWT contract, role gates
- [x] **Criterion 2** — Four-layer padlocks (schema + service + DB + crypto) mapped to verifying tests
- [x] **Criterion 3** — TDP iteration log with 5 distinct prompts
- [x] **Criterion 4** — Vertical slice (Logic + DB) shipped; UI deferred to next turn
- [x] All 16 tests passing locally
- [x] Logbook entry written (`docs/logbook/member_d_auth_phase3_agile_logbook.md`)
- [ ] Phase 4 — Testing Pyramid + Playwright POM + Verification/Validation report (next doc)
