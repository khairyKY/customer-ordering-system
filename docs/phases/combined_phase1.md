# Phase 1 — Requirement Discovery & Traceability
## Team-Wide Combined Document

**Date:** 2026-05-13
**Curriculum Source:** `CSE323_Project_Overview.pdf` — Phase 1
**Scope:** Unified view of every team member's Phase 1 deliverables.

---

## Team Status

| Slice | Owner | Folder | Phase 1 Status |
|---|---|---|---|
| Checkout & Shopping Cart | **Member A** (Khairy) | `docs/requirements/member_a_*.md` + `docs/architecture_v2/` | ✅ Complete |
| Payment | **Member B** | `md/phase1/` | ✅ Complete |
| Tickets | **Member C** | `Phase 1/` (root) | ✅ Tickets complete |
| Auth & User Management | **Member D** | `docs/requirements/member_d_auth_phase1_requirements.md` | ✅ Phase 1 Complete (2026-05-13) |
| Admin & Order Fulfillment | **Member D** | `docs/requirements/member_d_*.md` | ✅ Complete (v2.1 cross-slice integrated) |

---

## Open Team-Coordination Issues

| # | Issue | Evidence | Resolution Required |
|---|---|---|---|
| ~~**C-1**~~ | ~~Auth slice ownership ambiguity.~~ **CLOSED 2026-05-16 — RESOLVED.** Auth is exclusively owned by **Member D** as part of their Python/FastAPI backend (alongside Admin & Orders). Member C owns **Tickets only**. All references to "Member C's auth" in `02f_API_CONTRACT.yaml` and `Phase3_04_vertical_slicing.md` are legacy errors and should be treated as pointing to **Member D's auth service** (which is how the code was always written). No re-pointing needed — the original code references were correct; only the narrative was wrong. | `md/phase3/Phase3_04_vertical_slicing.md` L77, L114; `Phase 2/02f_API_CONTRACT.yaml` L10, L38 | ✅ CLOSED — `.ai/CONTEXT.md` updated 2026-05-16 |
| **C-2** | Member B has two persona-discovery files with conflicting idempotency windows. `Phase1_PersonaDiscovery.md` says **60 seconds**; `Phase1_PersonaDiscovery_updated.md` says **300 seconds**. The latter is canonical. | `md/phase1/Phase1_PersonaDiscovery.md` L42; `..._updated.md` L48 | Archive the 60s version or annotate it as superseded. |

---

# §1 — Actor Classification (Combined)

Every slice classifies actors as **Primary** / **Supporting** / **Offstage** per the PDF taxonomy. Below are the four per-slice classifications, followed by a unified cross-slice actor index.

---

## 1.1 Checkout & Shopping Cart — Member A

*Source: `docs/requirements/requirements_report_member_a.md`*

| Actor | Classification | Rationale |
|---|---|---|
| **Customer** | Primary | Initiator of the checkout sequence; interacts directly with the Cart UI to achieve the business goal of purchasing items. |
| **Payment Gateway API** | Supporting | Provides the external service required to authorize transactions. The system cannot finalize the "Place Order" goal without its response. |
| **Kitchen/Fulfillment** | Offstage | Consumes the result of a successful checkout (Order Record) but does not interact with the Checkout system directly during the process. |
| **System Admin** | Offstage | Monitors transaction logs and manages promo codes; background maintenance role. |

---

## 1.2 Payment — Member B

*Source: `md/phase1/Phase1_ActorClassification.md`*

| Actor | Classification | Rationale |
|---|---|---|
| **Customer** | Primary | The initiator of the pay intent. Interacts with the UI to provide payment credentials and authorize the transfer of funds. |
| **Payment Gateway (Stripe)** | Supporting | Downstream external system that performs the actual credit-card validation and fund capture. The system acts as a Client to its API. |
| **Internal Database** | Supporting | Persists transaction logs, updates order status to `PAID`, and ensures atomicity (ACID) during checkout finalization. |
| **Accounting Dept.** | Offstage | Requires immutable transaction reports for end-of-month reconciliation. Relies on data integrity but does not interact directly with the flow. |
| **Tax Authorities** | Offstage | Passive stakeholders in the mandatory **10 % tax rate** calculation. The system must prove tax was correctly captured for every transaction. |

---

## 1.3 Tickets — Member C

> ⚠️ **OWNERSHIP CORRECTION (2026-05-16):** Member C owns **Tickets ONLY**. Auth & User Management is owned by **Member D**. Section header and S-2 actor note corrected below.

