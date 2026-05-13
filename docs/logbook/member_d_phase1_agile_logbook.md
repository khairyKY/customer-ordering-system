# Agile Logbook — Phase 1: Requirement Discovery & Traceability
## Member D — Admin & Order Fulfillment

**Owner:** Member D
**Phase:** 1 — Requirement Discovery & Traceability
**Curriculum Source:** `CSE323_Project_Overview.pdf`
**Sprints in this phase:** 3 (Actor Classification → Traceability Heatmap → Persona Discovery)

---

## Sprint 1.1 — Actor Classification

**Date:** 2026-05-13
**Goal:** Classify every actor interacting with the Admin & Order Fulfillment slice using the PDF taxonomy (Primary / Supporting / Offstage).

### 1. Functional Requirements Addressed
- Indirectly establishes the *who* for FR-D1 through FR-D5
- Primary actor (Admin) identified as the initiator of every endpoint

### 2. Non-Functional Requirements Addressed
- **NFR-D2 (Security):** Supporting actor "JWT Auth Service" defines the security boundary
- **NFR-D3 (Auditability):** Offstage "Tax / Audit Authority" actor surfaces the audit-log requirement
- **NFR-D1 (Performance):** Offstage "Inventory Forecast / Reporting System" hints at downstream read patterns

### 3. Golden Prompts Used

```
PROMPT 1.1.a — Actor Discovery
─────────────────────────────────
Acting as a UML modeler for the CSE323 curriculum, identify every actor that
interacts with the Admin & Order Fulfillment slice of the Customer Ordering
System. For each actor, decide its category STRICTLY per UML actor taxonomy:

  - PRIMARY: actor that INITIATES the use case
  - SUPPORTING (secondary): actor that ASSISTS the primary during the use case
  - OFFSTAGE: actor AFFECTED BY the outcome but NOT present in the use case

For each actor, provide:
  - Category
  - Initiating action OR service provided OR interest in outcome
  - The team-member slice that owns them (if applicable)
```

```
PROMPT 1.1.b — Offstage Audit
─────────────────────────────────
Re-read your actor list. For each actor classified as Offstage, justify why
they belong there and what design constraint their interest imposes. If their
interest does NOT generate at least one NFR, they may not be a real actor.
```

### 4. Audits

| Check | Finding |
|---|---|
| PDF vocabulary compliance | ✅ Primary / Supporting / Offstage used exclusively |
| Every endpoint has a Primary actor | ✅ Admin |
| Every Supporting actor has a slice owner | ✅ Mapped: auth=B, checkout=A, catalog=C |
| Offstage actors generate at least one NFR | ✅ Audit Authority → NFR-D3 |
| **Defect vs v1** | v1 used non-standard "Primary / Secondary / Out-of-Scope" — corrected |

### 5. Folder Structure (Sprint 1.1 End)

```
customer-ordering-system/
└── docs/
    ├── requirements/
    │   ├── member_d_phase1_requirements_v1.md       [SUPERSEDED]
    │   ├── member_d_phase2_design_v1.md             [SUPERSEDED]
    │   ├── member_d_phase1_requirements.md          [§1 Actor Classification ✅]
    │   └── ...                                       [other sections pending]
    └── logbook/
        └── member_d_phase1_agile_logbook.md         [Sprint 1.1 ✅]
```

---

## Sprint 1.2 — Traceability Heatmap

**Date:** 2026-05-13
**Goal:** Construct a backward-and-forward traceable matrix that mathematically justifies every feature with zero orphans.

### 1. Functional Requirements Addressed
All FR-D1 through FR-D5 (and sub-IDs FR-D1.b, FR-D2.b, FR-D3.b, FR-D5.b) mapped to:
- Business Goals (BG-1, BG-2, BG-3)
- Features (5 endpoints)
- Test IDs (T-D1.* through T-D5.*)

### 2. Non-Functional Requirements Addressed
NFR-D1, NFR-D1.b, NFR-D2, NFR-D3, NFR-D4, NFR-D4.b indexed and cross-tabbed against features.

### 3. Golden Prompts Used

