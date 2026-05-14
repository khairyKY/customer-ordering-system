# Agile Logbook — Phase 1: Requirement Discovery & Traceability
## Member D — Auth Slice (Slice 2)

**Owner:** Member D (alongside `orders`)
**Phase:** 1 — Requirement Discovery & Traceability
**Curriculum:** `CSE323_Project_Overview.pdf`
**Slice token:** `auth`
**Sprints in this phase:** 4 (Ownership Establishment → Actor Classification → Traceability Heatmap → Persona Discovery)

---

## Sprint A1.0 — Ownership Establishment

**Date:** 2026-05-13
**Goal:** Formally claim auth ownership and update CONTEXT.md to resolve the long-running coordination ambiguity where Member B's payment slice and Member C's tickets slice both pointed at *"Member D's auth service"* without ownership ever being officially recorded.

### 1. Functional Requirements Addressed
None — this sprint is governance, not feature definition.

### 2. Non-Functional Requirements Addressed
- **Project NFR (coordination):** every slice has exactly one owner; CONTEXT.md slice-status table is the source of truth.

### 3. Golden Prompts Used

```
PROMPT A1.0.a — Ownership Trace
─────────────────────────────────
Search every committed teammate doc for references to "auth", "JWT", "protectRoute",
"Bearer token", "Member D's auth". Report the file:line of every reference and
indicate whether it assumes auth ownership.
```

### 4. Audits

| Check | Finding |
|---|---|
| Member B references "Member D's protectRoute" | ✅ `md/phase3/Phase3_04_vertical_slicing.md` L77, L114 |
| Member C references "Member D's Auth Service" | ✅ `Phase 1/01a_persona_and_actors.md` S-2; `Phase 2/02f_API_CONTRACT.yaml` L10–L12, L38 |
| Member A's checkout assumes optional JWT | ✅ `07-checkout-feature-scope.md` API contract column "Auth: Optional" |
| Member B's CONTEXT.md L184 says "Session Expiry: 24 hours (Inherited from Auth slice)" | ✅ implies auth slice must provide 24h |
| CONTEXT.md current slice-status table assigns auth to Member B | ❌ Will be corrected to Member D in this commit |

### 5. Folder Structure (Sprint A1.0 End)

```
customer-ordering-system/
├── .ai/CONTEXT.md                                          [TO UPDATE — auth row]
└── docs/
    ├── requirements/
    │   ├── member_d_phase1_requirements.md                 [orders — unchanged]
    │   ├── member_d_phase2_design.md                       [orders — unchanged]
    │   ├── member_d_traceability_heatmap.md                [orders — unchanged]
    │   ├── member_d_auth_phase1_requirements.md            [NEW ✅]
    │   └── member_d_auth_traceability_heatmap.md           [NEW ✅]
    └── logbook/
        ├── member_d_phase1_agile_logbook.md                [orders — unchanged]
        ├── member_d_phase2_agile_logbook.md                [orders — unchanged]
        └── member_d_auth_phase1_agile_logbook.md           [Sprint A1.0 ✅]
```

---

## Sprint A1.1 — Actor Classification

**Date:** 2026-05-13
**Goal:** Identify every actor touching the auth slice per PDF taxonomy (Primary/Supporting/Offstage) — with explicit attention to the unusual fact that **every other slice is Offstage** because they consume the JWT but don't initiate auth use cases.

### 1. Functional Requirements Addressed
- FR-AU1 (register) — Primary actor identified: unauthenticated End User
- FR-AU2 (login) — Primary actor identified: registered End User

### 2. Non-Functional Requirements Addressed
- **NFR-AU3** — `JWT_SECRET` env-var ownership decided (this slice)
- **NFR-AU5** — Audit Team identified as Offstage; their interest forces logging into the design

### 3. Golden Prompts Used

```
PROMPT A1.1.a — Auth Actor Discovery
─────────────────────────────────
Acting as a UML modeler classifying actors for an auth slice:
  PRIMARY: who initiates registration AND login use cases? Be explicit about
           the auth-state difference (unauthenticated vs registered).
  SUPPORTING: name every service the auth flow calls during execution
              (hashing, JWT signing, DB, clock, rate-limiter).
  OFFSTAGE: every other slice (A checkout, B payment, C tickets, D orders)
            consumes the JWT but is not present during a login use case.
            Classify them as Offstage with strong rationale, plus the
            Audit Team and hostile attackers.
```