*Source: `Phase 1/01a_persona_and_actors.md` §2*

### Primary
| Actor | Initiates | Identity |
|---|---|---|
| **P-1 Customer (Alex)** | `POST /tickets`, `GET /tickets` | JWT `role: "customer"` |
| **P-2 Support Agent** | `GET /tickets/queue`, `PATCH /tickets/:id/status` | JWT `role: "agent"` |

### Supporting
| Actor | Service Provided | Failure Contract |
|---|---|---|
| **S-1 HuggingFace Sentiment API** | Sentiment score 0.0–1.0 mapped to LOW / MEDIUM / HIGH / CRITICAL | Timeout > 5,000 ms or HTTP error → fallback `MEDIUM` + `sentiment_source: "fallback"` |
| **S-2 Auth Service (JWT)** | Validated `{ user_id, role }` or HTTP 401 | **Member D's Auth Service** — consumed by Member C's ticket endpoints. The original correction note in this row was erroneous. Member D owns auth. |

### Offstage
| Actor | Role |
|---|---|
| **O-1 Ticket Database** | Persists `tickets` table; column widths (e.g. `body VARCHAR(2000)`) enforce EC-4 padlock |
| **O-2 Notification Queue** | Asynchronous fire-and-forget; consumes status-change events for downstream notification microservice |

---

## 1.4 Admin & Order Fulfillment — Member D

*Source: `docs/requirements/member_d_phase1_requirements.md` §1*

### Primary
| Actor | Initiating Action | Goal |
|---|---|---|
| **Admin Staff** | Logs into admin panel; triggers order list view, status updates, inventory edits | Maintain fulfillment pipeline integrity and stock accuracy |

### Supporting
| Actor | Service Provided | Owner |
|---|---|---|
| `protectRoute` / `adminGuard` Middleware | Validates JWT + `role === "admin"` claim | **Member D** (auth slice) — **we consume** |
| Order Database | Persists `Order` + `OrderItem`; serves read queries | Member A (checkout — schema authority) |
| Product Catalog Service | Provides product names, SKUs, stock | (was Member C; per re-ownership, may need new owner) |
| Payment Service | Emits `payment.success` events — drives `Order.status` PENDING → CONFIRMED | Member B (payment) |
| System Clock / Cron Scheduler | Triggers 15-min stale-pending sweep | Node runtime + our cron |

### Offstage
| Actor | Interest |
|---|---|
| Customer (Buyer) | Order data mutated by admin; status changes drive their shipping notifications |
| Member A's Checkout Service | Created the orders we now manage |
| Tax / Audit Authority | Every status change must be logged for compliance |
| Inventory Forecast / Reporting System | Downstream consumer of inventory updates |
| Finance System | Consumes order status transitions for revenue reconciliation |

---

## 1.5 Unified Cross-Slice Actor Index

Aggregating across all four slices. Each actor appears once with the strongest classification across slices.

| Actor | Strongest Classification | Slices Where Active |
|---|---|---|
| Customer | Primary | Checkout (purchase), Payment (pay), Tickets (file complaint) |
| Admin Staff | Primary | Orders (manage fulfillment) |
| Support Agent | Primary | Tickets (triage + resolve) |
| Payment Gateway (Stripe) | Supporting | Checkout, Payment |
| HuggingFace Sentiment API | Supporting | Tickets |
| Auth Service (JWT) | Supporting | All four (every slice mounts auth middleware) |
| Internal Database | Supporting | All four |
| Kitchen / Fulfillment | Offstage | Checkout |
| Tax Authorities | Offstage | Checkout, Payment, Orders |
| Accounting / Finance | Offstage | Payment, Orders |
| Notification Queue | Offstage | Tickets, Orders (status events) |
| Inventory Forecast | Offstage | Orders |

---

# §2 — Persona Discovery (Combined)

Each slice ran an "AI User" avatar (frustrated or malicious) to surface ≥ 5 hidden requirements per the PDF.

---

## 2.1 Checkout — Member A (5 Edge Cases)

*Source: `requirements_report_member_a.md` §2 + `member_a_edge_cases.md`*

