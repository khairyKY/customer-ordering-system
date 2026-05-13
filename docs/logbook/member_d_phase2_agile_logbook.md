# Agile Logbook — Phase 2: Design & Specification
## Member D — Admin & Order Fulfillment

**Owner:** Member D
**Phase:** 2 — Design & Specification
**Curriculum Source:** `CSE323_Project_Overview.pdf`
**Sprints in this phase:** 4 (Gherkin Scripting → Refinement Loop → UML Modeling → Information Hiding)

---

## Sprint 2.1 — Gherkin Scripting

**Date:** 2026-05-13
**Goal:** Translate every Phase 1 FR (base + persona sub-requirements) into structured Given/When/Then scenarios.

### 1. Functional Requirements Addressed
- FR-D1, FR-D1.b → Story D-1 (2 scenarios)
- FR-D2, FR-D2.b → Story D-2 (2 scenarios)
- FR-D3, FR-D3.b → Story D-3 (1 scenario covering both)
- FR-D4         → Story D-4 (1 scenario)
- FR-D5, FR-D5.b → Story D-5 (2 scenarios)

### 2. Non-Functional Requirements Addressed
- NFR-D2 (security) — every scenario opens with `Given I hold a JWT with claim role = "admin"`
- NFR-D1 (performance) — implicit in 500ms criteria; explicitly tested via Playwright in Phase 4

### 3. Golden Prompts Used

```
PROMPT 2.1.a — Gherkin Generation
─────────────────────────────────
For each Functional Requirement in `member_d_phase1_requirements.md` §4, write
a Gherkin scenario in strict Given/When/Then format that:

1. Uses schema-accurate field names from Member A's Prisma `Order`/`OrderItem` models
2. Specifies HTTP method, path, body, expected status code, AND expected response shape
3. Names a concrete actor identity (e.g., "Admin with JWT") — no generic "user"
4. Contains zero subjective adjectives — only measurable assertions

If a scenario uses a vague word (fast, secure, easily, etc.) it MUST be rewritten before exiting this sprint.
```

```
PROMPT 2.1.b — Persona Sub-Requirement Coverage
─────────────────────────────────
For each Hidden Requirement (HR-1 through HR-7) in the Phase 1 doc, add a
Gherkin scenario that exercises it. The scenario must reference the HR-ID
in a comment so backward traceability is preserved.
```

### 4. Audits

| Check | Finding |
|---|---|
| Every FR has ≥ 1 Gherkin scenario | ✅ |
| Every persona HR is exercised by a scenario | ✅ HR-1→D-1 filter; HR-3→D-3 customer contact; HR-4→D-5 upper bound; HR-5→D-2 empty body |
| All scenarios use schema-accurate field names | ✅ matches `08-database-schema-checkout.md` |
| No subjective adjectives in scenarios | ✅ swept for: fast, secure, easily, soon, properly |

### 5. Folder Structure (Sprint 2.1 End)

```
customer-ordering-system/
└── docs/
    ├── requirements/
    │   ├── member_d_phase1_requirements_v1.md
    │   ├── member_d_phase2_design_v1.md
    │   ├── member_d_phase1_requirements.md          [Phase 1 ✅]
    │   ├── member_d_phase2_design.md                [§1 Gherkin ✅]
    │   └── member_d_traceability_heatmap.md         [Phase 1 ✅]
    └── logbook/
        ├── member_d_phase1_agile_logbook.md         [Phase 1 ✅]
        └── member_d_phase2_agile_logbook.md         [Sprint 2.1 ✅]
```

---

## Sprint 2.2 — The Refinement Loop (Senior QA Audit)

**Date:** 2026-05-13
**Goal:** Conduct the Senior QA Audit — eliminate every unquantifiable adjective from requirements, design, and Gherkin; replace with measurable metrics.

### 1. Functional Requirements Addressed
None added; this sprint **hardens** existing FRs by removing ambiguity from their acceptance criteria.

