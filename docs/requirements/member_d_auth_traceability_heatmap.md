# Traceability Heatmap — Auth Slice (Member D)

**Date:** 2026-05-13
**Slice:** `auth`
**Owner:** Member D
**Companion to:** [`member_d_auth_phase1_requirements.md`](./member_d_auth_phase1_requirements.md)
**Purpose:** Mathematically prove every auth requirement maps backward to a Business Goal and forward to a Test, with **zero orphans**.

---

## Legend

| Symbol | Meaning |
|---|---|
| ✅ | Trace exists and is verifiable |
| 🟡 | Designed; test pending Phase 3 |
| ❌ | **ORPHAN** — missing trace |
| 🔗 | Cross-slice consumer (downstream slice depends on this) |

---

## 1. Master Heatmap (Backward Trace: Test ← Feature ← FR ← BG)

| BG | Business Goal | FR | NFR(s) | Feature / Endpoint | Persona HR | Test IDs | Status |
|---|---|---|---|---|---|---|---|
| **BG-AU1** | Identity verification | FR-AU1 | NFR-AU1, NFR-AU4, NFR-AU5 | `POST /auth/register` | — | T-AU1.1 — T-AU1.3 | 🟡 |
| **BG-AU1** | — | FR-AU1.b | NFR-AU5 | Input validation (Zod email + password ≥ 8) | HR-AU3 | T-AU1.4 — T-AU1.5 | 🟡 |
| **BG-AU1** | — | FR-AU1.c | NFR-AU8 | Registration rate-limit | HR-AU4 | T-AU1.6 | 🟡 |
| **BG-AU1** | — | FR-AU2 | NFR-AU1, NFR-AU4, NFR-AU5, NFR-AU7 | `POST /auth/login` | — | T-AU2.1 — T-AU2.3 | 🟡 |
| **BG-AU1** | — | FR-AU2.b | — | Response exposes `expiresAt` | HR-AU8 | T-AU2.4 | 🟡 |
| **BG-AU2** | Role-based authorization | FR-AU3 | NFR-AU9, NFR-AU10 | `protectRoute` middleware | HR-AU5, HR-AU6 | T-AU3.1 — T-AU3.4 | 🟡 |
| **BG-AU2** | — | FR-AU4 | NFR-AU11 | `roleGuard(role)` middleware factory + `adminGuard`/`agentGuard`/`customerGuard` exports | — | T-AU4.1 — T-AU4.3 | 🟡 |
| **BG-AU2** | — | FR-AU5 | NFR-AU2, NFR-AU3 | JWT structure `{ sub, role, exp, iat }`, HMAC-SHA256 | — | T-AU5.1 — T-AU5.2 | 🟡 |
| **BG-AU3** | Abuse resistance | (NFR-AU6 enforces FR-AU2) | NFR-AU6 | Lockout after 5 failed logins, 15-min cooldown | HR-AU1 | T-AU2.5 — T-AU2.6 | 🟡 |
| **BG-AU3** | — | (NFR-AU7 modifies FR-AU2 errors) | NFR-AU7 | Generic "Invalid credentials" error (no user enum) | HR-AU2 | T-AU2.7 | 🟡 |
| **BG-AU3** | — | (NFR-AU11 modifies all responses) | NFR-AU11 | `passwordHash` never exposed | HR-AU7 | T-AU1.7, T-AU2.8 | 🟡 |

---

## 2. Forward Trace (BG → FR → Feature)

```
BG-AU1 (Identity verification)
  ├─ FR-AU1   ─▶ POST /auth/register
  ├─ FR-AU1.b ─▶ POST /auth/register (input validation guard)
  ├─ FR-AU1.c ─▶ POST /auth/register (rate-limit guard)
  ├─ FR-AU2   ─▶ POST /auth/login
  └─ FR-AU2.b ─▶ POST /auth/login (response shape exposes expiresAt)

BG-AU2 (Role-based authorization)
  ├─ FR-AU3 ─▶ protectRoute middleware                   🔗 consumed by A, B, C, D
  ├─ FR-AU4 ─▶ roleGuard(role) middleware                🔗 consumed by B, C, D
  │             ├─ adminGuard                            🔗 D (orders)
  │             ├─ agentGuard                            🔗 C (tickets queue)
  │             └─ customerGuard                         🔗 B (payment), C (ticket create)
  └─ FR-AU5 ─▶ JWT signing/verification                  🔗 token consumed by all

BG-AU3 (Abuse resistance) — enforced by NFRs, no separate FRs
  ├─ NFR-AU6 ─▶ Login lockout
  ├─ NFR-AU7 ─▶ Generic-error login failures
  └─ NFR-AU8 ─▶ Registration rate-limit
```

---

## 3. NFR Coverage Cross-Tab