| # | Persona | Edge Case | Padlock Requirement |
|---|---|---|---|
| 1 | Stale-Cart Ghost | Cart sits 20 min, inventory changes underneath | Backend must use Prisma Transaction to re-verify stock before decrementing; UI must intercept 409/400 and force cart refresh |
| 2 | Price-Hacker | Modifies `unitPrice` in localStorage before submission | Backend MUST ignore frontend price data; re-fetch current prices from DB during checkout validation |
| 3 | Desperate Double-Clicker | 5+ rapid clicks on "Place Order" during 3G lag | UI button state-locks + debounces; backend idempotency keys |
| 4 | Invalid Promo Injection | Applies expired or wrong-account promo | Server-side Zod validation against `expiresAt` and `isActive` |
| 5 | Address-Overflow Attack | Floods address fields to overflow DB or inject scripts | Strict Zod schema constraints on address field lengths + sanitization |

---

## 2.2 Payment — Member B (5 REQ_EC Padlocks)

*Source: `md/phase1/Phase1_PersonaDiscovery_updated.md` (canonical)*

Persona: *Malicious / Frustrated Student "Z"*

| ID | Persona Reasoning | Padlock |
|---|---|---|
| **REQ_EC_1** *Negative Amount Injection* | "Intercept the request and change `totalAmount` to `-50.00`; maybe the system credits my card." | Server-side Zod: `totalAmount > 0`; reject with HTTP 400 before any gateway communication. |
| **REQ_EC_2** *Double-Submission Button Mash* | "Use a macro to click 'Confirm' 50 times in one second." | Unique **Idempotency Key** per checkout session; duplicates within **300-second window** return cached result of first transaction. |
| **REQ_EC_3** *Cross-Tab Cart Tampering* | "Open Tab A with $10 burger; Tab B with $500 item; pay from Tab A." | Server-Side Snapshot Validation: re-calculate cart total from DB at payment time; reject if mismatch beyond ±$0.01. |
| **REQ_EC_4** *Promo Code Stack-Overflow* | "Apply a $50 student discount to a $5 cart; see if the total becomes -$45." | Non-Negative Floor: `Taxable_Subtotal = Max(0, Subtotal - Discount)`; final total clamped to $0.00, never negative. |
| **REQ_EC_5** *3D-Secure Ghost Redirect* | "Start payment, get 3D-Secure redirect, kill internet right at authorize click — order stays Pending forever." | Asynchronous Order Reconciler: any order in `PAYMENT_PENDING` for > **15 minutes** without webhook confirmation gets auto-cancelled; inventory released. |

---

## 2.3 Tickets — Member C (5 ECs from Persona "Alex")

*Source: `Phase 1/01b_edge_cases.md`*

Persona: *"Alex — The Anxious Shopper"* (5 mapped behaviours B-1…B-5 → 5 edge cases)

| ID | Attack Vector | System Failure Without Mitigation | Padlock |
|---|---|---|---|
| **EC-1** XSS / SQL Injection | `<script>` or SQL fragments in title/body | Stored XSS in agent triage view; potential DROP TABLE | DOMPurify sanitization + parameterized Prisma queries + Content-Type enforcement |
| **EC-2** Duplicate Submission Spam | 8–10 rapid `POST /tickets` calls | DB bloat; HuggingFace billable waste; agent queue flood | SHA-256 hash of `customer_id + title + body`; 10-min dedup window; 409 on match |
| **EC-3** HuggingFace API Timeout | External AI > 5,000 ms or 502 | Ticket silently dropped if save gated on AI | `AbortController` 5,000 ms timeout; guaranteed DB persist with `priority: MEDIUM`, `sentiment_source: "fallback"` |
| **EC-4** Extreme Payload Size | 50,000-char body | Node JSON parser OOM; HF 413 | `express.json({ limit: '10kb' })` + Zod field constraints (subject 5–120, body 10–2000) |
| **EC-5** Tokenizer Failure — Emoji Overload | Emoji-only body produces `NaN`/null score | Critical urgency mis-ranked as LOW | Score-validity guard → fallback `priority: MEDIUM`; `low_content` flag if alphanumeric < 5 after stripping emojis |

---

## 2.4 Orders — Member D (8 Hidden Requirements)

*Source: `docs/requirements/member_d_phase1_requirements.md` §3*

Two personas: **Frustrated Admin** (Sara, 500-order shift) + **Malicious Power-User** (insider with admin creds)

