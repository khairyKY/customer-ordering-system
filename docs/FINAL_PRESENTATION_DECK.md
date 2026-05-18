---
marp: true
title: CSE323 Customer Ordering System — Final Presentation
paginate: true
theme: default
---

<!-- Render with the Marp CLI (`marp docs/FINAL_PRESENTATION_DECK.md --pptx`) or the VS Code Marp extension. HTML comments are presenter notes. -->

# Customer Ordering System (COS)

### CSE323 Software Engineering — Final Presentation

**Team Shaheen Dynamics** · Members A, B, C, D
2026-05-18

<!-- Open confidently: state the team, that COS is a polyglot e-commerce ordering system, and that this deck walks architecture → implementation → security → testing → process. -->

---

## Agenda

1. Problem & Scope
2. Architecture — Vertical Slicing & the Polyglot Pivot
3. Tech Stack — React / FastAPI
4. Frontend — 4-Zone Routing
5. Backend — FastAPI Vertical Slices
6. Security Middleware — Semantic Perimeter
7. Requirements & Design (Phases 1–2)
8. Testing — The 70/20/10 Pyramid
9. Verification vs Validation
10. Agile Sprint Journey & AI-Native Workflow
11. Honest Status & Q&A

---

## 1. Problem & Scope

- **What:** a customer ordering system for a 25-product hardware catalog.
- **Flow:** storefront browse → cart → checkout → payment → admin fulfillment.
- **Four user-facing zones:** Storefront, Checkout, User Account, Admin Panel.

<!-- Talking point: scope is a complete commerce loop, not a toy CRUD app. Every member owns one business sub-problem end to end. -->

---

## 2. Architecture — Vertical Slicing

- **Rejected:** horizontal slicing (UI / Logic / DB per person) — high
  communication overhead and "chain vulnerability" (one layer fails → all fail).
- **Adopted:** vertical slicing — each member is a full-stack owner of a
  business sub-problem.
- **Human = Orchestrator** (defines interfaces & API contracts);
  **AI = Labor** (generates internal logic within bounded constraints).

| Member | Slice |
|---|---|
| A | Checkout, Cart, Catalog |
| B | Payment |
| C | Tickets / Support |
| D | Auth, Orders, Inventory |

<!-- Talking point: cite docs/architecture_v2/02-architectural-pivot-justification.md. The rubric explicitly rewards justifying structural decisions. -->

---

## 2b. The Polyglot Pivot

- Started as a Node.js / Express prototype.
- Pivoted the canonical backend to **Python / FastAPI** on port 8000.
- **Why it is safe:** JWT (HS256) is language-agnostic — the React frontend
  and either backend interoperate on the same token contract.
- Vertical slicing *permits* per-slice runtime choices.

<!-- Talking point: the pivot was deliberate and contract-driven, not a rewrite-for-its-own-sake. The JWT contract is the seam. -->

---

## 3. Tech Stack

**Frontend**
- React 18 + Vite + Tailwind CSS + Framer Motion
- "Dev-Cosmic" liquid-glassmorphism UI component library (mandated, centralized)

**Backend (canonical)**
- FastAPI (Python 3.11+) · SQLAlchemy ORM · SQLite
- Bcrypt password hashing · HS256 JWT · APScheduler for the stale-order sweep

**DevOps / QA**
- Pytest (backend) · Playwright Page Object Model (E2E) · GitHub Actions CI

<!-- Talking point: every dependency earns its place — name the role of each, don't just read the list. -->

---

## 4. Frontend — 4-Zone Routing

1. **Public Storefront** — catalog browsing, product discovery, Hero CTA.
2. **Checkout Funnel** — session cart, shipping details, promo codes.
3. **User Account** — authenticated order history & settings.
4. **Admin Panel** — role-gated fulfillment & inventory control.

- Orchestrated via `react-router-dom`.
- All basic elements use the shared UI library (`Button`, `Card`, `Input`
  variants) — no raw HTML / ad-hoc Tailwind for those primitives.

<!-- Talking point: show a screenshot per zone if presenting live. -->

---

## 5. Backend — FastAPI Vertical Slices

- **Routers:** `auth`, `orders`, `inventory`, `cart`, `catalog`, `payment`, `events`.
- **Services layer** holds business logic; routers stay thin.
- **Global exception handling:** services raise `DomainError`; a single handler
  converts them to consistent JSON — no per-route try/except.
- **Persistence:** SQLAlchemy models, SQLite; fresh in-memory DB per test.

| Endpoint | Auth | Purpose |
|---|---|---|
| `POST /auth/login` | public | issue Bearer JWT |
| `GET /orders` | admin | paginated list, `?status=` filter |
| `PATCH /orders/{id}/status` | admin | guarded transition matrix |
| `GET /inventory` | admin | products with `low_stock` flag |

