# CSE323 — Ticket System | Phase 3 Deliverable D5

## 03g: Implementation — TC-03, TC-04 & TC-05 Passing

**Member:** C — Ticket System Vertical Slice
**TDP STATUS:** ✅ PASSING — 19 passed, 19 total across 5 test suites.

---

## Test Execution Results

| Metric | Result |
| ------ | ------ |
| Test Suites | 5 passed, 5 total |
| Tests | 19 passed, 19 total |
| Time | 5.817s |

---

## What Was Implemented

### 1. GET /api/v1/tickets — Customer Ticket List (TC-03)

- Added `getTickets` to `ticket.service.js` with pagination and `userId` scoping
- Added `getTickets` handler to `ticket.controller.js`
- Registered `GET /` route in `ticket.routes.js`
- Returns paginated list filtered strictly to `req.user.id` from JWT

### 2. GET /api/v1/tickets/triage — Agent Triage Queue (TC-04)

- Added `getTriageQueue` to `ticket.service.js` with priority sorting: CRITICAL → HIGH → MEDIUM → LOW
- Added role-based access control in `ticket.controller.js` — returns `403 Forbidden` for customer role
- Registered `GET /triage` route in `ticket.routes.js`

### 3. PATCH /api/v1/tickets/:id/status — Status State Machine (TC-05)

- Implemented strict transition map in `ticket.service.js`:
  - `OPEN → IN_PROGRESS` ✅ allowed
  - `IN_PROGRESS → RESOLVED` ✅ allowed
  - All other transitions → `422 Unprocessable Entity`
- Returns `404 Not Found` when ticket ID does not exist
- Returns `403 Forbidden` when customer role attempts update
- Registered `PATCH /:id/status` route in `ticket.routes.js`

---

## Files Modified

| File | Change |
| ---- | ------ |
| `src/backend/features/tickets/ticket.service.js` | Added `getTickets`, `getTriageQueue`, `updateTicketStatus` methods |
| `src/backend/features/tickets/ticket.controller.js` | Added `getTickets`, `getTriageQueue`, `updateStatus` handlers with RBAC |
| `src/backend/features/tickets/ticket.routes.js` | Registered `GET /`, `GET /triage`, `PATCH /:id/status` routes |

---

## Full Test Suite — All 19 Passing

| Test ID | Description | Result |
|---------|-------------|--------|
| TC-01-A | Create ticket — 201 + correct shape | ✅ |
| TC-01-B | userId from JWT not request body | ✅ |
| TC-01-C | No JWT → 401 | ✅ |
| TC-02 ×4 | Priority mapping all 4 bands | ✅ |
| TC-02-E | HF timeout → MEDIUM + fallback | ✅ |
| TC-02-F | NaN score → MEDIUM + score_invalid | ✅ |
| TC-03-A | Paginated list scoped to userId | ✅ |
| TC-03-B | No JWT → 401 | ✅ |
| TC-04-A | Customer JWT → 403 on triage | ✅ |
| TC-04-B | Agent JWT → sorted triage queue | ✅ |
| TC-05-A | OPEN → IN_PROGRESS → 200 | ✅ |
| TC-05-B | RESOLVED → OPEN → 422 | ✅ |
| TC-05-C | OPEN → RESOLVED skip → 422 | ✅ |
| TC-05-D | Customer JWT → 403 on PATCH | ✅ |
| TC-05-E | Nonexistent ticket → 404 | ✅ |

---

*Phase 3g — Implementation TC-03/04/05 | CSE323 D5 | Member C — Ticket System*