| ID | Persona | Hidden Requirement | Escalates To |
|---|---|---|---|
| HR-1 | Frustrated | Filter order list by `?status=` | FR-D1.b |
| HR-2 | Frustrated | Optimistic UI with rollback on failure | NFR-D1.b |
| HR-3 | Frustrated | Customer contact (email, phone) in order detail | FR-D3.b |
| HR-4 | Malicious | Stock = `Number.MAX_SAFE_INTEGER` | FR-D5.b — upper bound `stock ≤ 100,000` |
| HR-5 | Malicious | `PATCH .../status` with empty body `{}` | FR-D2.b — HTTP 400 |
| HR-6 | Malicious | Two admins race-update same order | NFR-D4.b — optimistic concurrency on `Order.updatedAt` (409) |
| HR-7 | Malicious | `DELETE /orders/:id` to wipe record | Design rule: no DELETE; soft-delete via `status = CANCELLED` |
| HR-8 | Malicious — Cross-Slice | Payment succeeded but our status-advance crashed; 15-min sweep then cancels the paid order | FR-D6.b + NFR-D5 (sweep checks `Payment.SUCCESS` first; idempotent advancement) |

---

# §3 — Traceability (Combined)

Each slice produced its own traceability matrix and certified zero orphans. Below is each matrix verbatim, followed by a system-wide cross-slice verification.

---

## 3.1 Checkout Traceability — Member A

*Source: `requirements_report_member_a.md` §3*

- **FE-01 (Cart Store):** Justified by User Story: "As a customer, I want to see my items before paying."
- **BE-01 (Checkout API):** Justified by Business Goal: "Process secure payments and create order records."
- **DB-01 (Prisma Models):** Justified by Data Integrity Requirement: "Order history must be immutable and snapshotted."

> Member A's traceability is narrative rather than tabular; the formal matrix is encoded in `docs/architecture_v2/07-checkout-feature-scope.md` and `09-sprint-roadmap-macro.md` (sprint exit criteria).

---

## 3.2 Payment Traceability — Member B

*Source: `md/phase1/Phase1_TraceabilityHeatmap.md` + `Phase1_TraceabilityMatrix_updated.md`*

### Functional Requirements
| ID | Feature | Justification |
|---|---|---|
| PAY-01 | Secure Credential Input | Security baseline (PCI-compliant masks) |
| PAY-02 | Tax Computation Engine | Legal compliance: `Total = Subtotal × 1.10` |
| PAY-03 | Promo Logic | Business logic: `Final = (Subtotal − Discount) × 1.10` |
| PAY-04 | Atomic Finalization | Data integrity — prevents Ghost Orders |

### REQ × Use Case Matrix
| REQ \\ UC | UC1 Card | UC2 COD | UC3 Promo | UC4 Summary | UC5 Failure |
|---|---|---|---|---|---|
| REQ1 Secure Card | ✅ | | | | ✅ |
| REQ2 10 % Tax | ✅ | ✅ | | ✅ | |
| REQ3 Promo Logic | | | ✅ | ✅ | ✅ |
| REQ4 Alt Payment (COD) | | ✅ | | | |
| REQ5 Atomicity | ✅ | ✅ | | | |

**Zero-orphan check:** ✅ All REQs covered by ≥ 1 UC; all UCs justified by ≥ 1 REQ.

---

## 3.3 Tickets Traceability — Member C

*Source: `Phase 1/01c_traceability_matrix.md`*

10 FRs/ECs × 10 TCs heatmap (P=Primary, R=Related):

|                                          | TC-01 | TC-02 | TC-03 | TC-04 | TC-05 | TC-06 | TC-07 | TC-08 | TC-09 | TC-10 |
|---|---|---|---|---|---|---|---|---|---|---|
| FR-01 Create Ticket                       | **P** | R | | | | R | R | R | R | R |
| FR-02 Sentiment Scoring                   | | **P** | | | | | | R | | R |
| FR-03 View Own Tickets                    | | | **P** | | | | | | | |
| FR-04 Agent Triage Queue                  | | | | **P** | R | | | | | |
| FR-05 Update Status                       | | | | | **P** | | | | | |
| EC-1 XSS / SQLi                           | | | | | | **P** | | | | |
| EC-2 Duplicate Submission                 | | | | | | | **P** | | | |
| EC-3 HF Timeout                           | | | | | | | | **P** | | |
| EC-4 Extreme Payload                      | | | | | | | | | **P** | |
| EC-5 Tokenizer Failure                    | | | | | | | | | | **P** |

**Coverage summary:** 5 FRs + 5 ECs + 10 TCs; **0 orphaned requirements, 0 orphaned test cases.**

---

