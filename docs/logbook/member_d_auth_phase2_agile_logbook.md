# Agile Logbook — Phase 2: Design & Specification
## Member D — Auth Slice (Slice 2)

**Owner:** Member D (alongside `orders`)
**Phase:** 2 — Design & Specification
**Curriculum:** `CSE323_Project_Overview.pdf`
**Slice token:** `auth`
**Sprints in this phase:** 4 (Gherkin → Refinement Loop → UML Modeling → Information Hiding)

---

## Sprint A2.1 — Gherkin Scripting

**Date:** 2026-05-13
**Goal:** Translate every FR-AU* from Phase 1 (plus sub-IDs and the NFRs that affect behavior) into structured Given/When/Then scenarios.

### 1. Functional Requirements Addressed
- **FR-AU1, FR-AU1.b, FR-AU1.c** → Story AU-1 (5 scenarios: happy + email format + password length + duplicate email + rate-limit)
- **FR-AU2, FR-AU2.b** → Story AU-2 (5 scenarios: happy + wrong-password + wrong-email + lockout + counter-reset)
- **FR-AU3** → Story AU-3 (4 scenarios: happy + missing header + tampered + expired)
- **FR-AU4** → Story AU-4 (4 scenarios: adminGuard accept/reject + agentGuard reject + customerGuard accept agent)
- **FR-AU5** → Story AU-5 (2 scenarios: claim structure + signature verification)

### 2. Non-Functional Requirements Addressed
- **NFR-AU6** — Story AU-2 lockout scenarios
- **NFR-AU7** — Story AU-2 byte-identical generic error scenarios
- **NFR-AU8** — Story AU-1 rate-limit scenario
- **NFR-AU9, NFR-AU10** — Story AU-3 signature/expiry scenarios
- **NFR-AU11** — Story AU-1 happy scenario asserts no `passwordHash` in response

### 3. Golden Prompts Used

```
PROMPT A2.1.a — Auth Gherkin Generation
─────────────────────────────────
For every FR-AU* in Phase 1 §4, write Given/When/Then scenarios that:
  1. Use exact HTTP verbs, paths, JSON bodies, status codes
  2. Reference the User entity's persisted fields by name (failedLoginCount,
     lockedUntil) where state-dependent
  3. Specify the EXACT JWT claim structure { sub, role, exp, iat } and
     the lifetime constraint (exp - iat === 86400) as machine-checkable
  4. For every Phase 1 Hidden Requirement (HR-AU1..AU8), produce a Gherkin
     scenario that exercises it
  5. Avoid the banned words from §2 of this doc (no "valid email",
     no "strong password", etc.) — use the measurable replacements
```

```
PROMPT A2.1.b — User-Enumeration Defense Scenarios
─────────────────────────────────
HR-AU2 demands that wrong-email and wrong-password login attempts return
byte-identical responses. Write two scenarios:
  1. Wrong password for existing email -> 401 with EXACT body
  2. Any password for non-existent email -> 401 with EXACT body (same)
And explicitly assert the response bodies are byte-identical between the
two scenarios.
```

### 4. Audits

| Check | Finding |
|---|---|
| Every FR-AU* has ≥ 1 Gherkin scenario | ✅ |
| Every HR-AU* from Phase 1 has a corresponding scenario | ✅ HR-AU1→AU-2 lockout; HR-AU2→AU-2 generic; HR-AU3→AU-1 validation; HR-AU4→AU-1 rate-limit; HR-AU5→AU-3 tampered; HR-AU6→AU-3 expired; HR-AU7→AU-1 no-passwordHash; HR-AU8→AU-2 expiresAt |
| Every scenario uses exact HTTP codes (no vague "fails") | ✅ |
| JWT structure scenarios assert exact claim names | ✅ AU-5 scenario 1 |
| No banned adjectives in scenario text | ✅ swept for "valid"/"secure"/"strong"/"fast" |
| Privilege hierarchy documented (customerGuard accepts agent + admin) | ✅ AU-4 scenario 4 + note below story |