### 2. Non-Functional Requirements Addressed
- NFR-D1 (performance) — "fast" → `< 500ms p95`
- NFR-D2 (security) — "secure" → JWT in `Authorization` + `role === "admin"`
- NFR-D4 (data integrity) — "race-safe" → optimistic concurrency w/ `If-Match` header
- All NFRs are now mechanically testable

### 3. Golden Prompts Used

```
PROMPT 2.2.a — Adjective Hunter (Senior QA Role)
─────────────────────────────────
Acting as a Senior QA Engineer reviewing requirements before signoff: scan
every requirement, every Gherkin scenario, and every design note for the
slice "orders". List every UNQUANTIFIABLE adjective you find (e.g., "fast",
"secure", "low-stock", "soon", "responsive", "intuitive").

For each finding, propose a MEASURABLE replacement that:
  - Is a concrete number, regex, schema, or comparison
  - Can be verified by code (test or assertion)
  - Names the verification mechanism (Vitest? Playwright? Supertest?)
```

```
PROMPT 2.2.b — Banned-Word List
─────────────────────────────────
Now produce a banned-word list. These words are forbidden in tests, code
comments, PR descriptions, and future requirements docs unless paired with
a measurable substitute. Minimum 15 words.
```

### 4. Audits

| Check | Finding |
|---|---|
| Vague terms replaced with measurable metrics | ✅ 8 terms refined; see Phase 2 doc §2 |
| Each replacement names a verification mechanism | ✅ Vitest / Playwright / Supertest each cited |
| Banned-word list produced | ✅ 18 words |
| **Defect vs v1** | v1 placed the ambiguity audit in Phase 1, mis-attributing it. v2 relocates it here per PDF and expands from 6 terms to 8 with explicit verification mechanisms. |

### 5. Folder Structure (Sprint 2.2 End)

```
customer-ordering-system/
└── docs/
    ├── requirements/
    │   ├── member_d_phase1_requirements_v1.md
    │   ├── member_d_phase2_design_v1.md
    │   ├── member_d_phase1_requirements.md          [Phase 1 ✅]
    │   ├── member_d_phase2_design.md                [§1-§2 ✅]
    │   └── member_d_traceability_heatmap.md
    └── logbook/
        ├── member_d_phase1_agile_logbook.md
        └── member_d_phase2_agile_logbook.md         [Sprint 2.2 ✅]
```

---

## Sprint 2.3 — UML Modeling (SSDs + Activity Diagrams)

**Date:** 2026-05-13
**Goal:** Produce System Sequence Diagrams (happy + failure paths) AND Activity Diagrams (with code decision points) per PDF.

### 1. Functional Requirements Addressed
Every FR gets at least one SSD and at least one Activity Diagram path.

### 2. Non-Functional Requirements Addressed
- NFR-D2 — JWT validation rendered as the first decision diamond in every Activity Diagram
- NFR-D4 — Status transition decision rendered explicitly in SSD-D2 and Activity Diagram §4.1

### 3. Golden Prompts Used

```
PROMPT 2.3.a — SSD Generator
─────────────────────────────────
For each endpoint in `member_d_phase2_design.md` §5 (the public contract),
produce a text-based System Sequence Diagram showing every message exchanged
between:
  Admin Browser → Express Router → adminGuard middleware → Zod schema
                → Service → Store

For each endpoint, produce BOTH the happy path AND the dominant failure path.
For PATCH endpoints, produce all failure paths matching the error-code column
in the API contract.
```

```
PROMPT 2.3.b — Activity Diagram Generator (Code Decision Points)
─────────────────────────────────
For the two most complex endpoints (PATCH status, PATCH inventory), produce
an Activity Diagram in ASCII. Each decision diamond must:
  - Express the boolean check as a question
  - Branch to a labeled No/Yes path
  - Reference the EXACT code location that implements the check
    (file + function name)

The diagram is invalid if any decision diamond cannot be mapped to a single
line of source code.
```

### 4. Audits

