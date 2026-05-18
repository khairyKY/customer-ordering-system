# Phase 4: Test Pyramid Report

**Project:** Customer Ordering System (COS)
**Target Ratio:** 70% Unit / 20% Integration / 10% E2E
**Last audited:** 2026-05-20
**Tooling:** Pytest + pytest-playwright (all tests are Python)

## 1. Distribution Summary

Counts are executed test cases collected by pytest (parametrized cases
expanded). All numbers were produced by running
`pytest --collect-only -q` against each file at the audit date above.

| Layer | Tooling | Count | Percentage | vs Target |
|---|---|---:|---:|---|
| **Unit** | Pytest | 113 | 62.8% | 🟡 below 70% |
| **Integration** | Pytest + FastAPI TestClient / httpx | 42 | 23.3% | 🟡 above 20% |
| **E2E** | pytest-playwright (POM) | 25 | 13.9% | 🟡 above 10% |
| **Total** | — | **180** | 100% | — |

Shape is a correct pyramid (unit > integration > E2E). The ratio is closer
to target than the prior audit (was 61/25/14, now 63/23/14) but still
unit-light by roughly 7 points — see §3.

## 2. Artifact Mapping

All test files now live under `src/backend_python/tests/`. The
previously-separate `src/backend/features/{payment,tickets}/tests/` trees
have been removed; their tests were ported or superseded as part of the
2026-05-20 tickets migration (see commit history).

### 2.1 Unit Layer — 113 tests

| File | Tests |
|---|---:|
| `src/backend_python/tests/test_security_middleware.py` | 38 |
| `src/backend_python/tests/test_tickets_unit.py` | 48 |
| `src/backend_python/tests/test_security_crypto.py` | 13 |
| `src/backend_python/tests/test_orders.py` (transition matrix) | 14 |

### 2.2 Integration Layer — 42 tests

| File | Tests |
|---|---:|
| `src/backend_python/tests/test_orders.py` (HTTP + DB) | 19 |
| `src/backend_python/tests/test_tickets.py` (HTTP + JWT auth) | 12 |
| `src/backend_python/tests/test_auth.py` | 11 |

### 2.3 E2E Layer — 25 tests (Playwright, Page Object Model)

| File | Tests |
|---|---:|
| `src/backend_python/tests/playwright/specs/test_auth.py` | 5 |
| `src/backend_python/tests/playwright/specs/test_inventory.py` | 5 |
| `src/backend_python/tests/playwright/specs/test_orders_status.py` | 5 |
| `src/backend_python/tests/playwright/specs/test_tickets_e2e.py` | 4 |
| `src/backend_python/tests/playwright/specs/test_orders_list.py` | 3 |
| `src/backend_python/tests/playwright/specs/test_payment_e2e.py` | 3 |

## 3. Honest Status & Gap

- **Language:** 🟢 All 180 tests are Python (Pytest / pytest-playwright).
- **Ratio:** 🟡 Current **63 / 23 / 14** vs target **70 / 20 / 10**. The 2026-05-20
  tickets-migration sweep added 48 new unit tests covering the ported service
  (sanitize, score boundaries, dedup window, NaN/non-dict HF payloads,
  pagination edges, state-machine 404 vs 422), which moved the ratio in the
  right direction.
- **Known pre-existing failures (2 of 180):**
  `tests/test_auth.py::test_admin_route_rejects_customer` and
  `tests/test_security_middleware.py::test_redact_masks_plain_card_number`
  fail on `main` before and after the migration. They are unrelated to the
  tickets slice (admin-RBAC regression; redaction regex eats a trailing space).
  Listed here in the interest of an honest report; fixes are out of scope for
  the tickets migration commit.
- **Path to 70/20/10:** the remaining gap (~7 points on unit) would require
  roughly +20 more genuine unit tests. The remaining untested branches are
  thin (most pure functions are now covered), so any further additions would
  either need to follow real new behavior, or risk being padding. The ratio is
  reported as-is rather than inflated.

## 4. History

- A prior version of this report claimed "70 / 20 / 10 — 🟢 MET" with files
  that did not exist. That claim was inaccurate and was retracted in the
  2026-05-18 audit (recount: 61/25/14).
- The 2026-05-20 audit reflects the post-migration state after the Member C
  tickets slice was moved out of `src/backend/features/tickets/` into the
  canonical `src/backend_python/` tree, and the legacy `src/backend/` folder
  was deleted.