| NFR | Covered By | Test Method |
|---|---|---|
| **NFR-AU1** bcrypt cost ≥ 10 | `bcrypt.hash(password, 10)` in registration service | Unit test on hash function output cost factor parse |
| **NFR-AU2** JWT lifetime = 24h | `jwt.sign(payload, secret, { expiresIn: '24h' })` | Unit test on decoded `exp - iat === 86400` |
| **NFR-AU3** JWT_SECRET env-var | `process.env.JWT_SECRET ?? throw` | Unit test asserting throw when env var absent |
| **NFR-AU4** Login p95 < 500ms | Supertest timing assertion (excluding bcrypt) | Integration with timing harness |
| **NFR-AU5** Audit logging | `auditLog.write({ ... })` calls in register + login services | Unit test on audit log contents per scenario |
| **NFR-AU6** Lockout (5 fails / 15 min) | Service-layer counter + `lockedUntil` check | Integration: 5 wrong attempts → 6th returns 423 (locked) |
| **NFR-AU7** Generic error | Login service returns same error for wrong-email vs wrong-password | Unit: assert identical error body for both failure modes |
| **NFR-AU8** Reg rate-limit (5/IP/hr) | Per-IP counter in service or middleware | Integration: 6 registrations from one IP → 6th returns 429 |
| **NFR-AU9** JWT signature verified | `jwt.verify()` in `protectRoute` middleware | Unit: tampered payload → 401 |
| **NFR-AU10** JWT expiry verified | Same `jwt.verify()` — throws `TokenExpiredError` | Unit: token with `exp` in past → 401 |
| **NFR-AU11** `passwordHash` never exposed | Service-layer response builder explicitly omits | Unit: register response and login response do not contain `passwordHash` key |

---

## 4. Persona Hidden Requirement Traceability

| HR | Persona | Escalates To | Tested By |
|---|---|---|---|
| HR-AU1 | Forgetful | NFR-AU6 | T-AU2.5, T-AU2.6 |
| HR-AU2 | Brute-Force | NFR-AU7 | T-AU2.7 |
| HR-AU3 | Brute-Force | FR-AU1.b | T-AU1.4, T-AU1.5 |
| HR-AU4 | Brute-Force | FR-AU1.c + NFR-AU8 | T-AU1.6 |
| HR-AU5 | Token Thief | NFR-AU9 | T-AU3.3 (tampered JWT → 401) |
| HR-AU6 | Token Thief | NFR-AU10 | T-AU3.4 (expired JWT → 401) |
| HR-AU7 | Token Thief | NFR-AU11 | T-AU1.7 (register response) + T-AU2.8 (login response) |
| HR-AU8 | Forgetful | FR-AU2.b | T-AU2.4 |

---

## 5. Orphan Audit

| Check | Result |
|---|---|
| Every FR has ≥1 Feature/Endpoint | ✅ |
| Every Feature has ≥1 Test | ✅ (all 🟡 — designed, pending Phase 3) |
| Every NFR has ≥1 Verifying Test | ✅ |
| Every Persona HR escalates to FR/NFR | ✅ |
| Every BG has ≥1 FR or NFR | ✅ |
| **Total Orphans** | **0** |

---

## 6. Downstream Cross-Slice Trace

Auth is uniquely a **producer** slice — every other slice consumes it. The reverse trace below proves that every other slice's auth-related requirement maps to something this slice produces.

| Consumer Slice | What They Depend On | This Slice Provides It In |
|---|---|---|
| **Member A (checkout)** | Optional JWT validation on cart/checkout endpoints | FR-AU3 (`protectRoute` configured for optional mode) |
| **Member B (payment)** | `POST /api/payment/process` requires `customer` JWT | FR-AU4 (`customerGuard` middleware) |
| **Member C (tickets — customer endpoints)** | `POST /api/v1/tickets` requires `customer` JWT | FR-AU4 (`customerGuard`) |
| **Member C (tickets — agent endpoints)** | `GET /tickets/queue`, `PATCH .../status` require `agent` JWT | FR-AU4 (`agentGuard`) |
| **Member D (orders — own slice)** | All admin endpoints require `admin` JWT | FR-AU4 (`adminGuard`) |
| **Member C's OpenAPI YAML L10–L12, L38** | Awaits "PENDING confirmation from Member D regarding JWT claim structure" | FR-AU5 (locks the `{ sub, role, exp, iat }` structure publicly) |

**Reverse-orphan check:** every downstream auth dependency listed above is fulfilled by an FR in this slice. **0 reverse orphans.**

---

## 7. Open Issues / Cross-Slice Coordination

| Issue | Status |
|---|---|
| CONTEXT.md slice-status row for `auth` currently shows Member B | To be corrected in this commit |
| Member B's `Phase3_04_vertical_slicing.md` L77, L114 reference *"Member D's protectRoute"* — now accurate but was previously incorrect attribution | Will become correct once auth ships |
| Member C's `02f_API_CONTRACT.yaml` L10–L12 still says *"PENDING Member D"* — same as above | Same |
| Member B's CONTEXT.md L184 says "Session Expiry: 24 hours (Inherited from Auth slice)" | Inheritance now confirmed — auth slice locks 24h as NFR-AU2 |
