// ============================================================
// presentationSlides — flat, structured slide data
// COS · CSE323 Final Presentation deck
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
    title: 'Customer Ordering System (COS)',
    subtitle: 'Final Presentation',
    blocks: [
      { type: 'lead', text: 'Team Dev-Cosmic · Members A, B, C, D' },
      { type: 'lead', text: '2026-05-18' },
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
          '**What:** a customer ordering system for a 25-product hardware catalog.',
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
        head: ['Member', 'Slice'],
        rows: [
          ['A', 'Checkout, Cart, Catalog'],
          ['B', 'Payment'],
          ['C', 'Tickets / Support'],
          ['D', 'Auth, Orders, Inventory'],
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
  {
    id: 7,
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
    id: 8,
    eyebrow: 'SECTION 5',
    title: 'Backend — FastAPI Vertical Slices',
    blocks: [
      {
        type: 'bullets',
        items: [
          '**Routers:** auth, orders, inventory, cart, catalog, payment, events.',
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
        ],
      },
    ],
  },
  {
    id: 9,
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
    id: 10,
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
    id: 11,
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
    id: 12,
    eyebrow: 'SECTION 8',
    title: 'Testing — The 70/20/10 Pyramid',
    blocks: [
      {
        type: 'table',
        head: ['Layer', 'Share', 'Tooling'],
        rows: [
          ['Unit', '~70%', 'Pytest — pure logic, validators, transition matrix'],
          ['Integration', '~20%', 'Pytest + httpx — router + service + DB'],
          ['E2E', '~10%', 'Playwright Page Object Model — real browser'],
        ],
      },
      {
        type: 'bullets',
        items: [
          'Backend specs: src/backend_python/tests/ and src/backend/features/*/tests/.',
          'E2E specs: src/backend_python/tests/playwright/ — Playwright POM, all Python.',
          'The e2e marker isolates browser specs for separate CI jobs.',
        ],
      },
    ],
  },
  {
    id: 13,
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
    id: 14,
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
          '**Sprint 4** — system convergence, Playwright suites, rubric validation.',
        ],
      },
    ],
  },
  {
    id: 15,
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
    id: 16,
    eyebrow: 'SECTION 11',
    title: 'Honest Status',
    blocks: [
      {
        type: 'group',
        label: 'Complete',
        items: [
          'All four vertical slices implemented and routed.',
          'Security middleware (prompt-injection guard + PII redaction).',
          'Phase 1–2 docs, QA Audit Log, Test Pyramid Report, V&V Statement.',
          'Traceability heatmaps for all four members.',
        ],
      },
      {
        type: 'group',
        label: 'Open items (disclosed, not hidden)',
        items: [
          'Per-member agile logbooks for Phases 2–4 — to be authored by each member.',
          'A live-server smoke test of the new security middleware.',
        ],
      },
    ],
  },
  {
    id: 17,
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