```
PROMPT A1.1.b — Offstage Justification
─────────────────────────────────
For each Offstage actor, write one sentence on why their interest in the
outcome imposes a design constraint. Reject any Offstage actor that does
not generate at least one NFR.
```

### 4. Audits

| Check | Finding |
|---|---|
| 2 Primary actors covering both endpoints | ✅ Unauth User (register) + Registered User (login) |
| 5 Supporting actors enumerated | ✅ bcrypt, JWT signer, User DB, Clock, Rate-Limiter |
| 6 Offstage actors enumerated (incl. all 4 consumer slices) | ✅ A, B, C, D, Audit Team, Hostile Network |
| Every Offstage actor generates ≥ 1 NFR | ✅ Audit Team → NFR-AU5; Hostile Network → NFR-AU1, NFR-AU7..AU10 |

### 5. Folder Structure (Sprint A1.1 End)

Unchanged from A1.0 — `member_d_auth_phase1_requirements.md` now contains §1 Actor Classification complete.

---

## Sprint A1.2 — Traceability Heatmap

**Date:** 2026-05-13
**Goal:** Construct a backward+forward heatmap that proves every auth requirement has a feature and a test, with zero orphans. Add the **reverse-orphan** check (every consumer slice's auth dependency maps to one of our FRs) since this slice's whole job is to serve others.

### 1. Functional Requirements Addressed
FR-AU1 .. FR-AU5 (incl. .b and .c sub-IDs) — all 8 FRs mapped to:
- 3 Business Goals (BG-AU1 Identity verification, BG-AU2 Role-based auth, BG-AU3 Abuse resistance)
- 5 endpoints / middleware components
- 25+ test IDs (T-AU1.1 — T-AU5.2)

### 2. Non-Functional Requirements Addressed
NFR-AU1 .. NFR-AU11 — all 11 NFRs cross-tabbed against features in §3 of the heatmap.

### 3. Golden Prompts Used

```
PROMPT A1.2.a — Auth Heatmap Construction
─────────────────────────────────
Construct a traceability matrix for the auth slice that proves:
  - Every FR-AU* maps backward to a Business Goal (BG-AU1, BG-AU2, BG-AU3)
  - Every FR maps forward to at least one feature and one test ID
  - Every NFR is verified by at least one test
  - Every Hidden Requirement from §3 of the Phase 1 doc escalates cleanly
The matrix is REJECTED if any row has a missing cell.
```

```
PROMPT A1.2.b — Reverse-Orphan Check (Auth-Specific)
─────────────────────────────────
Auth is a producer slice. Every OTHER slice depends on it. Enumerate every
auth-related dependency that Members A, B, C, and D (own orders) declare
in their committed docs. For each, name the FR-AU* in this slice that
fulfills it. If any consumer dependency has no fulfilling FR, that is a
reverse orphan and must be added.
```

### 4. Audits

| Check | Finding |
|---|---|
| Backward trace complete | ✅ |
| Forward trace complete | ✅ |
| NFR coverage cross-tab | ✅ 11 NFRs, all with verification mechanism |
| Reverse orphan check (consumer slices) | ✅ 6 consumer dependencies, all fulfilled — see Heatmap §6 |
| **Total orphans (forward + reverse)** | **0** |

### 5. Folder Structure (Sprint A1.2 End)

```
customer-ordering-system/
└── docs/requirements/
    ├── member_d_auth_phase1_requirements.md               [§1-§2 complete]
    └── member_d_auth_traceability_heatmap.md              [✅ COMPLETE]
```

---

## Sprint A1.3 — Persona Discovery

**Date:** 2026-05-13
**Goal:** Run the "AI User" avatar as three personas (1 frustrated + 2 distinct malicious) and surface ≥ 5 hidden requirements per PDF.

### 1. Functional Requirements Addressed
Persona output added new FR sub-IDs:
- **FR-AU1.b** — input sanitization (from HR-AU3)
- **FR-AU1.c** — registration rate-limit (from HR-AU4)
- **FR-AU2.b** — login response exposes `expiresAt` (from HR-AU8)

### 2. Non-Functional Requirements Addressed
Persona output added NFRs:
- **NFR-AU6** — login lockout (HR-AU1)
- **NFR-AU7** — generic error message (HR-AU2)
- **NFR-AU8** — registration rate-limit value (HR-AU4)
- **NFR-AU9** — JWT signature verification (HR-AU5)
- **NFR-AU10** — JWT expiry check (HR-AU6)
- **NFR-AU11** — passwordHash never exposed (HR-AU7)

### 3. Golden Prompts Used

```
PROMPT A1.3.a — Forgetful User Persona
─────────────────────────────────
You are a returning customer who forgot their password from last week.
Type it wrong 8 times in a row. For each frustration, name the smallest
UX or backend change that would have prevented it. Surface AT LEAST 2
hidden requirements that the current FR/NFR list does NOT address.
```

```
PROMPT A1.3.b — Brute-Force Attacker Persona
─────────────────────────────────
You are running a credential-stuffing script against a leaked email list.
1000 logins/min from a botnet. Enumerate every attack vector you would
try at the login + register endpoints. For each, identify the smallest
change to the API that would block it. Surface AT LEAST 3 attacks the
current FR/NFR list does NOT defend against.
```

```
PROMPT A1.3.c — Token Thief Persona
─────────────────────────────────
You have read access to a victim's browser localStorage. You steal their
JWT. List every way you would try to misuse it (replay, edit role,
replay after expiry, read the password from the response that issued it).
For each, identify the cryptographic or design padlock that blocks the
attack. Surface AT LEAST 3 attacks the current FR/NFR list does NOT
defend against.
```

```
PROMPT A1.3.d — Hidden Requirement Escalation
─────────────────────────────────
For every frustration AND every attack surfaced in A1.3.a/b/c, decide
whether it becomes (a) a new FR, (b) a new NFR, or (c) a new sub-ID
on an existing FR. Reject any persona finding that does not escalate
cleanly to one of these.
```

### 4. Audits

| Check | Finding |
|---|---|
| ≥ 5 hidden requirements (PDF minimum) | ✅ 8 produced |
| Three distinct personas executed | ✅ Forgetful + Brute-Force + Token Thief |
| Every HR escalates to FR/NFR | ✅ see Heatmap §4 |
| Coverage of two malicious personas (PDF: "frustrated **or** malicious") | ✅ Auth uniquely deserves both — attack surface is wider |
| No duplication with FRs already in scope | ✅ verified against §4 FR list before adding |

### 5. Folder Structure (Sprint A1.3 End — Phase 1 COMPLETE)

```
customer-ordering-system/
├── .ai/CONTEXT.md                                          [UPDATED — auth = Member D]
└── docs/
    ├── requirements/
    │   ├── member_d_phase1_requirements.md                 [orders]
    │   ├── member_d_phase2_design.md                       [orders]
    │   ├── member_d_traceability_heatmap.md                [orders]
    │   ├── member_d_auth_phase1_requirements.md            [✅ COMPLETE]
    │   └── member_d_auth_traceability_heatmap.md           [✅ COMPLETE]
    └── logbook/
        ├── member_d_phase1_agile_logbook.md                [orders]
        ├── member_d_phase2_agile_logbook.md                [orders]
        └── member_d_auth_phase1_agile_logbook.md           [✅ COMPLETE]
```

---

## Cross-Slice Coordination Log

| Issue | Resolution in This Phase |
|---|---|
| Ambiguous ownership of `auth` between Members B, C, D | **RESOLVED** — Member D claims auth slice (alongside orders). CONTEXT.md updated. |
| Member B's CONTEXT.md L211 says *"Member D's protectRoute"* | Now ACCURATE — Member D owns it; will deliver in Phase 3 |
| Member C's `02f_API_CONTRACT.yaml` L10–L12 awaits *"Member D's JWT claim structure"* | Now LOCKED — see FR-AU5: `{ sub, role, exp, iat }`, HMAC-SHA256, 24h lifetime |
| Member B's CONTEXT.md L184 "Session Expiry: 24 hours (Inherited from Auth slice)" | CONFIRMED — NFR-AU2 locks 24h |

---

## Phase 1 — Audit Verdict

Phase 1 auth deliverables are **PDF-compliant**:
- Actor Classification with Primary/Supporting/Offstage (incl. all 4 consumer slices as Offstage)
- Traceability Heatmap with 0 forward orphans AND 0 reverse orphans (6 consumer dependencies all fulfilled)
- Persona Discovery with 3 personas, 8 hidden requirements (≥ 5 required)
- Consolidated 8 FRs + 11 NFRs ready for Phase 2 consumption
- Cross-slice consumer contract published — unblocks Members B, C, and Member D's own orders slice