| Check | Finding |
|---|---|
| Every endpoint has an SSD | ✅ 4 SSDs covering 5 endpoints |
| SSDs include both happy AND failure paths | ✅ Failure paths drawn for 401, 403, 404, 422, 400 |
| Activity Diagrams produced for complex flows | ✅ §4.1 status update, §4.2 inventory update |
| Every decision diamond maps to a code location | ✅ `adminGuard`, `zodParse`, `findById`, `validateTransition` |
| **Defect vs v1** | v1 had SSDs but **completely omitted Activity Diagrams**. v2 adds two with code-decision-point mapping per PDF directive. |

### 5. Folder Structure (Sprint 2.3 End)

```
customer-ordering-system/
└── docs/
    ├── requirements/
    │   ├── member_d_phase1_requirements_v1.md
    │   ├── member_d_phase2_design_v1.md
    │   ├── member_d_phase1_requirements.md
    │   ├── member_d_phase2_design.md                [§1-§4 ✅]
    │   └── member_d_traceability_heatmap.md
    └── logbook/
        ├── member_d_phase1_agile_logbook.md
        └── member_d_phase2_agile_logbook.md         [Sprint 2.3 ✅]
```

---

## Sprint 2.4 — Information Hiding

**Date:** 2026-05-13
**Goal:** Formalize which part of the slice is contract (visible) vs. implementation (hidden) per PDF directive.

### 1. Functional Requirements Addressed
No new FRs. This sprint **classifies** every FR as belonging to the public contract.

### 2. Non-Functional Requirements Addressed
- **NFR-D2 (security)** — auth headers are public contract
- **NFR-D5 (maintainability — implicit)** — implementation choices (store, framework, audit-log backend) are hidden so they can change without coordination tax

### 3. Golden Prompts Used

```
PROMPT 2.4.a — Public/Private Partition
─────────────────────────────────
List every behavior, type, and value of the orders slice. For each, classify:

  PUBLIC: teammates and AI tools MAY depend on this
  HIDDEN: implementation detail, free to change without notifying anyone

The PUBLIC set is the contract. The HIDDEN set is what makes the slice
swappable. Both sets must be exhaustive and disjoint.

Rule: error message *wording* is hidden; error *status code* is public.
Rule: storage choice (in-memory vs Prisma) is hidden; pagination *shape*
({page, limit, totalCount, totalPages}) is public.
```

```
PROMPT 2.4.b — Consumption Rules
─────────────────────────────────
For each other teammate (Member A, B, C, and the frontend), state:
  - What they ARE allowed to import/call from the orders slice
  - What they are FORBIDDEN from depending on

Any violation should be a blocking PR review issue.
```

### 4. Audits

| Check | Finding |
|---|---|
| Public contract enumerated | ✅ 5 endpoints with full schema |
| Hidden details enumerated | ✅ 7 items (store, matrix, audit-log, pagination algo, message text, timestamp precision, framework) |
| Consumption rules per teammate | ✅ 4 rules (A, B, C, frontend) |
| Cross-slice violations marked as blocking PR review | ✅ — references `05-git-and-branching-rules.md` |
| **Defect vs v1** | v1 had an API contract table but did not frame it under information-hiding principles, leaving teammates free to depend on implementation details. v2 explicitly partitions public vs hidden and adds consumption rules. |

### 5. Folder Structure (Sprint 2.4 End — Phase 2 COMPLETE)

```
customer-ordering-system/
└── docs/
    ├── requirements/
    │   ├── member_d_phase1_requirements_v1.md       [SUPERSEDED]
    │   ├── member_d_phase2_design_v1.md             [SUPERSEDED]
    │   ├── member_d_phase1_requirements.md          [Phase 1 ✅]
    │   ├── member_d_phase2_design.md                [Phase 2 ✅ COMPLETE]
    │   └── member_d_traceability_heatmap.md         [Phase 1 ✅]
    └── logbook/
        ├── member_d_phase1_agile_logbook.md         [Phase 1 ✅]
        └── member_d_phase2_agile_logbook.md         [Phase 2 ✅ COMPLETE]
```

---

## Audit & Fixes Log (v1 → v2 Defects)