### 5. Folder Structure (Sprint A2.1 End)

```
customer-ordering-system/
└── docs/
    ├── requirements/
    │   ├── member_d_auth_phase1_requirements.md         [Phase 1 ✅]
    │   ├── member_d_auth_traceability_heatmap.md        [Phase 1 ✅]
    │   └── member_d_auth_phase2_design.md               [§1 Gherkin ✅]
    └── logbook/
        ├── member_d_auth_phase1_agile_logbook.md        [Phase 1 ✅]
        └── member_d_auth_phase2_agile_logbook.md        [Sprint A2.1 ✅]
```

---

## Sprint A2.2 — The Refinement Loop (Senior QA Audit)

**Date:** 2026-05-13
**Goal:** Strip every unquantifiable adjective from the Phase 1 requirements and Phase 2 Gherkin; replace with measurable technical metrics that map to a verification mechanism.

### 1. Functional Requirements Addressed
None added. This sprint **hardens** existing FRs by making their acceptance criteria mechanically testable.

### 2. Non-Functional Requirements Addressed
- **NFR-AU1** "secure password storage" → bcrypt cost ≥ 10
- **NFR-AU2** "secure tokens" → HS256 + `JWT_SECRET` env var ≥ 32 bytes
- **NFR-AU4** "fast login" → p95 < 500 ms excluding bcrypt
- **NFR-AU6** "locked out" → `user.lockedUntil > Date.now()`
- **NFR-AU7** "generic error" → byte-identical response shape
- **NFR-AU8** "rate-limited" → `count >= 5` in rolling 3600s window
- **NFR-AU9** "tampered token" → `jwt.verify()` throws `JsonWebTokenError`
- **NFR-AU10** "expired token" → `decoded.exp * 1000 < Date.now()`
- **NFR-AU11** "secret never exposed" → serializer static check

### 3. Golden Prompts Used

```
PROMPT A2.2.a — Auth Adjective Hunter
─────────────────────────────────
Acting as a Senior QA Engineer: scan every Phase 1 NFR and every Phase 2
Gherkin scenario for unquantifiable adjectives. For each finding:
  1. The exact phrase that is vague
  2. A measurable replacement (number, regex, schema, comparison)
  3. The verification mechanism (Vitest unit / Supertest integration /
     static check)
List banned-words for Phase 3 auth artifacts.
```

```
PROMPT A2.2.b — Byte-Identical Error Audit
─────────────────────────────────
NFR-AU7 (user enumeration defense) requires that wrong-email and
wrong-password login responses are byte-identical. Verify that the
Gherkin scenarios in Story AU-2 enforce this. Add an explicit assertion
of byte-identical response bodies between the two scenarios.
```

### 4. Audits

| Check | Finding |
|---|---|
| 11 vague terms identified and replaced | ✅ §2 table |
| Every replacement names a verification mechanism | ✅ Vitest / Supertest / static check each cited |
| Banned-word list produced for Phase 3 | ✅ 14 words/phrases |
| User-enumeration defense made byte-level testable | ✅ explicit "byte-identical" assertion in AU-2 |
| Lockout short-circuit (skip bcrypt) documented | ✅ §2 row for "locked out" + Activity Diagram §3.4.1 |

### 5. Folder Structure (Sprint A2.2 End)

```
customer-ordering-system/
└── docs/requirements/
    └── member_d_auth_phase2_design.md               [§1-§2 ✅]
```

---

## Sprint A2.3 — UML Modeling (Class + State + SSDs + Activity)

**Date:** 2026-05-13
**Goal:** Produce **four** UML artifacts under one umbrella per PDF: Class Diagram (static), State Machine Diagram (dynamic), SSDs (behavioral happy + failure), Activity Diagrams (code decision points).

