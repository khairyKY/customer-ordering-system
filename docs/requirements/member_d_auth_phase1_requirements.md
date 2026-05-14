# Phase 1: Requirement Discovery & Traceability
## Member D — Auth & User Management (Slice 2)

**Date:** 2026-05-13
**Slice:** `auth`
**Owner:** Member D (second slice — alongside `orders`)
**Curriculum Source:** `CSE323_Project_Overview.pdf` — Phase 1
**Companion file:** [`member_d_auth_traceability_heatmap.md`](./member_d_auth_traceability_heatmap.md)

> **Ownership note:** Earlier in the project the auth slice was tentatively listed under Member B's name in `.ai/CONTEXT.md`. Member B's actual published work covers payment only. Following team coordination (see combined-phase docs §"Open Team-Coordination Issues" C-1), **Member D now owns auth in addition to orders.** This Phase 1 doc establishes that ownership and the JWT contract that every other slice already depends on.

---

## Deliverable Map (per CSE323 PDF, Phase 1)

| PDF Requirement | Section |
|---|---|
| Actor Classification (Primary / Supporting / Offstage) | §1 |
| Traceability Heatmap (no orphaned requirements; mathematically justified) | §2 (full matrix in companion file) |
| Persona Discovery (AI User as frustrated/malicious; ≥ 5 hidden requirements) | §3 |

---

## 1. Actor Classification

### 1.1 Primary Actors (Initiating the Use Case)

| Actor | Initiating Action | Goal |
|---|---|---|
| **End User (unauthenticated)** | `POST /auth/register` — sign up with email + password | Obtain a `customer` account |
| **End User (registered)** | `POST /auth/login` — submit credentials | Obtain a JWT to access protected endpoints |

> The same human being is the primary actor for both endpoints, but the use case differs by authentication state. Treating them as two roles of the same person prevents confusing the registration flow with the login flow.

### 1.2 Supporting Actors (Secondary — Assist the Primary)

| Actor | Service Provided | Owner |
|---|---|---|
| **Password Hashing Service (bcrypt)** | Hashes plaintext password with salt; verifies on login | Internal — `bcrypt` Node package |
| **JWT Signing Service** | Signs `{ sub, role, exp, iat }` payload with HMAC-SHA256 + `JWT_SECRET` | Internal — `jsonwebtoken` Node package |
| **User Database** | Persists `users` table (id, email, passwordHash, role, createdAt, updatedAt, failedLoginCount, lockedUntil) | Owned by this slice |
| **System Clock** | Provides `iat` (issued-at) and computes `exp = iat + 24h`; also drives lockout cooldown timing | Node runtime |
| **Rate-Limiter Store** | In-memory or Redis map of `{ ip → registrationsThisHour }` and `{ email → failedAttemptsInWindow }` | Owned by this slice |

### 1.3 Offstage Actors (Affected by Outcome but Not Present)

| Actor | Interest in Outcome |
|---|---|
| **Member A's Checkout slice** | Consumes the JWT to bind a cart to a user account on optional-auth endpoints. Not present during login; downstream consumer of `sub` and `role`. |
| **Member B's Payment slice** | Consumes the JWT on `POST /api/payment/process` via the `protectRoute` middleware this slice provides. Already shipped Phase 3 assuming this contract. |
| **Member C's Tickets slice** | Consumes JWT with `role: "customer"` for ticket creation and `role: "agent"` for triage queue. Their `02f_API_CONTRACT.yaml` explicitly waits on this slice. |
| **Member D's Orders slice (own slice)** | Consumes JWT with `role: "admin"` on every endpoint via `adminGuard` middleware this slice provides. |
| **Security / Audit Team** | Reads the auth event log (login attempts, lockouts, registrations) for compliance and brute-force detection. Never present during login. |
| **Hostile Network / Attackers** | Passive listener and active adversary. The slice exists in significant part to defend against this offstage actor — see Persona B and C below. |

> **Why all four other slices are offstage and not supporting:** during a single login use case, no other slice is invoked. The JWT is *issued* by this slice and *consumed* by them later, in their own use cases. Their interest is real (every protected endpoint depends on this slice), but they are not synchronously present when a user types their password.

---

## 2. Traceability Heatmap (Summary)

Full matrix in [`member_d_auth_traceability_heatmap.md`](./member_d_auth_traceability_heatmap.md).