| # | v1 Defect | Root Cause | v2 Fix |
|---|---|---|---|
| **AF-1** | Ambiguity Audit was placed in Phase 1 | Followed `EJUST_CURRICULUM_SUMMARY.md`, not the authoritative PDF | Relocated to Phase 2 §2 "The Refinement Loop" |
| **AF-2** | Activity Diagrams completely absent | v1 only produced SSDs; missed the second UML deliverable | Added §4 with two diagrams (status update, inventory update), each with code-decision-point mapping |
| **AF-3** | API contract not framed under Information Hiding | Treated contract as a flat reference table | Reframed in §5 as PUBLIC vs HIDDEN partition with explicit consumption rules per teammate |
| **AF-4** | Refined Gherkin originated in Phase 1 then was "re-refined" in Phase 2 | Out-of-order workflow — Gherkin was duplicated work | v2 keeps Phase 1 as FR/NFR identification (no Gherkin); Phase 2 §1 is where Gherkin originates |
| **AF-5** | Banned-word list not produced | Refinement Loop stopped after audit table | v2 §2.1 produces an 18-word banned list applicable to Phase 3 tests |
| **AF-6** | Persona-driven Gherkin sub-scenarios missing (HR-1, HR-4, HR-5 had no scenarios) | Persona work was not yet done in v1 | v2 adds scenarios for HR-1 (filter), HR-4 (upper bound), HR-5 (empty body) |
| **AF-7** | No "code-decision-point" mapping anywhere | PDF explicitly requires it for Activity Diagrams | v2 §4 maps every diamond to a function/middleware location |

### Audit Verdict
Phase 2 redo is **PDF-compliant**. All 7 defects closed. SSDs + Activity Diagrams both present. Information Hiding explicit. Ready for Phase 3 TDP.

---

## Sprint 2.5 — Cross-Slice Integration (post-pull)

**Date:** 2026-05-13
**Goal:** Refresh the Phase 2 design artifacts to reflect post-pull reality — Member A checkout shipped, Member B payment shipped (Phase 3 complete), Member B auth in Phase 1 — and document the integration contracts.

### 1. Functional Requirements Addressed
- **FR-D6** — Story D-6 (Gherkin) authored; SSD-D6 drawn; transition matrix updated
- **FR-D6.b** — Second Gherkin scenario in D-6 (paid-stale-order advances to CONFIRMED)
- **NFR-D5** — Third Gherkin scenario in D-6 (idempotent re-runs)

### 2. Non-Functional Requirements Addressed
- **NFR-D5** — Idempotency contract codified in §5.4 Cross-Slice Event Contract
- **NFR-D3** — Audit log shape extended with `actor: "system" | <userId>` distinction

### 3. Golden Prompts Used

```
PROMPT 2.5.a — Story D-6 Gherkin Generation (Senior QA Role)
─────────────────────────────────
For FR-D6 and FR-D6.b, write Gherkin scenarios that exercise:
  (a) the happy path (stale PENDING with no successful Payment → CANCELLED)
  (b) the cross-slice rescue path (stale PENDING WITH successful Payment → CONFIRMED, NOT cancelled — closes HR-8)
  (c) idempotency (second sweep run is a no-op for already-processed orders)

Use frozen-clock language ("placedAt is 16 minutes before NOW") and reference
the actor as "system" — NOT admin. Time constants must match Member B's
REQ_EC_5: 15-minute window.
```

```
PROMPT 2.5.b — SSD for System-Initiated Flow
─────────────────────────────────
Draw an SSD for the cron-triggered sweepStalePending() flow. The diagram must:
  - Start from the NODE-CRON tick, NOT from an HTTP request
  - Show the cross-slice READ to Member B's Payment table
  - Branch the flow on Payment.status === "SUCCESS" vs not
  - Show audit log writes with actor = "system"
  - Note the idempotency property (second run = no-op)
```

```
PROMPT 2.5.c — Status Transition Matrix Initiator Dimension
─────────────────────────────────
Extend the 7×7 status transition matrix with a new dimension: who may legally
INITIATE each transition. Categories: Admin (manual), System (cron), Payment
Event (subscriber). For each legal transition in the existing matrix, mark
which initiator(s) are permitted. The new System initiator only exists on:
  - PENDING → CANCELLED  (15-min sweep, no payment)
  - PENDING → CONFIRMED  (15-min sweep, successful payment OR payment.success event)
```