```
PROMPT 1.2.a — Heatmap Construction
─────────────────────────────────
Construct a traceability matrix for the Admin & Order Fulfillment slice that:

1. Lists every Business Goal (BG)
2. Lists every Functional Requirement (FR) under it
3. Lists every Non-Functional Requirement (NFR) it touches
4. Lists the Feature/Endpoint that satisfies it
5. Lists the Test ID(s) that verify it

The matrix is REJECTED if any row has a missing cell or any test references an FR not in the table.
```

```
PROMPT 1.2.b — Orphan Audit
─────────────────────────────────
Now audit the matrix in both directions:
- Backward: every Test must trace to an FR; every FR must trace to a BG.
- Forward: every BG must yield at least one FR; every FR must yield at least one Feature; every Feature must yield at least one Test.

Report orphans by ID. Zero orphans is the exit criterion.
```

### 4. Audits

| Check | Finding |
|---|---|
| Backward trace complete | ✅ |
| Forward trace complete | ✅ |
| NFR coverage cross-tab | ✅ |
| Cross-slice dependencies flagged | ✅ RFC-D001 (catalog), Member B JWT, Member A schema |
| **Total orphans** | **0** |
| **Defect vs v1** | v1 had no heatmap whatsoever — produced from scratch |

### 5. Folder Structure (Sprint 1.2 End)

```
customer-ordering-system/
└── docs/
    ├── requirements/
    │   ├── member_d_phase1_requirements_v1.md       [SUPERSEDED]
    │   ├── member_d_phase2_design_v1.md             [SUPERSEDED]
    │   ├── member_d_phase1_requirements.md          [§1-§2 ✅]
    │   └── member_d_traceability_heatmap.md         [NEW ✅]
    └── logbook/
        └── member_d_phase1_agile_logbook.md         [Sprint 1.2 ✅]
```

---

## Sprint 1.3 — Persona Discovery

**Date:** 2026-05-13
**Goal:** Run the "AI User" avatar as two personas (frustrated + malicious) to surface ≥ 5 hidden requirements per PDF directive.

### 1. Functional Requirements Addressed
New sub-requirements added to the FR index as a direct result of persona output:
- **FR-D1.b** — filter orders by `?status=`
- **FR-D2.b** — empty-body guard on status update
- **FR-D3.b** — customer contact info in order detail
- **FR-D5.b** — upper bound `stock ≤ 100,000`

### 2. Non-Functional Requirements Addressed
- **NFR-D1.b** — optimistic UI with rollback
- **NFR-D4.b** — optimistic concurrency on `Order.updatedAt`
- Design rule (no DELETE endpoint exposed)

### 3. Golden Prompts Used

```
PROMPT 1.3.a — Frustrated Admin Persona
─────────────────────────────────
You are "Sara", a frustrated admin supervisor at peak shift. You manage 500+
active orders. You are tired, time-pressured, and click-prone. Walk through
the planned API and the planned admin UI. For each step that frustrates you,
explain WHY and what feature or behavior would have prevented the frustration.

Constraint: surface AT LEAST 3 unique frustrations that the current FR/NFR
inventory does NOT yet address.
```

```
PROMPT 1.3.b — Malicious Power-User Persona
─────────────────────────────────
You are an insider with valid admin credentials. Your goal is to corrupt
order data, bypass business rules, or escalate privilege without getting
caught. For each planned endpoint, enumerate every attack vector you would
try. For each vector, identify the smallest change to the API that would
block it.

Constraint: surface AT LEAST 3 attacks that the current FR/NFR inventory does
NOT yet defend against. Do NOT duplicate the obvious 401/403 cases.
```

```
PROMPT 1.3.c — Hidden Requirement Escalation
─────────────────────────────────
For each frustration AND each attack you surfaced, decide whether it becomes:
  (a) a new FR (functional capability)
  (b) a new NFR (quality attribute)
  (c) a new design rule (architectural constraint)
Reject any persona finding that does not escalate cleanly to one of these.
```

### 4. Audits

| Check | Finding |
|---|---|
| ≥ 5 hidden requirements (PDF minimum) | ✅ 7 produced |
| Two distinct personas executed | ✅ Sara (Frustrated) + Insider (Malicious) |
| Every HR escalates to FR/NFR/Design Rule | ✅ — see heatmap §4 |
| No duplication of already-known requirements | ✅ — verified against pre-persona FR list |
| **Defect vs v1** | v1 produced HTTP-error-style edge cases (NEG-1..NEG-7), not persona-driven Hidden Requirements. v1 was a security-rules exercise; v2 is the curriculum-mandated persona exercise. |