| Business Goal | FR-IDs Covered | NFR-IDs Covered | Endpoints / Components |
|---|---|---|---|
| **BG-AU1** Identity verification | FR-AU1, FR-AU1.b, FR-AU2 | NFR-AU1, NFR-AU4, NFR-AU5, NFR-AU7 | `POST /auth/register`, `POST /auth/login` |
| **BG-AU2** Role-based authorization | FR-AU3, FR-AU4, FR-AU5 | NFR-AU2, NFR-AU3, NFR-AU9, NFR-AU10, NFR-AU11 | `protectRoute` middleware, `roleGuard(role)` middleware |
| **BG-AU3** Abuse resistance | FR-AU2.b, FR-AU1.c | NFR-AU6, NFR-AU8 | Login lockout, registration rate-limit |

**Orphan audit:** 0 orphans across 8 FRs (incl. sub-IDs) and 11 NFRs.

---

## 3. Persona Discovery

Per PDF: ≥ 5 hidden requirements via "AI User" avatar acting as frustrated or malicious.

Three personas were instantiated. Auth uniquely needs **two malicious personas** because the attack surface is wider than any feature slice.

### 3.1 Persona A — Forgetful User (Frustrated)
**Profile:** Returning customer who forgot the password they made up last week. Types the same wrong password 8 times before pausing.

### 3.2 Persona B — Brute-Force Attacker (Malicious)
**Profile:** Script-kiddie running a credential-stuffing dictionary against a leaked email list. Sends 1000 login attempts per minute from a botnet.

### 3.3 Persona C — Token Thief (Malicious)
**Profile:** Insider with read access to a victim's browser. Steals the JWT from localStorage, replays it, tries to modify the `role` claim, and replays an expired token to test the validation logic.

### 3.4 Hidden Requirements Surfaced

8 hidden requirements identified — **exceeds PDF minimum of 5.**

| ID | Persona | Hidden Requirement | Escalates To |
|---|---|---|---|
| **HR-AU1** | Forgetful | "I typed my password wrong 5 times — let me try a 6th time." | New **NFR-AU6** — account lockout after 5 failed logins per email; 15-min cooldown |
| **HR-AU2** | Brute-Force | "Error said 'Invalid password' — so the email is valid. Now I just need to crack the password." | New **NFR-AU7** — generic error message ("Invalid credentials") regardless of which field is wrong (user-enumeration defense) |
| **HR-AU3** | Brute-Force | "Let me put `' OR 1=1 --` in the email field." | New **FR-AU1.b** — strict Zod validation: email matches RFC 5322, password ≥ 8 chars, all inputs sanitized |
| **HR-AU4** | Brute-Force | "I'll register 10,000 fake accounts from the same IP." | New **NFR-AU8** — registration rate-limit: max 5 registrations per IP per hour |
| **HR-AU5** | Token Thief | "I'll edit the JWT payload to set `role: admin` and resend." | New **NFR-AU9** — JWT signature verified on every protected request; tampering invalidates the token (HMAC mismatch) |
| **HR-AU6** | Token Thief | "I stole a JWT from last week — let me try replaying it now." | New **NFR-AU10** — JWT `exp` claim verified on every protected request; expired tokens rejected with 401 |
| **HR-AU7** | Token Thief | "The login response includes the user object — does it leak the password hash?" | New **NFR-AU11** — passwordHash field never exposed in any response, JWT payload, or audit log entry |
| **HR-AU8** | Forgetful | "I'm logged in but every API call from my app fails with 401 — the JWT expired in the middle of my workflow." | New **FR-AU2.b** — login endpoint returns JWT with `exp` field clearly visible so the frontend can refresh before expiry (frontend can decide; backend does not auto-refresh in Phase 1 scope) |

---

## 4. Functional Requirements (Consolidated)

| FR-ID | Description |
|---|---|
| **FR-AU1**   | `POST /auth/register` accepts `{ email, password }`, hashes password with bcrypt, creates User with default role `"customer"`, returns `201 { userId, email, role }` |
| **FR-AU1.b** | Input validation (from HR-AU3): email matches RFC 5322; password length ≥ 8 chars; rejects with 400 if either fails |
| **FR-AU1.c** | Registration rate-limit guard (from HR-AU4): 5 registrations per IP per rolling hour; 6th returns 429 |
| **FR-AU2**   | `POST /auth/login` accepts `{ email, password }`, verifies bcrypt hash, issues JWT, returns `200 { token, expiresAt }` |
| **FR-AU2.b** | Login response exposes JWT `expiresAt` (from HR-AU8) so frontend can detect upcoming expiry |
| **FR-AU3**   | Middleware `protectRoute(req, res, next)` validates `Authorization: Bearer <token>` header: signature + expiry; rejects 401 if missing/invalid |
| **FR-AU4**   | Middleware `roleGuard(role)` factory: returns middleware that checks `req.user.role === role`; rejects 403 if mismatch. Convenience exports: `adminGuard`, `agentGuard`, `customerGuard` |
| **FR-AU5**   | JWT structure: `{ sub: userId, role: "customer"\|"agent"\|"admin", exp: unix_ts, iat: unix_ts }`; signed with HMAC-SHA256 using `JWT_SECRET` |