### 1. Functional Requirements Addressed
Every FR-AU* is represented in at least one UML artifact:
- **FR-AU1, FR-AU2** → SSD-AU1, SSD-AU2 (happy + 6 failure paths); Activity §3.4.1
- **FR-AU3** → SSD-AU3 (happy + 3 failure paths); Activity §3.4.2
- **FR-AU4** → SSD-AU4 (happy + 1 failure path)
- **FR-AU5** → JWT structure in Class Diagram §3.1 + JWT side diagram in §3.2.2

### 2. Non-Functional Requirements Addressed
- **NFR-AU6** (lockout) — first-class state in State Machine Diagram §3.2
- **NFR-AU4** (latency target) — Activity Diagram §3.4.1 shows bcrypt short-circuit on LOCKED state
- **NFR-AU11** (no passwordHash exposure) — Class Diagram §3.1 marks `passwordHash` as `<<sensitive>>`

### 3. Golden Prompts Used

```
PROMPT A2.3.a — Auth Class Diagram
─────────────────────────────────
Produce a PlantUML class diagram for the auth slice that:
  1. Shows the User entity with every persisted field including state
     columns (failedLoginCount, lockedUntil)
  2. Marks passwordHash with <<sensitive>> stereotype (never serialized)
  3. Shows the Role enum (CUSTOMER, AGENT, ADMIN)
  4. Shows AuthService + 3 helper classes (PasswordHasher, JwtSigner,
     RateLimiter) with their public method signatures
  5. Shows protectRoute middleware and roleGuard factory + 3 convenience
     guards (adminGuard, agentGuard, customerGuard)
  6. Shows the 4 consumer slices (Checkout, Payment, Tickets, Orders) in
     gray with the specific middleware they mount
```

```
PROMPT A2.3.b — User Account State Machine
─────────────────────────────────
Render the User account lifecycle as a UML State Machine in PlantUML.
Constraints:
  1. Initial pseudo-state -> UNREGISTERED -> REGISTERED via POST /auth/register
  2. REGISTERED has self-loops for login success (clear counter) and
     failure 1-4 (increment counter)
  3. REGISTERED -> LOCKED on 5th failure (temporary state, time-based exit)
  4. LOCKED self-loop on attempted logins (skip bcrypt — critical for
     NFR-AU4)
  5. LOCKED -> REGISTERED on first attempt after lockedUntil < NOW
  6. Notes attached to LOCKED explaining the bcrypt skip and the
     temporary-not-terminal nature
```

```
PROMPT A2.3.c — Login SSD with All Failure Paths
─────────────────────────────────
Draw an SSD for POST /auth/login that covers:
  - Happy path: rate-limiter, user lookup, bcrypt verify, counter clear,
    JWT sign, audit log, 200 response with token + expiresAt
  - Wrong password (1st-4th attempt): increment counter, audit FAILURE,
    401 generic
  - Wrong email: NO user lookup match, audit FAILURE, 401 generic
    (response byte-identical to wrong-password)
  - 5th wrong password (lockout trigger): set lockedUntil, audit LOCKOUT,
    return 401 (NOT 423 — client sees generic error first)
  - Subsequent login while locked: short-circuit, NO bcrypt invocation,
    423 Locked

NOTE: the FIRST 5th-failure response must still be 401 to avoid leaking
that an account has been locked. Only SUBSEQUENT attempts return 423.
```

```
PROMPT A2.3.d — Activity Diagram with Code Mapping
─────────────────────────────────
Produce an Activity Diagram for POST /auth/login. Every decision diamond
must map to a single line of source code (file + identifier). Cover all
six terminal outcomes: 400 validation / 423 locked / 401 wrong-user /
401 wrong-pwd / 401 lockout-trigger / 200 success.
```

### 4. Audits