## 3.4 Orders Traceability — Member D

*Source: `docs/requirements/member_d_traceability_heatmap.md`*

| BG | FR | NFR | Feature | Persona HR | Test |
|---|---|---|---|---|---|
| BG-1 Operational visibility | FR-D1, FR-D1.b, FR-D3, FR-D3.b | NFR-D1, NFR-D2 | `GET /orders`, `?status=`, `GET /orders/:id` | HR-1, HR-3 | T-D1.*, T-D3.* |
| BG-2 Fulfillment lifecycle | FR-D2, FR-D2.b, FR-D6, FR-D6.b | NFR-D2, NFR-D3, NFR-D4, NFR-D5 | `PATCH /orders/:id/status`, cron `sweepStalePending()`, `payment.success` handler | HR-5, HR-6, HR-7, HR-8 | T-D2.*, T-D6.* |
| BG-3 Inventory accuracy | FR-D4, FR-D5, FR-D5.b | NFR-D1, NFR-D2, NFR-D4 | `GET /inventory`, `PATCH /inventory/:id` | HR-4 | T-D4.*, T-D5.* |

**Orphan audit:** 0 orphans across 12 FRs (incl. sub-IDs), 7 NFRs, 8 HRs.

---

## 3.5 System-Wide Cross-Slice Traceability Check

| Cross-Slice Dependency | Producer | Consumer | Status |
|---|---|---|---|
| JWT contract (`role` claim) | **Member D** (auth) | Members A, B, C | ✅ Phase 1 complete — JWT contract locked per `member_d_auth_phase1_requirements.md` |
| `Authorization: Bearer <token>` header | **Member D** (auth) | All slices | ⚠️ Mock until middleware ships |
| `Order` + `OrderItem` Prisma models | Member A (checkout) | Member D (orders read), Member B (payment writes status on success) | ✅ Schema defined in `08-database-schema-checkout.md` |
| `Payment` + `PromoCode` Prisma models | Member B (payment) | Member D (orders reads for stale-pending sweep) | ✅ Phase 3 complete |
| `payment.success` logical event | Member B (payment) | Member D (orders) | ⚠️ Event transport unspecified (EventEmitter / queue / polling) — Member D's Phase 2 §5.4 codifies the consumer contract |
| `Product.stock` field write | (originally Member C catalog — re-ownership pending) | Member D (RFC-D001) | ⚠️ Blocker — RFC-D001 unapproved |
| 15-minute auto-cancel of `PAYMENT_PENDING` | Member B mandate (REQ_EC_5) | Member D implements | ✅ Codified as Member D's FR-D6 |
| 10 % global tax rate | Member B Phase 1 Log L181 | All slices | ✅ Settled — Global Mandate |

**Orphan check across slices:** every cross-slice dependency above has a documented producer AND consumer. **0 orphans.**

---

# §4 — Consolidated Functional & Non-Functional Requirements Index

| Slice | FR-IDs | NFR-IDs |
|---|---|---|
| Checkout | FE-01, BE-01, DB-01 | (encoded across sprint exit criteria in `09-sprint-roadmap-macro.md`) |
| Payment | PAY-01, PAY-02, PAY-03, PAY-04; REQ_EC_1..5; REQ1..5 (use-case matrix) | Performance (P95 < 200ms), Crypto (TLS 1.3 + AES-256-GCM), Uptime (99.9% w/ Circuit Breaker ×3) |
| Tickets | FR-01..05; EC-1..5 | P95 latency ≤ 1500 ms; Priority ENUM; JWT HS256 verified |
| Orders | FR-D1..D6 (+ .b variants); NFR-D1..D5 (+ .b variants); HR-1..HR-8 | 500ms p95 UI; admin-only JWT; audit logging; transition guards; idempotency |

---

# §5 — Outstanding Phase 1 Work

| Item | Owner | Blocker |
|---|---|---|
| ~~Auth slice Phase 1 docs~~ | ~~Member C~~ | **CLOSED** — Auth Phase 1 complete under Member D. See `docs/requirements/member_d_auth_phase1_requirements.md`. |
| Catalog slice | **Member A** | ✅ Ownership assigned 2026-05-16. Product mock data already functional in `productController.js`. |
| RFC-D001 approval (inventory cross-slice write) | **Member A** (catalog owner) | Member A must formally approve Member D's `PATCH /api/v1/inventory/:id` writing `Product.stock`. |

---

*End of Combined Phase 1 Document.*