### 5. Folder Structure (Sprint 1.3 End — Phase 1 COMPLETE)

```
customer-ordering-system/
└── docs/
    ├── requirements/
    │   ├── member_d_phase1_requirements_v1.md       [SUPERSEDED]
    │   ├── member_d_phase2_design_v1.md             [SUPERSEDED]
    │   ├── member_d_phase1_requirements.md          [FULL ✅]
    │   └── member_d_traceability_heatmap.md         [FULL ✅]
    └── logbook/
        └── member_d_phase1_agile_logbook.md         [Phase 1 COMPLETE ✅]
```

---

## Audit & Fixes Log (v1 → v2 Defects)

This section is required by the curriculum-redo directive. It enumerates every defect found in v1 work and the v2 fix.

| # | v1 Defect | Root Cause | v2 Fix |
|---|---|---|---|
| **AF-1** | Actor vocabulary used "Primary / Secondary / Out-of-Scope" | Followed `EJUST_CURRICULUM_SUMMARY.md` rather than authoritative `CSE323_Project_Overview.pdf` | Replaced with PDF taxonomy: Primary / Supporting / Offstage. New table in §1 of corrected Phase 1 doc. |
| **AF-2** | Traceability Heatmap was absent | Treated as optional; PDF mandates it | Created `member_d_traceability_heatmap.md` with full backward + forward trace, 0 orphans |
| **AF-3** | Edge cases framed as "NEG-1..NEG-7" — pure HTTP-status checks | Mixed Phase 1 (requirement discovery) with Phase 3 (test enumeration) | Reframed as Persona Discovery with Hidden Requirements (HR-1..HR-7). Each HR escalates to a new FR / NFR / design rule. |
| **AF-4** | Ambiguity Audit was placed in Phase 1 | Misread the curriculum split | Moved to Phase 2 §2 "The Refinement Loop" per PDF |
| **AF-5** | Only one Primary actor identified; no Offstage actors recognized | Did not appreciate that affected-but-absent actors impose design constraints | Added 4 Offstage actors (Customer, Checkout Service, Tax Authority, Forecast System). Each generates ≥1 NFR. |
| **AF-6** | Did not split FRs into base + persona-extension sub-IDs | Persona work was not yet done, so no escalation existed | New sub-IDs added: FR-D1.b, FR-D2.b, FR-D3.b, FR-D5.b; NFR-D1.b, NFR-D4.b |

### Audit Verdict
Phase 1 redo is **PDF-compliant**. All 6 defects closed. Heatmap shows 0 orphans. Persona exercise exceeded minimum (7 vs required 5).

---

## Sprint 1.4 — Cross-Slice Integration (post-pull)

**Date:** 2026-05-13
**Goal:** After pulling teammate work (Member A checkout Sprints 1-2 ✅; Member B payment Phase 3 ✅, auth Phase 1 in progress), integrate their published artifacts into our Phase 1 requirements.

