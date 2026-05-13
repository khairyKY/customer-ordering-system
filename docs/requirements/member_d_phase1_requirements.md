# Phase 1: Requirement Discovery & Traceability
## Member D — Admin & Order Fulfillment

**Date:** 2026-05-13
**Slice:** `orders`
**Owner:** Member D
**Curriculum Source:** `CSE323_Project_Overview.pdf` — Phase 1
**Supersedes:** [`member_d_phase1_requirements_v1.md`](./member_d_phase1_requirements_v1.md)

---

## Deliverable Map (per CSE323 PDF, Phase 1)

| PDF Requirement | Section |
|---|---|
| Actor Classification (Primary / Supporting / Offstage) | §1 |
| Traceability Heatmap (no orphaned requirements; mathematically justified) | §2 (full matrix in `member_d_traceability_heatmap.md`) |
| Persona Discovery (AI User as frustrated/malicious student; ≥ 5 hidden requirements) | §3 |

---

## 1. Actor Classification

Per UML actor taxonomy and the CSE323 PDF specification. **Three categories — not two.**

### 1.1 Primary Actors (Initiating the Use Case)

| Actor | Initiating Action | Goal |
|---|---|---|
| **Admin Staff** | Logs into admin panel; triggers order list view, status updates, inventory edits | Maintain fulfillment pipeline integrity and stock accuracy |

### 1.2 Supporting Actors (Secondary — Assist the Primary)

| Actor | Service Provided | Owned By |
|---|---|---|
| **`protectRoute` / `adminGuard` Middleware** | Validates JWT and `role === "admin"` claim on every admin request | Member B (auth slice) — **WE CONSUME**, do not build |
| **Order Database** | Persists `Order` + `OrderItem` records; serves read queries | Member A (checkout slice — schema authority) |
| **Product Catalog Service** | Provides product names, SKUs, and current stock for inventory view | Member C (catalog slice) |
| **Payment Service** | Emits `payment.success` events upon successful `POST /api/payment/process` — drives our `Order.status` advancement from `PENDING` to `CONFIRMED` | Member B (payment slice — Phase 3 complete) |
| **System Clock / Cron Scheduler** | Triggers the 15-minute stale-pending sweep (REQ_EC_5 from Member B); stamps `updatedAt` on every status mutation | Node runtime + our own cron |

### 1.3 Offstage Actors (Affected by Outcome but Not Present)