---

## 5. Non-Functional Requirements (Consolidated)

| NFR-ID | Description | Source |
|---|---|---|
| **NFR-AU1**  | bcrypt cost factor ≥ 10 (≥ 100ms per hash on modern hardware — enough to deter offline brute-force) | Security baseline |
| **NFR-AU2**  | JWT lifetime exactly 24 hours from `iat` (matches Member B's CONTEXT.md L184 "Session Expiry: 24 hours") | Cross-slice consistency |
| **NFR-AU3**  | `JWT_SECRET` loaded from `process.env.JWT_SECRET`; never committed to git; rotation tooling deferred to ops | Security baseline |
| **NFR-AU4**  | Login p95 latency < 500 ms (excluding bcrypt verify, which is intentionally slow per NFR-AU1) | Performance baseline |
| **NFR-AU5**  | Every auth event logged: register (success), login (success/failure), lockout-triggered. Fields: `timestamp, email, ip, eventType, outcome` | Offstage Audit Team |
| **NFR-AU6**  | Account lockout after **5 failed login attempts** per email within a 15-min window; lockout duration **15 minutes**; sliding window resets on success | HR-AU1 |
| **NFR-AU7**  | Login failures return generic `401 { error: "Invalid credentials" }` regardless of whether email or password was the wrong part | HR-AU2 (user-enumeration defense) |
| **NFR-AU8**  | Registration rate-limit: **5 per IP per rolling hour**; 6th attempt returns `429 { error: "Too many registrations" }` | HR-AU4 |
| **NFR-AU9**  | JWT signature verified on every protected request; HMAC mismatch returns `401 { error: "Invalid token" }` | HR-AU5 |
| **NFR-AU10** | JWT `exp` claim verified on every protected request; expired tokens return `401 { error: "Token expired" }` | HR-AU6 |
| **NFR-AU11** | `passwordHash` field never exposed in any response payload, JWT claim, or log entry. Serialization layer must explicitly exclude it. | HR-AU7 |

---

## 6. Cross-Slice Coordination Map

This slice's PUBLIC contract is consumed by **every** other slice. Below is the explicit contract surface:

| Consumer | What They Receive From Auth | When |
|---|---|---|
| **Member A — Checkout** | Optional JWT validation; `req.user` populated if Bearer token present (used to bind guest sessions to user accounts at checkout) | Per request |
| **Member B — Payment** | `protectRoute` middleware enforcing customer JWT on `POST /api/payment/process` | Per request |
| **Member C — Tickets** | `protectRoute` + `customerGuard` on `POST /api/v1/tickets`; `agentGuard` on `GET /tickets/queue` and `PATCH .../status` | Per request |
| **Member D — Orders** | `protectRoute` + `adminGuard` on every endpoint under `/api/v1/orders` and `/api/v1/inventory` | Per request |

**Public Contract — what consumers depend on:**
- Header format: `Authorization: Bearer <token>`
- JWT structure: `{ sub: string, role: "customer"|"agent"|"admin", exp: number, iat: number }`
- HMAC-SHA256 signature using shared `JWT_SECRET`
- 24-hour lifetime
- `req.user` populated after middleware runs: `{ userId, role }`

**Hidden Implementation — free to change without consumer impact:**
- Choice of bcrypt vs argon2 for password hashing
- In-memory rate-limiter vs Redis backend
- User table column order, additional metadata fields
- Login latency-budget internals (where the 500 ms goes)
- Audit-log transport (in-process buffer vs external pipe)

---

## 7. Exit Criteria — Phase 1

- [x] Actor Classification — Primary / Supporting / Offstage populated (incl. all four other slices as Offstage consumers)
- [x] Traceability Heatmap produced (see companion file); 0 orphans
- [x] Persona Discovery executed with 3 personas (1 frustrated + 2 malicious); 8 hidden requirements (≥ 5 required)
- [x] FRs and NFRs consolidated and indexed for Phase 2 consumption
- [x] Cross-slice consumer contract documented (§6)
- [x] Ownership clarified in CONTEXT.md (auth → Member D)
- [x] Logbook entry written (`docs/logbook/member_d_auth_phase1_agile_logbook.md`)
