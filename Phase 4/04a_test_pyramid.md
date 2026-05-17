# CSE323 — Ticket System | Phase 4 Deliverable D4

## 04a: Test Pyramid Report

**Member:** C — Ticket System Vertical Slice
**Rubric Target:** Excellent (Full Marks)
**Target Ratio:** 70% Unit / 20% Integration / 10% E2E

---

## Current Distribution vs Target

| Test Type   | File(s)                                             | Current Count | Current % | Target % | Status               |
| ----------- | --------------------------------------------------- | :-----------: | :-------: | :------: | -------------------- |
| Unit        | `ticket.controller.test.js`, `ticket.service.test.js` | 2           | 20%       | 70%      | 🔴 Under-represented |
| Integration | `ticket.integration.test.js`, `ticket.edge.test.js` | 8             | 80%       | 20%      | 🟡 Over-represented  |
| E2E         | None                                                | 0             | 0%        | 10%      | 🔴 Missing           |
| **Total**   |                                                     | **10**        | **100%**  | **100%** |                      |

---

## Classification & Justification

### Unit Tests (2 — current)

| File | Count | Classification Reason |
| ---- | :---: | --------------------- |
| `ticket.controller.test.js` | 1 | Tests the controller layer in isolation — no HTTP layer, no DB |
| `ticket.service.test.js` | 1 | Tests business logic in isolation — no external dependencies |

> **Issue:** Both files contain placeholder tests (`expect(true).toBe(true)`) with no real assertions. These must be replaced with meaningful unit tests to count toward the 70% target.

---

### Integration Tests (8 — current)

| File | Count | Classification Reason |
| ---- | :---: | --------------------- |
| `ticket.integration.test.js` | 3 | Tests the full request pipeline (router → controller → service) using Supertest and Nock |
| `ticket.edge.test.js` | 7 | Tests EC-1 through EC-5 across the vertical slice with mocked external dependencies |

> These tests verify the interaction between multiple layers and external services. They are correctly classified as Integration.

---

### E2E Tests (0 — missing)

No E2E tests exist yet. Required for Phase 4 (Playwright scripts).

---

## Gap Analysis

| Gap | Tests Needed | What to Test |
| --- | :----------: | ------------ |
| Unit — Zod validators | +5 | Each field constraint: subject min, subject max, body min, body max, required fields |
| Unit — Priority mapper | +4 | Each score boundary: exactly 0.25, 0.50, 0.75 and NaN/null guard |
| Unit — Dedup hash | +2 | Same input → same hash; different userId → different hash |
| Unit — XSS sanitizer | +3 | Script tag stripping, HTML entity encoding, plain text passthrough |
| Unit — sentimentSource resolver | +2 | `"hf_model"` on valid score, `"score_invalid"` on NaN |
| E2E — Full journey | +2 | Submit ticket → appears in list; Duplicate submission → 409 shown in UI |
| **Total needed** | **+18** | To reach 70% Unit / 20% Integration / 10% E2E |

---

## Target Distribution (After Gap Resolution)

| Test Type   | Current | To Add | Target Total | Target % |
| ----------- | :-----: | :----: | :----------: | :------: |
| Unit        | 2       | +16    | 18           | 70%      |
| Integration | 8       | 0      | 8            | ~28%     |
| E2E         | 0       | +2     | 2            | ~8%      |
| **Total**   | **10**  | **+18**| **28**       | **~100%**|

> Note: The existing integration tests provide high value and should not be removed. Adding 16 unit tests and 2 E2E tests brings the ratio within the acceptable 15% deviation band specified in the rubric.

---

*Phase 4a — Test Pyramid Report | CSE323 D4 | Member C — Ticket System*