| Actor | Interest in Outcome |
|---|---|
| **Customer (Buyer)** | Their order data is mutated by admin. Status changes drive when they receive shipping notifications. Never present during the admin's use case. |
| **Member A's Checkout Service** | Created the orders the admin manages. Its `placeOrder` transaction is upstream. Never executes during admin actions. |
| **Tax / Audit Authority** | Every status change must be logged for compliance. Reads the audit trail later — never present during the action itself. |
| **Inventory Forecast / Reporting System** | Downstream consumer of inventory updates. Reads but does not write. |
| **Finance System** | Consumes our order status transitions for revenue reconciliation (declared as Offstage actor in Member B's payment slice — Phase 1 Log L169). |

> **Why Offstage matters:** the curriculum requires you to identify actors who are *affected* even when not present, because their interests constrain design. Example: the **Audit Authority** being offstage forces NFR-D3 (audit logging) into the design even though no auditor ever calls the API directly.

---

### 1.4 Cross-Slice Coordination Map (added post-teammate-pull 2026-05-13)

After integrating Member A's and Member B's published work (`.ai/CONTEXT.md` L156–213; `member_a_edge_cases.md`; `requirements_report_member_a.md`), the slice-ownership boundary is locked down as follows:

| Resource | Owner | We Interact Via |
|---|---|---|
| `Order` + `OrderItem` Prisma models | Member A (checkout) | Read-only DB query for list/detail |
| `Product.stock` field | Member C (catalog) | Cross-slice write — **RFC-D001 pending approval** |
| `Payment` Prisma model | Member B (payment) | Read-only — surfaced as "payment status" in order detail; used by stale-pending sweep |
| `PromoCode` Prisma model | Member B (payment) | Out of our scope |
| `payment.success` event (logical) | Member B (payment) | We subscribe → advance `Order.status` PENDING → CONFIRMED |
| `protectRoute` middleware | Member B (auth) | We `app.use()` it on every route in our slice |
| 15-minute stale-pending auto-cancel rule | Member B REQ_EC_5 mandate | **Our slice owns the cron job that executes it** |

### 1.5 Tax Rate — Settled

**10% confirmed as Global Mandate** per Member B's Phase 1 Log (CONTEXT.md L181):
> *Tax Rate: 10% (Global mandate)*

The "tax rate ambiguity" blocker tracked in the v1 archive is **closed**.

---

## 2. Traceability Heatmap (Summary)

Full matrix lives in [`member_d_traceability_heatmap.md`](./member_d_traceability_heatmap.md). The goal — per PDF — is to *mathematically justify* every feature by tracing it back to a business goal, and forward to a test, with **zero orphans**.

### 2.1 Master Summary

| Business Goal | FR-IDs Covered | NFR-IDs Covered | Features | Tests |
|---|---|---|---|---|
| **BG-1** Operational visibility of orders | FR-D1, FR-D3 | NFR-D1, NFR-D2 | `GET /orders`, `GET /orders/:id` | T-D1.*, T-D3.* |
| **BG-2** Order fulfillment lifecycle control | FR-D2 | NFR-D2, NFR-D3, NFR-D4 | `PATCH /orders/:id/status` | T-D2.* |
| **BG-3** Inventory accuracy | FR-D4, FR-D5 | NFR-D1, NFR-D2, NFR-D4 | `GET /inventory`, `PATCH /inventory/:id` | T-D4.*, T-D5.* |

### 2.2 Orphan Audit Result

- ✅ Every FR maps to ≥1 feature
- ✅ Every feature maps to ≥1 test
- ✅ Every NFR is referenced by ≥1 feature
- ✅ Every persona-surfaced Hidden Requirement (§3) escalates to an FR or NFR
- **Orphan count: 0**

---

## 3. Persona Discovery

Per PDF: *"Use an 'AI User' avatar to act as a frustrated or malicious student to uncover at least 5 'hidden' requirements or edge cases."*

Two distinct personas were instantiated.

### 3.1 Persona A — Frustrated Admin
**Profile:** Mid-shift supervisor managing 500+ active orders. Tired, error-prone, time-pressured.

### 3.2 Persona B — Malicious Power-User
**Profile:** Insider with admin credentials probing the API for ways to corrupt data, bypass business rules, or escalate privilege.

### 3.3 Hidden Requirements Surfaced

8 hidden requirements identified — **exceeds PDF minimum of 5**.

| ID | Persona | Hidden Requirement | Escalates To |
|---|---|---|---|
| **HR-1** | Frustrated Admin | "I can't scan 500 rows. I need to filter by status." | New **FR-D1.b** — `?status=PENDING` query param on `GET /orders` |
| **HR-2** | Frustrated Admin | "I clicked update but the page froze waiting for the server." | New **NFR-D1.b** — optimistic UI with server-side rollback on failure |
| **HR-3** | Frustrated Admin | "The customer is calling about a delayed order — I need their phone number visible." | New **FR-D3.b** — surface `customer.email` and `customer.phone` in order detail |
| **HR-4** | Malicious | "What happens if I set `stock` to `Number.MAX_SAFE_INTEGER`?" | New **FR-D5.b** — upper bound `stock ≤ 100,000` (rejects integer overflow attacks) |
| **HR-5** | Malicious | "What if I send `PATCH /orders/:id/status` with an empty body `{}`?" | New **FR-D2.b** — empty/missing body returns HTTP 400 |
| **HR-6** | Malicious | "Two admins update the same order's status at the same time. Last write silently wins." | New **NFR-D4.b** — optimistic concurrency on `Order.updatedAt` (HTTP 409 on conflict) |
| **HR-7** | Malicious | "Can I `DELETE /orders/:id` to wipe a record?" | New **design rule** — no DELETE endpoint exposed; soft-delete only via `status = CANCELLED` |
| **HR-8** | Malicious — Cross-Slice (added post-pull) | "Payment provider confirms success but our status-advance logic crashes — customer paid, order shows PENDING forever, then gets auto-cancelled by the 15-min sweep. We stole their money." | New **FR-D6.b** (sweep checks `Payment.status=SUCCESS` first) + **NFR-D5** (idempotent status advancement) |

---

## 4. Functional Requirements (Consolidated)

| FR-ID | Description |
|---|---|
| **FR-D1**  | Admin can list all orders with pagination |
| **FR-D1.b** | Admin can filter the order list by `status` query param (from HR-1) |
| **FR-D2**  | Admin can update an order's `status` |
| **FR-D2.b** | Empty/missing body on status update returns 400 (from HR-5) |
| **FR-D3**  | Admin can retrieve a single order's full detail with line items |
| **FR-D3.b** | Order detail surfaces customer contact info (from HR-3) |
| **FR-D4**  | Admin can view product inventory with low-stock visual flag (`stock < 5`) |
| **FR-D5**  | Admin can update a product's stock quantity |
| **FR-D5.b** | Stock updates are bounded `0 ≤ stock ≤ 100,000` (from HR-4) |
| **FR-D6**  | System cron auto-cancels orders stuck in `PENDING` for > 15 minutes (from Member B REQ_EC_5 Zombie Recovery mandate) |
| **FR-D6.b** | Before cancelling a stale order, the sweep MUST check for `Payment.status === "SUCCESS"`; if found, advance to `CONFIRMED` instead of cancelling (closes HR-8) |

---

## 5. Non-Functional Requirements (Consolidated)

| NFR-ID | Description | Source |
|---|---|---|
| **NFR-D1**  | UI updates must reflect within 500ms p95 of API response (DOM repaint) | Performance baseline |
| **NFR-D1.b** | Status & stock mutations use optimistic UI with rollback on failure | HR-2 (Frustrated Admin) |
| **NFR-D2**  | Every admin endpoint enforces JWT with `role === "admin"`; 401 if absent, 403 if non-admin | Security baseline (Offstage: Tax Authority) |
| **NFR-D3**  | Every order status mutation writes an immutable audit-log entry | Offstage Audit Authority interest |
| **NFR-D4**  | Illegal status transitions blocked at service layer (HTTP 422) | Data integrity baseline |
| **NFR-D4.b** | Optimistic concurrency on `Order.updatedAt` — concurrent writes return 409 | HR-6 (Malicious) |
| **NFR-D5**  | Idempotent status advancement: replaying the same `payment.success` event MUST NOT cause duplicate transitions, audit-log entries, or notifications. Borrowed from Member B's idempotency pattern (300s window, UUID key). | HR-8 (Cross-Slice) |

---

## 6. Exit Criteria — Phase 1

- [x] Actor Classification — Primary / Supporting / Offstage fully populated
- [x] Traceability Heatmap produced (see companion file); 0 orphans
- [x] Persona Discovery executed with two personas; 8 hidden requirements surfaced (≥ 5 required)
- [x] FRs and NFRs consolidated and indexed for Phase 2 consumption
- [x] Cross-Slice Coordination Map drafted (§1.4) — integrated with Member A & Member B's published work
- [x] Tax rate ambiguity closed (10% confirmed as Global Mandate)
- [x] Logbook entry written (`docs/logbook/member_d_phase1_agile_logbook.md`)