```
PROMPT 2.5.d — Cross-Slice Event Contract
─────────────────────────────────
Define the public contract for the `payment.success` logical event:
  - Payload shape (with field types)
  - Producer (Member B's payment slice)
  - Consumer behavior in our slice
  - Idempotency guarantee + replay window
  - Reordering safety (what if sweep ran first?)
The TRANSPORT mechanism (EventEmitter / Prisma trigger / queue) must be
declared HIDDEN.
```

### 4. Audits

| Check | Finding |
|---|---|
| Story D-6 authored with 3 scenarios | ✅ happy + HR-8 close + NFR-D5 idempotency |
| SSD-D6 drawn for system-initiated flow | ✅ cron entry point, cross-slice Payment read, dual branch |
| Transition matrix Initiator column added | ✅ §3.1; only PENDING transitions allow System initiator |
| §5.4 Event Contract specifies payload + guarantees | ✅ idempotency + reordering covered |
| Refinement Loop entries for "stale" and "idempotent" added | ✅ §2 table extended from 7 to 10 rows |
| Hidden vs Public partition holds for event transport | ✅ payload public, transport hidden |
| **Coordination with Member B's published API** | ✅ Their `POST /api/payment/process` is the source of the event we consume |
| **Defect vs pre-pull v2** | v2 was correct but assumed isolated implementation. v2.1 makes our slice composable with Member B's Phase 3 deliverable. |

### 5. Folder Structure (Sprint 2.5 End — Phase 2 v2.1 COMPLETE)

```
customer-ordering-system/
└── docs/
    ├── requirements/
    │   ├── member_a_edge_cases.md
    │   ├── requirements_report_member_a.md
    │   ├── member_d_phase1_requirements_v1.md       [SUPERSEDED]
    │   ├── member_d_phase2_design_v1.md             [SUPERSEDED]
    │   ├── member_d_phase1_requirements.md          [Phase 1 v2.1 ✅]
    │   ├── member_d_phase2_design.md                [Phase 2 v2.1 ✅ COMPLETE]
    │   └── member_d_traceability_heatmap.md         [✅ — integrated]
    └── logbook/
        ├── member_d_phase1_agile_logbook.md         [Phase 1 v2.1 ✅]
        └── member_d_phase2_agile_logbook.md         [Phase 2 v2.1 ✅ COMPLETE]
```

---

## Audit & Fixes Log — Phase 2 v2 → v2.1 (Cross-Slice Integration)

| # | Issue Identified | Source | Fix Applied |
|---|---|---|---|
| **AF-8** | Story D-6 missing | New FR-D6 / FR-D6.b from Phase 1 Sprint 1.4 | Added 3-scenario Gherkin block after Story D-5 |
| **AF-9** | SSD-D6 missing for cron-initiated flow | New system-initiated transition path | Added SSD-D6 showing cron entry, cross-slice Payment read, dual-branch outcome |
| **AF-10** | Transition matrix lacked Initiator dimension | Admin and System now both legal initiators of some transitions | Added §3.1 with Initiator column (Admin / System / Payment Event) |
| **AF-11** | Refinement Loop missing "stale" and "idempotent" entries | New vocabulary from Member B's REQ_EC_5 + idempotency padlock | Added 2 rows to §2 ambiguity table with verification mechanisms |
| **AF-12** | Information Hiding §5.3 listed only auth consumption from Member B | Member B's payment slice introduces new event-based contract | Renamed/expanded row; added new row for payment-event consumption; added §5.4 with full event contract |
| **AF-13** | No explicit reordering-safety statement | Cross-slice event ordering is non-deterministic | Added explicit "what if sweep ran first?" handling clause to §5.4 |
| **AF-14** | Exit Criteria undercounted scenarios | After adding D-6, totals are 6 stories, 10 vague terms, 5 SSDs | Updated §6 checklist counts |
