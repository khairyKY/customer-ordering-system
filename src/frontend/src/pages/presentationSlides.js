// ============================================================
// presentationSlides — flat, structured slide data
// Terminal · CSE323 Final Presentation deck
//
// Each slide: { id, eyebrow?, title, subtitle?, blocks[] }
// Block types consumed by PresentationDeck:
//   { type: 'lead',    text }
//   { type: 'bullets', items: string[] }
//   { type: 'ordered', items: string[] }
//   { type: 'group',   label, items: string[] }
//   { type: 'table',   head: string[], rows: string[][] }
// Inline **bold** is supported inside any string.
// ============================================================

export const slides = [
  {
    id: 1,
    eyebrow: 'CSE323 · SOFTWARE ENGINEERING',
    title: 'Terminal',
    subtitle: 'Final Presentation',
    blocks: [
      { type: 'lead', text: 'Team Dev-Cosmic · Khairy · Haitham · Diaa · Mohamed' },
      { type: 'lead', text: '2026-05-20' },
    ],
  },
  {
    id: 2,
    eyebrow: 'OVERVIEW',
    title: 'Agenda',
    blocks: [
      {
        type: 'ordered',
        items: [
          'Problem & Scope',
          'Architecture — Vertical Slicing & the Polyglot Pivot',
          'Tech Stack — React / FastAPI',
          'System Architecture & ERD',
          'The Order Life Cycle (SSD)',
          'Traceability & Coverage Heatmap',
          'Frontend — 4-Zone Routing',
          'Backend — FastAPI Vertical Slices',
          'Security Middleware — Semantic Perimeter',
          'Requirements & Design (Phases 1–2)',
          'Testing — The 70/20/10 Pyramid',
          'Verification vs Validation',
          'Agile Sprint Journey & AI-Native Workflow',
          'Honest Status & Q&A',
        ],
      },
    ],
  },
  {
    id: 3,
    eyebrow: 'SECTION 1',
    title: 'Problem & Scope',
    blocks: [
      {
        type: 'bullets',
        items: [
          '**What:** Terminal — a customer ordering system for a 25-product hardware catalog.',
          '**Flow:** storefront browse → cart → checkout → payment → admin fulfillment.',
          '**Four user-facing zones:** Storefront, Checkout, User Account, Admin Panel.',
        ],
      },
    ],
  },
  {
    id: 4,
    eyebrow: 'SECTION 2',
    title: 'Architecture — Vertical Slicing',
    blocks: [
      {
        type: 'bullets',
        items: [
          '**Rejected:** horizontal slicing (UI / Logic / DB per person) — high communication overhead and "chain vulnerability" (one layer fails → all fail).',
          '**Adopted:** vertical slicing — each member is a full-stack owner of a business sub-problem.',
          '**Human = Orchestrator** (defines interfaces & API contracts); **AI = Labor** (generates internal logic within bounded constraints).',
        ],
      },
      {
        type: 'table',
        head: ['Member', 'Name', 'Slice'],
        rows: [
          ['A', 'Khairy', 'Checkout, Cart, Catalog'],
          ['B', 'Haitham', 'Payment'],
          ['C', 'Diaa', 'Tickets / Support'],
          ['D', 'Mohamed', 'Auth, Orders, Admin'],
        ],
      },
    ],
  },
  {
    id: 5,
    eyebrow: 'SECTION 2B',
    title: 'The Polyglot Pivot',
    blocks: [
      {
        type: 'bullets',
        items: [
          'Started as a Node.js / Express prototype.',
          'Pivoted the canonical backend to **Python / FastAPI** on port 8000.',
          '**Why it is safe:** JWT (HS256) is language-agnostic — the React frontend and either backend interoperate on the same token contract.',
          'Vertical slicing permits per-slice runtime choices.',
        ],
      },
    ],
  },
  {
    id: 6,
    eyebrow: 'SECTION 3',
    title: 'Tech Stack',
    blocks: [
      {
        type: 'group',
        label: 'Frontend',
        items: [
          'React 18 + Vite + Tailwind CSS + Framer Motion',
          '"Dev-Cosmic" liquid-glassmorphism UI component library (mandated, centralized)',
        ],
      },
      {
        type: 'group',
        label: 'Backend (canonical)',
        items: [
          'FastAPI (Python 3.11+) · SQLAlchemy ORM · SQLite',
          'Bcrypt password hashing · HS256 JWT · APScheduler for the stale-order sweep',
        ],
      },
      {
        type: 'group',
        label: 'DevOps / QA',
        items: ['Pytest (backend) · Playwright Page Object Model (E2E) · GitHub Actions CI'],
      },
    ],
  },
  // ── NEW: architectural visualization slides (anti-clutter, theme-pinned) ──
  {
    id: 7,
    eyebrow: 'SECTION 3B · ARCHITECTURE VISUALS',
    title: 'System Architecture & ERD',
    subtitle: 'Entities + cardinality — rendered in the deck table primitive',
    blocks: [
      {
        type: 'lead',
        text: 'Persistent core: USER places orders; ORDER contains many ORDER_ITEMs; PRODUCT is mirrored read-only (no FK, immutable snapshots). CART_SESSION is in-memory and materialises into ORDER + ORDER_ITEM rows at checkout.',
      },
      {
        type: 'table',
        head: ['From', 'Relationship', 'To', 'Cardinality'],
        rows: [
          ['USER', 'places', 'ORDER', '1 → 0..N'],
          ['ORDER', 'contains', 'ORDER_ITEM', '1 → 1..N'],
          ['ORDER', 'logs', 'AUDIT_LOG', '1 → 0..N'],
          ['ORDER_ITEM', 'snapshot of (no FK)', 'PRODUCT', 'N → 1'],
          ['CART_SESSION', 'holds', 'CART_ITEM', '1 → 1..N (in-memory)'],
          ['CART_SESSION', 'materialises into', 'ORDER', '1 → 1 (at checkout)'],
          ['TICKET', 'filed by', 'USER', 'N → 1 (Member C)'],
          ['PAYMENT', 'settles', 'ORDER', '1 → 1 (Member B)'],
        ],
      },
      {
        type: 'group',
        label: 'Why no FK between ORDER_ITEM and PRODUCT',
        items: [
          'Catalog is a mirror — order history must remain immutable even after a SKU is deleted.',
          'product_name and unit_price are snapshotted at order time.',
        ],
      },
    ],
  },
  {
    id: 8,
    eyebrow: 'SECTION 3C · SEQUENCE FLOW',
    title: 'The Order Life Cycle (SSD)',
    subtitle: 'Checkout / order submission — every cross-slice handoff in one ordered flow',
    blocks: [
      {
        type: 'lead',
        text: 'Customer drives the React checkout wizard. Frontend talks to the FastAPI router. Member B settles payment with an idempotency key. Member D opens a DB transaction, re-verifies stock, snapshots the order, and writes an audit log entry.',
      },
      {
        type: 'ordered',
        items: [
          '**Customer → UI (CheckoutFlow.jsx):** advance through steps 1–4 (Cart → Auth → Shipping → Method).',
          '**UI → Cart API (GET /api/v1/cart):** hydrate session cart for the Review step.',
          '**UI:** generate Idempotency-Key (UUID v4) and state-lock the "Place Order" button.',
          '**UI → Payment API (Member B):** POST `/api/v1/payment` with amount + idempotency_key.',
          '**Payment API → DB:** insert payments row (PENDING) → authorise gateway → update to SUCCESS.',
          '**UI → Orders API (Member D):** POST `/api/v1/orders` with cart snapshot + payment_id.',
          '**Orders API:** BEGIN TXN → SELECT products FOR UPDATE → re-verify stock per line.',
          '**Branch — stock conflict:** ROLLBACK → 409 STOCK_CONFLICT → UI refreshes cart and shows modal.',
          '**Branch — all clear:** decrement stock → INSERT orders + order_items (price snapshots) → INSERT audit_log (PENDING → CONFIRMED, keyed by Idempotency-Key).',
          '**Orders API → UI:** 201 Created with order_id + status "CONFIRMED".',
          '**UI → Cart API (DELETE /api/v1/cart):** clear session cart.',
          '**UI → Customer:** advance to Step 7 — Success screen with the new order_id.',
        ],
      },
    ],
  },
  {
    id: 9,
    eyebrow: 'SECTION 3D · QA EVIDENCE',
    title: 'Traceability & Coverage Heatmap',
    subtitle: 'Every requirement → at least one passing test · zero orphans',
    blocks: [
      {
        type: 'lead',
        text: 'Across the four slices: every Functional Requirement and every Edge Case carries a PRIMARY test case, with related tests filling in cross-cutting coverage. The table below is the row-collapsed summary; per-slice heatmaps live in docs/requirements/.',
      },
      {
        type: 'table',
        head: ['Slice', 'FRs', 'ECs', 'Primary TCs', 'Status'],
        rows: [
          ['A — Checkout / Cart / Catalog (Khairy)', '5', '5', '10', '🟢'],
          ['B — Payment (Haitham)', '4', '5', '9', '🟢'],
          ['C — Tickets / Support (Diaa)', '5', '5', '10', '🟢'],
          ['D — Auth, Orders, Admin (Mohamed)', '6', '8', '14', '🟢'],
        ],
      },
      {
        type: 'group',
        label: 'Zero-orphan check (repo-wide)',
        items: [
          'Every Business Goal escalates to ≥1 Functional Requirement.',
          'Every Functional Requirement maps to ≥1 Feature.',
          'Every Feature has ≥1 verifying Test (unit, integration, or E2E).',
          'Every NFR has ≥1 explicit verification method.',
          'Every Persona Behaviour escalates to an Edge Case + Padlock.',
          '**Total orphans across all four slices: 0.**',
        ],
      },
    ],
  },
  {
    id: 10,
    eyebrow: 'SECTION 4',
    title: 'Frontend — 4-Zone Routing',
    blocks: [
      {
        type: 'ordered',
        items: [
          '**Public Storefront** — catalog browsing, product discovery, Hero CTA.',
          '**Checkout Funnel** — session cart, shipping details, promo codes.',
          '**User Account** — authenticated order history & settings.',
          '**Admin Panel** — role-gated fulfillment & inventory control.',
        ],
      },
      {
        type: 'bullets',
        items: [
          'Orchestrated via react-router-dom.',
          'All basic elements use the shared UI library — no raw HTML or ad-hoc Tailwind for those primitives.',
        ],
      },
    ],
  },
  {
    id: 11,
    eyebrow: 'SECTION 5',
    title: 'Backend — FastAPI Vertical Slices',
    blocks: [
      {
        type: 'bullets',
        items: [
          '**Routers:** auth, orders, inventory, cart, catalog, payment, tickets, events.',
          '**Services layer** holds business logic; routers stay thin.',
          '**Global exception handling:** services raise DomainError; a single handler converts them to consistent JSON.',
          '**Persistence:** SQLAlchemy models, SQLite; fresh in-memory DB per test.',
        ],
      },
      {
        type: 'table',
        head: ['Endpoint', 'Auth', 'Purpose'],
        rows: [
          ['POST /auth/login', 'public', 'issue Bearer JWT'],
          ['GET /orders', 'admin', 'paginated list, ?status= filter'],
          ['PATCH /orders/{id}/status', 'admin', 'guarded transition matrix'],
          ['GET /inventory', 'admin', 'products with low_stock flag'],
          ['POST /tickets', 'customer', 'AI-priority + dedup + state machine'],
        ],
      },
    ],
  },
  {
    id: 12,
    eyebrow: 'SECTION 6',
    title: 'Security Middleware — Semantic Perimeter',
    blocks: [
      { type: 'lead', text: 'The CSE323 §3 mandate: defend at the **AI-native semantic perimeter**.' },
      {
        type: 'group',
        label: 'Prompt-Injection Guard',
        items: [
          'Pure-ASGI middleware; buffers and replays the request body.',
          'Scans POST / PUT / PATCH bodies for instruction-override and jailbreak patterns.',
          'Match → HTTP 400 PROMPT_INJECTION_BLOCKED; oversized body → 413.',
        ],
      },
      {
        type: 'group',
        label: 'PII Redaction Firewall',
        items: [
          'RedactionFilter attached to the root and uvicorn loggers.',
          'Masks emails, card numbers, and sensitive key/values (password, cvv, token).',
          'Secrets never reach the terminal or log files.',
        ],
      },
    ],
  },
  {
    id: 13,
    eyebrow: 'SECTION 7',
    title: 'Requirements & Design (Phases 1–2)',
    blocks: [
      {
        type: 'group',
        label: 'Phase 1 — Requirements',
        items: [
          'Actor classification (Primary / Supporting / Offstage).',
          'AI-as-Malicious-User edge-case discovery — ≥5 negative cases per persona.',
          'Traceability heatmaps map every requirement to a test case (zero orphans).',
        ],
      },
      {
        type: 'group',
        label: 'Phase 2 — Design',
        items: [
          'System Sequence Diagrams (SSDs).',
          'UML Activity Diagrams with explicit code decision points.',
          'Gherkin scenarios (Given / When / Then) per user story.',
          'API contracts locked before implementation.',
        ],
      },
    ],
  },
  {
    id: 14,
    eyebrow: 'SECTION 7B',
    title: 'QA — The Ambiguity Audit',
    blocks: [
      {
        type: 'bullets',
        items: [
          'AI acted as Senior QA to strip subjective terms from requirements.',
          '"fast" → **"< 500 ms response"**;  "secure" → **"JWT-validated, Bcrypt-hashed"**.',
          'Recorded in docs/requirements/QA_AUDIT_LOG.md.',
        ],
      },
    ],
  },
  {
    id: 15,
    eyebrow: 'SECTION 8',
    title: 'Testing — The 70/20/10 Pyramid',
    blocks: [
      {
        type: 'table',
        head: ['Layer', 'Share', 'Tooling'],
        rows: [
          ['Unit', '~63%', 'Pytest — pure logic, validators, transition matrix'],
          ['Integration', '~23%', 'Pytest + httpx — router + service + DB'],
          ['E2E', '~14%', 'Playwright Page Object Model — real browser'],
        ],
      },
      {
        type: 'bullets',
        items: [
          'All 180 tests live under src/backend_python/tests/ (Python end-to-end).',
          'E2E specs: src/backend_python/tests/playwright/ — Playwright POM.',
          'The e2e marker isolates browser specs for separate CI jobs.',
          'Honest gap: ratio is 63/23/14 vs the 70/20/10 target — documented in TEST_PYRAMID_REPORT.md rather than padded.',
        ],
      },
    ],
  },
  {
    id: 16,
    eyebrow: 'SECTION 9',
    title: 'Verification vs Validation',
    blocks: [
      {
        type: 'bullets',
        items: [
          '**Verification** — "are we building the product right?" → unit + integration tests (Pytest).',
          '**Validation** — "are we building the right product?" → UAT via Playwright POM against Gherkin acceptance scenarios.',
          'Documented team-wide in docs/requirements/V_VS_V_STATEMENT.md.',
        ],
      },
    ],
  },
  {
    id: 17,
    eyebrow: 'SECTION 10',
    title: 'Agile Sprint Journey',
    blocks: [
      {
        type: 'bullets',
        items: [
          '**Sprint 0** — architectural skeleton, vertical-slicing mandate, Git rules.',
          '**Sprint 1** — first end-to-end cart → API → DB loop.',
          '**Sprint 2** — Phase 1/2 documentation, SSDs, prompt library.',
          '**Sprint 3** — the polyglot pivot to FastAPI; UI library lockdown.',
          '**Sprint 4** — system convergence, Playwright suites, rubric validation, Tickets migration onto the canonical core.',
        ],
      },
    ],
  },
  {
    id: 18,
    eyebrow: 'SECTION 10B',
    title: 'AI-Native Workflow',
    blocks: [
      {
        type: 'bullets',
        items: [
          '**Test-Driven Prompting (TDP):** a failing test must precede implementation.',
          'Human orchestrates; AI generates bounded logic.',
          'AI disclosure is present in code headers and appendix per the submission checklist.',
        ],
      },
    ],
  },
  {
    id: 19,
    eyebrow: 'SECTION 11',
    title: 'Honest Status',
    blocks: [
      {
        type: 'group',
        label: 'Complete',
        items: [
          'All four vertical slices implemented and routed on the canonical FastAPI core.',
          'Security middleware (prompt-injection guard + PII redaction).',
          'Phase 1–4 docs, QA Audit Log, Test Pyramid Report, V&V Statement.',
          'Traceability heatmaps for all four members; zero orphans.',
        ],
      },
      {
        type: 'group',
        label: 'Open items (disclosed, not hidden)',
        items: [
          'Repo-wide pyramid is 63/23/14 vs 70/20/10 target — gap reported, not padded.',
          'Screen-recording demo is scripted but not yet recorded.',
        ],
      },
    ],
  },
  {
    id: 20,
    eyebrow: 'CLOSING',
    title: 'Thank You',
    subtitle: 'Questions?',
    blocks: [
      { type: 'lead', text: 'docs/requirements/FINAL_DELIVERABLES.md — full deliverables map' },
      { type: 'lead', text: 'http://localhost:8000/docs — live FastAPI Swagger UI' },
    ],
  },
];

export default slides;