| Check | Finding |
|---|---|
| Class Diagram includes every persisted entity | ✅ User + AuditLog |
| `passwordHash` marked sensitive | ✅ `<<sensitive>>` stereotype with explanatory comment |
| Class Diagram shows all 5 middleware exports | ✅ protectRoute + roleGuard + adminGuard/agentGuard/customerGuard |
| Cross-slice consumer relationships drawn | ✅ 4 consumer slices with which middleware they mount |
| State Machine shows LOCKED as temporary (not terminal) | ✅ note attached + `<<temporary>>` stereotype |
| State Machine shows bcrypt skip in LOCKED self-loop | ✅ note "bcrypt verify is SKIPPED" |
| All 4 SSDs cover happy + every failure path from §1 Gherkin | ✅ 4 happy + 8 failure paths total |
| Login Activity Diagram has all 6 terminal outcomes | ✅ 400 / 423 / 401×3 / 200 |
| Every decision diamond maps to a code location | ✅ Zod parse, prisma.findUnique, lockedUntil compare, bcrypt.compare, counter equals 5 |

### 5. Folder Structure (Sprint A2.3 End)

```
customer-ordering-system/
└── docs/requirements/
    └── member_d_auth_phase2_design.md               [§1-§3 ✅]
```

---

## Sprint A2.4 — Information Hiding

**Date:** 2026-05-13
**Goal:** Lock down the public contract (HTTP endpoints + middleware exports + JWT claim structure) and explicitly partition what's hidden vs public. Auth is a producer slice: it has more cross-slice contracts than any other slice in the project.

### 1. Functional Requirements Addressed
None added. This sprint **classifies** every FR-AU* as either public-contract or implementation-detail.

### 2. Non-Functional Requirements Addressed
- **Project NFR (maintainability):** by hiding `bcrypt` cost factor and rate-limiter backend, we can rotate algorithms or swap to Redis without breaking consumers.
- **NFR-AU3** (`JWT_SECRET` env var) — declared as ops detail in §4.2; rotation is an ops concern, not a contract change.

### 3. Golden Prompts Used

```
PROMPT A2.4.a — Auth Public/Private Partition
─────────────────────────────────
List every behavior, value, and shape the auth slice exposes. For each,
classify as PUBLIC (consumers may depend on this) or HIDDEN
(implementation detail, free to change).

The auth slice has THREE public surfaces:
  1. HTTP endpoints — POST /auth/register, POST /auth/login
  2. Middleware exports — protectRoute, roleGuard, adminGuard, agentGuard,
     customerGuard
  3. JWT claim structure — { sub, role, exp, iat }, HS256, 24h

Everything else is hidden. Confirm the partition is exhaustive and
disjoint.
```

```
PROMPT A2.4.b — Cross-Slice Contracts Lock
─────────────────────────────────
For each prior teammate dependency we identified in Phase 1 §6 and the
traceability heatmap §6, lock its specific value here. State the value
and the consumer-side impact.

Examples:
  - JWT lifetime: 24h (Member B's CONTEXT.md L184 inheritance confirmed)
  - Claim structure: { sub, role, exp, iat } (answers Member C's
    OpenAPI YAML L10-L12 pending question)
  - Role hierarchy: admin >= agent >= customer (NEW — affects Member C's
    agent endpoints which now accept admin too)
  - Generic login error: { "error": "Invalid credentials" } (NEW — clients
    must not assume distinguishable error)
```

### 4. Audits

| Check | Finding |
|---|---|
| Public surfaces enumerated | ✅ 3 surfaces (HTTP, middleware, JWT structure) |
| Hidden details enumerated | ✅ 9 items |
| Consumption rules per teammate | ✅ 5 rows (A / B / C / D-own / frontend) |
| Cross-slice contracts locked with values | ✅ 7 contracts in §4.4 |
| Privilege hierarchy explicitly stated | ✅ admin ≥ agent ≥ customer, with explanation of why customerGuard accepts agents |
| `JWT_SECRET` rotation marked as ops-detail not API change | ✅ §4.2 |
| Email case-folding decision documented | ✅ §4.2 — case-insensitive match, original storage |