### 1. Functional Requirements Added
- **FR-D6** — System cron auto-cancels orders stuck in `PENDING` for > 15 minutes (sourced from Member B's REQ_EC_5 Zombie Recovery)
- **FR-D6.b** — Sweep checks `Payment.status === "SUCCESS"` first; if found, advance to CONFIRMED (closes HR-8)

### 2. Non-Functional Requirements Added / Modified
- **NFR-D5** — Idempotent status advancement (modeled after Member B's idempotency padlock: 300s window, UUID key)
- **NFR-D3** (Auditability) — *Reinforced*: every system-driven transition writes `actor: "system"` in the audit log; admin-driven uses admin user ID
- Removed blocker: Tax rate ambiguity (10% Global Mandate per Member B Phase 1 Log L181)

### 3. Golden Prompts Used

```
PROMPT 1.4.a — Teammate Artifact Survey
─────────────────────────────────
Read every section of .ai/CONTEXT.md committed by Members A, B, C since our
last sync. For each of their published artifacts, decide:
  (a) Does it create a new dependency on our slice?
  (b) Does it create a new dependency FROM our slice?
  (c) Does it resolve any of our open blockers?
  (d) Does it surface a hidden requirement we missed in Sprint 1.3?
Report findings as a table. Do not modify our docs yet.
```

```
PROMPT 1.4.b — Cross-Slice Failure-Mode Discovery
─────────────────────────────────
For each new cross-slice dependency surfaced in 1.4.a, imagine a failure mode
where ONE side succeeds and the OTHER side crashes or replays. List the worst
customer-visible outcome. Convert each outcome into a Hidden Requirement
following the HR-x convention from Sprint 1.3.
```

```
PROMPT 1.4.c — Boundary Lock-Down
─────────────────────────────────
Produce a Cross-Slice Coordination Map listing every Prisma model, middleware,
and logical event our slice touches. For each, state:
  - Owner slice
  - How we interact (read / write / consume-event / mount-middleware)
  - Status (resolved / pending RFC / mock-until-shipped)
```

### 4. Audits

| Check | Finding |
|---|---|
| All teammate Phase 1+3 commits read | ✅ Member A persona doc + req report; Member B payment Phase 1+3 logs in CONTEXT.md |
| Every new dependency mapped in §1.4 of Phase 1 doc | ✅ 7 cross-slice resources documented |
| Every cross-slice failure mode escalated to FR/NFR | ✅ HR-8 produced; FR-D6.b + NFR-D5 added |
| Tax rate blocker reconciled | ✅ Closed — 10% Global Mandate confirmed |
| `protectRoute` ownership confirmed | ✅ Member B (auth slice). Our slice CONSUMES, does not build. CONTEXT.md L211 wording is mislabeled. |
| Member B's REQ_EC_5 absorbed into our scope | ✅ Cron `sweepStalePending()` is ours to implement |
| **Defect vs pre-pull v2** | Pre-pull v2 was PDF-compliant but slice-isolated. Sprint 1.4 makes it integration-ready. |

### 5. Folder Structure (Sprint 1.4 End — Phase 1 v2.1 COMPLETE)

```
customer-ordering-system/
└── docs/
    ├── requirements/
    │   ├── member_a_edge_cases.md                   [Member A's persona work]
    │   ├── requirements_report_member_a.md          [Member A's Phase 1 report]
    │   ├── member_d_phase1_requirements_v1.md       [SUPERSEDED]
    │   ├── member_d_phase2_design_v1.md             [SUPERSEDED]
    │   ├── member_d_phase1_requirements.md          [Phase 1 v2.1 ✅ — integrated]
    │   ├── member_d_phase2_design.md                [Phase 2 v2.1 — pending Sprint 2.5]
    │   └── member_d_traceability_heatmap.md         [✅ — integrated]
    └── logbook/
        ├── member_d_phase1_agile_logbook.md         [Phase 1 v2.1 COMPLETE ✅]
        └── member_d_phase2_agile_logbook.md         [Phase 2 v2 — Sprint 2.5 pending]
```

---

## Audit & Fixes Log — Phase 1 v2 → v2.1 (Cross-Slice Integration)

| # | Issue Identified | Source | Fix Applied |
|---|---|---|---|
| **AF-7** | Supporting Actor "JWT Auth Service" was generic | CONTEXT.md L211 references `protectRoute` middleware as Member B's auth-slice deliverable | Renamed to `protectRoute` / `adminGuard` middleware; ownership Member B; noted "we consume, do not build" |
| **AF-8** | Payment Gateway and Payment Service not listed as actors | Member B published payment slice (CONTEXT.md L156–213) | Payment Service added as Supporting Actor; transitive — emits events that drive our transitions |
| **AF-9** | Finance System actor missing | Member B Phase 1 Log L169 declares Finance System as Offstage in their slice | Added to our Offstage actors (we generate the data they reconcile) |
| **AF-10** | No system-initiated transition path | Member B REQ_EC_5 requires 15-min auto-cancel | FR-D6, FR-D6.b added; cron implementation in our scope |
| **AF-11** | Cross-slice failure mode (paid-but-cancelled) not covered | Surfaced via Sprint 1.4 prompt B | HR-8 added; FR-D6.b + NFR-D5 close it |
| **AF-12** | Tax rate ambiguity flag still showing in some docs | Member B confirmed 10% as Global Mandate | Closed; removed from blockers |
| **AF-13** | No formal Cross-Slice Coordination Map | Architecture rule requires explicit cross-slice boundaries | Added §1.4 to Phase 1 doc with full resource → owner → interaction table |