<!-- Talking point: emphasize the thin-router / fat-service split and the transition matrix. -->

---

## 6. Security Middleware — Semantic Perimeter

The CSE323 §3 mandate: defend at the **AI-native semantic perimeter**.

**Prompt-Injection Guard** (`app/middleware/security.py`)
- Pure-ASGI middleware; buffers and *replays* the request body.
- Scans `POST/PUT/PATCH` bodies for instruction-override / jailbreak patterns.
- Match → `HTTP 400 PROMPT_INJECTION_BLOCKED`; oversized body → `413`.

**PII Redaction Firewall**
- `RedactionFilter` attached to root + uvicorn loggers.
- Masks emails, card numbers, and sensitive key/values (`password`, `cvv`, `token`).
- Secrets never reach the terminal or log files.

<!-- Talking point: be honest — this is pattern-based defense-in-depth, not a semantic classifier. Cite docs/requirements/SECURITY_AND_PII_REPORT.md. -->

---

## 7. Requirements & Design (Phases 1–2)

**Phase 1 — Requirements**
- Actor classification (Primary / Supporting / Offstage).
- AI-as-Malicious-User edge-case discovery — ≥5 negative cases per persona.
- Traceability heatmaps map every requirement to a test case (zero orphans).

**Phase 2 — Design**
- System Sequence Diagrams (SSDs).
- UML Activity Diagrams with explicit code decision points.
- Gherkin scenarios (`Given` / `When` / `Then`) per user story.
- API contracts locked before implementation.

<!-- Talking point: requirements are testable; vague adjectives were removed (see next slide). -->

---

## 7b. QA — The Ambiguity Audit

- AI acted as Senior QA to strip subjective terms from requirements.
- "fast" → **"< 500 ms response"**; "secure" → **"JWT-validated, Bcrypt-hashed"**.
- Recorded in `docs/requirements/QA_AUDIT_LOG.md`.

<!-- Talking point: measurable requirements are the precondition for meaningful acceptance tests. -->

---

## 8. Testing — The 70/20/10 Pyramid

| Layer | Share | Tooling |
|---|---|---|
| **Unit** | ~70% | Pytest — pure logic, validators, transition matrix |
| **Integration** | ~20% | Pytest + httpx — router + service + DB |
| **E2E** | ~10% | Playwright Page Object Model — real browser |

- Backend specs: `src/backend_python/tests/`, `src/backend/features/*/tests/`.
- E2E specs: `src/backend_python/tests/playwright/` (Python POM),
  `tests/e2e/payment.spec.js` (JS POM).
- `e2e` marker isolates browser specs for separate CI jobs.

<!-- Talking point: cite docs/requirements/TEST_PYRAMID_REPORT.md. The pyramid shape is deliberate — fast feedback at the base. -->

---

## 9. Verification vs Validation

- **Verification** — "are we building the product *right*?"
  → unit + integration tests (Pytest).
- **Validation** — "are we building the *right* product?"
  → UAT via Playwright POM against Gherkin acceptance scenarios.
- Documented team-wide in `docs/requirements/V_VS_V_STATEMENT.md`.

<!-- Talking point: this distinction is heavily rubric-weighted — state both definitions crisply. -->

---

## 10. Agile Sprint Journey

- **Sprint 0** — architectural skeleton, vertical-slicing mandate, Git rules.
- **Sprint 1** — first end-to-end cart → API → DB loop.
- **Sprint 2** — Phase 1/2 documentation, SSDs, prompt library.
- **Sprint 3** — the polyglot pivot to FastAPI; UI library lockdown.
- **Sprint 4** — system convergence, Playwright suites, rubric validation.

<!-- Talking point: cite PROJECT_AUDIT_AND_SPRINTS.md §2. -->

---

## 10b. AI-Native Workflow

- **Test-Driven Prompting (TDP):** a failing test must precede implementation.
- Human orchestrates; AI generates bounded logic.
- AI disclosure is present in code headers / appendix per the submission checklist.

<!-- Talking point: TDP is how we kept AI-generated code honest — the test is the spec. -->

---

## 11. Honest Status

**Complete**
- All four vertical slices implemented and routed.
- Security middleware (prompt-injection guard + PII redaction).
- Phase 1–2 docs, QA Audit Log, Test Pyramid Report, V&V Statement.
- Traceability heatmaps for all four members.

**Open items (disclosed, not hidden)**
- Per-member agile logbooks for Phases 2–4 (Members A/B/C) — to be authored
  by each member; not auto-generated.
- A live-server smoke test of the new security middleware.

<!-- Talking point: stating open items honestly is itself rubric-positive. Do not overclaim. -->

---

## Thank You

### Questions?

`docs/requirements/FINAL_DELIVERABLES.md` — full deliverables map
`http://localhost:8000/docs` — live FastAPI Swagger UI

<!-- Close: invite questions; offer to walk the live app or any document. -->
