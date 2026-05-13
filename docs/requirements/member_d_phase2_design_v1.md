> ⚠️ **SUPERSEDED — v1 ARCHIVE**
> This document is preserved as the original Phase 2 artifact authored on 2026-05-11.
> It has been **superseded** by `member_d_phase2_design.md` (v2), which aligns
> with the official `CSE323_Project_Overview.pdf` rubric (Gherkin Scripting;
> The Refinement Loop; UML Modeling with SSDs + Activity Diagrams; Information Hiding).
> Defects fixed in v2 are logged in `docs/logbook/member_d_phase2_agile_logbook.md`
> under the "Audit & Fixes Log" section.

---

# Phase 2 Design — Member D: Admin & Order Fulfillment
**Date:** 2026-05-11
**Slice:** `orders`
**Owner:** Member D
**Status:** Complete (v1)

---

## Design Flags

> ⚠️ Tax discrepancy — schema doc 8% vs CONTEXT.md 10%. Using 10% pending Member A confirmation.
> ⚠️ RFC-D001 — `PATCH /api/v1/inventory/:id` writes Member C's `Product.stock`. Approval required.

---

## 1. Refined Gherkin
[Same five stories D-1..D-5 with schema-accurate field names — see v1 file in git history at this commit.]

## 2. System Sequence Diagrams
SSD-D1 (GET orders list), SSD-D2 (PATCH status with happy + 422 paths), SSD-D3 (GET detail 404), SSD-D5 (PATCH inventory with Zod 400).

## 3. OrderStatus Transition Machine
7×7 matrix with PENDING → CONFIRMED/CANCELLED, CONFIRMED → PROCESSING/CANCELLED, PROCESSING → SHIPPED/CANCELLED, SHIPPED → DELIVERED, DELIVERED → REFUNDED, CANCELLED + REFUNDED terminal.

## 4. Zod Validation Schemas
`updateOrderStatusSchema`, `orderListQuerySchema`, `updateStockSchema`.

## 5. Formal API Contract
| Method | Endpoint | Auth | Body / Query | Success | Errors |
|---|---|---|---|---|---|
| GET | /api/v1/orders | Admin | ?page&limit | 200 | 401, 403 |
| GET | /api/v1/orders/:id | Admin | — | 200 | 401, 403, 404 |
| PATCH | /api/v1/orders/:id/status | Admin | { status } | 200 | 400, 401, 403, 404, 422 |
| GET | /api/v1/inventory | Admin | — | 200 | 401, 403 |
| PATCH | /api/v1/inventory/:id | Admin | { stock } | 200 | 400, 401, 403, 404 |

## 6. Cross-Slice RFC-D001
PATCH /api/v1/inventory/:id writes `Product.stock` in Member C's catalog domain. Written approval required.

## 7. Phase 3 TDP Kickoff
1. test/orders-get-list
2. test/orders-update-status (valid + 422 regression)
3. test/orders-update-status-invalid (400)
4. test/inventory-update-stock (valid + negative + decimal)
5. test/orders-get-detail-not-found (404)

---

> Full original v1 content is recoverable from git history at the commit preceding this archival.