### 5. Folder Structure (Sprint A2.4 End — Phase 2 COMPLETE)

```
customer-ordering-system/
└── docs/
    ├── requirements/
    │   ├── member_d_auth_phase1_requirements.md         [Phase 1 ✅]
    │   ├── member_d_auth_traceability_heatmap.md        [Phase 1 ✅]
    │   └── member_d_auth_phase2_design.md               [✅ COMPLETE]
    └── logbook/
        ├── member_d_auth_phase1_agile_logbook.md        [Phase 1 ✅]
        └── member_d_auth_phase2_agile_logbook.md        [✅ COMPLETE]
```

---

## Cross-Slice Coordination Log (Phase 2 Updates)

| Teammate Reference | Phase 2 Resolution |
|---|---|
| Member B `Phase3_04_vertical_slicing.md` L77: *"applies Member D's `protectRoute` authentication middleware"* | Now CORRECT — middleware contract locked in §4.1 Surface 2 |
| Member B `Phase3_04_vertical_slicing.md` L114: *"Auth failure handled by `protectRoute` middleware from Member D rejects before reaching Member B's controller"* | Now ACCURATE — SSD-AU3 shows the exact rejection flow |
| Member C `02f_API_CONTRACT.yaml` L10–L12: *"PENDING confirmation from Member D regarding JWT claim structure"* | RESOLVED — §4.1 Surface 3 locks `{ sub, role, exp, iat }`, HS256, 24h |
| Member C `02f_API_CONTRACT.yaml` L38: *"Expected claims: sub (userId), role (\"customer\"\|\"agent\"), exp"* | CONFIRMED — Member C's expectation exactly matches our contract |
| Member B CONTEXT.md L184: *"Session Expiry: 24 hours (Inherited from Auth slice)"* | LOCKED — NFR-AU2 + §4.1 Surface 3 |
| Privilege hierarchy (NEW constraint introduced this phase) | Member C's `agentGuard` will now accept admin JWTs (admin can do agent tasks); Member C should update Gherkin to reflect this OR explicitly opt out by checking `role === "agent"` strictly |

---

## Phase 2 — Audit Verdict

Phase 2 auth deliverables are **PDF-compliant and consumer-ready**:
- Gherkin: 5 stories, 20 scenarios, every FR + every HR covered
- Refinement Loop: 11 vague terms eliminated; 14 words banned
- UML: 4 artifacts (Class + State + 4 SSDs + 2 Activity) under one umbrella per PDF
- Information Hiding: 3 public surfaces explicitly enumerated; 9 hidden details; consumer-impact analysis for 7 locked contracts

**Ready for Phase 3 (TDP)** — see "Next Tasks" below.

---

## Next Tasks (Phase 3 — TDP: Failing Tests First)

Per the team's TDP convention, the following failing tests should be authored and committed before any implementation:

1. `test/auth-register-happy-and-validation` — registration success + email/password validation + duplicate (T-AU1.1..5)
2. `test/auth-register-rate-limit` — 6th registration from one IP within 1 hour returns 429 (T-AU1.6)
3. `test/auth-login-happy-and-generic-error` — happy path + byte-identical wrong-user/wrong-password 401 responses (T-AU2.1..3)
4. `test/auth-login-lockout` — 5 failures → 6th attempt 423 even with correct password (T-AU2.5..6)
5. `test/auth-protectRoute-token-cases` — missing / tampered / expired tokens all return 401 (T-AU3.2..4)
6. `test/auth-roleGuard-hierarchy` — adminGuard accepts only admin; agentGuard accepts agent + admin; customerGuard accepts all three (T-AU4.1..4)
7. `test/auth-jwt-claim-structure` — decoded JWT contains exactly { sub, role, exp, iat }; alg=HS256; lifetime = 86400 (T-AU5.1..2)

Each test must be commit-RED before its corresponding implementation gets written.
