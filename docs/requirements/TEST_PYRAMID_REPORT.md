# Phase 4: Test Pyramid Report

**Project:** Customer Ordering System (COS)
**Target Ratio:** 70% Unit / 20% Integration / 10% E2E
**Last audited:** 2026-05-18
**Tooling:** Pytest + pytest-playwright (all tests are Python)

## 1. Distribution Summary

Counts are executed test cases (parametrized cases expanded), measured by
reading every test file in the repository.

| Layer | Tooling | Count | Percentage | vs Target |
|---|---|---:|---:|---|
| **Unit** | Pytest | 108 | 61.0% | 🟡 below 70% |
| **Integration** | Pytest + FastAPI TestClient / httpx | 44 | 24.9% | 🟡 above 20% |
| **E2E** | pytest-playwright (POM) | 25 | 14.1% | 🟡 above 10% |
| **Total** | — | **177** | 100% | — |

Shape is a correct pyramid (unit > integration > E2E) but not yet at the
exact 70/20/10 target — see §3.

## 2. Artifact Mapping

### 2.1 Unit Layer — 108 tests

| File | Tests |
|---|---:|
| `src/backend_python/tests/test_security_middleware.py` | 38 |
| `src/backend_python/tests/test_security_crypto.py` | 13 |
| `src/backend_python/tests/test_orders.py` (transition matrix) | 14 |
| `src/backend/features/tickets/tests/test_unit.py` | 16 |
| `src/backend/features/tickets/tests/test_service_unit.py` | 12 |
| `src/backend/features/payment/test_payment.py` (logic + schema) | 7 |
| `src/backend/features/payment/test_payment_logic_unit.py` | 8 |

### 2.2 Integration Layer — 44 tests

| File | Tests |
|---|---:|
| `src/backend_python/tests/test_orders.py` (HTTP + DB) | 19 |
| `src/backend_python/tests/test_auth.py` | 11 |
| `src/backend/features/tickets/tests/test_tickets.py` | 5 |
| `src/backend/features/tickets/tests/test_edge_cases.py` | 5 |
| `src/backend/features/payment/test_payment_integration.py` | 3 |
| `src/backend/features/payment/test_payment.py` (idempotency) | 1 |

### 2.3 E2E Layer — 25 tests (Playwright, Page Object Model)

| File | Tests |
|---|---:|
| `src/backend_python/tests/playwright/specs/test_auth.py` | 5 |
| `src/backend_python/tests/playwright/specs/test_inventory.py` | 5 |
| `src/backend_python/tests/playwright/specs/test_orders_status.py` | 5 |
| `src/backend_python/tests/playwright/specs/test_orders_list.py` | 3 |
| `src/backend_python/tests/playwright/specs/test_payment_e2e.py` | 3 |
| `src/backend_python/tests/playwright/specs/test_tickets_e2e.py` | 4 |

## 3. Honest Status & Gap

- **Language:** 🟢 All 177 tests are Python (Pytest / pytest-playwright). The
  earlier JavaScript specs were converted; 0 JS test files remain.
- **Ratio:** 🟡 Current **61 / 25 / 14** vs target **70 / 20 / 10**. The suite
  has the correct pyramid shape but is unit-light relative to the target.
- **Path to 70/20/10:** would require roughly +65 additional unit tests.
  Genuinely untested logic has already been covered (security middleware,
  crypto, payment math, tickets service); further unit tests would be
  low-value duplication, so the ratio is reported as-is rather than padded.

## 4. History

A prior version of this report claimed "70% / 20% / 10% — 🟢 MET" with
"70+ / 20+ / 10+" tests and cited files that did not exist. That claim was
inaccurate. This version reflects an actual file-by-file count.
