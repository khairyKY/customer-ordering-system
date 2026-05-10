# CSE323 Customer Ordering System — Master Project Documentation

> **Maintained by:** Member A (Checkout & Shopping Cart — Full-Stack Owner)
> **Document Version:** 1.0.0
> **Last Updated:** See Git log (`git log -1 --format="%ci" docs/MASTER.md`)
> **Classification:** Internal — Academic Project Reference

---

## Table of Contents

1. [Executive Summary & Core Objectives](#1-executive-summary--core-objectives)
2. [Architectural Pivot Justification](#2-architectural-pivot-justification)
3. [System Architecture & Tech Stack](#3-system-architecture--tech-stack)
4. [Strict Rulebook](#4-strict-rulebook)
5. [Master Scope & Sprints — Checkout & Shopping Cart](#5-master-scope--sprints--checkout--shopping-cart)
6. [Risk Register](#6-risk-register)
7. [Appendices](#7-appendices)

---

## 1. Executive Summary & Core Objectives

### 1.1 Project Identity

| Field | Value |
|---|---|
| **Course** | CSE323 — Software Engineering |
| **Project** | Customer Ordering System (COS) |
| **Architecture Model** | Feature-Based Vertical Slicing |
| **Primary Deliverable Owner (This Doc)** | Member A — Checkout & Shopping Cart |
| **Repository** | `cse323-customer-ordering-system` |
| **Primary Branch** | `main` |
| **Development Branch** | `develop` |

### 1.2 System Vision

The Customer Ordering System (COS) is a full-stack web application designed to simulate a production-grade e-commerce ordering pipeline. It enables customers to browse a product catalog, manage a persistent shopping cart, proceed through a structured checkout flow, and receive order confirmations. The system exposes an administrative interface for order management and inventory control.

The project serves a dual purpose: it satisfies the CSE323 academic rubric and simultaneously demonstrates professional software engineering practices — including agile feature ownership, test-driven development, CI/CD pipelines, and AI-assisted code generation governed by structured prompting protocols.

### 1.3 Core Objectives

**O-1 — Functional Completeness:** Deliver all specified features (product catalog, cart, checkout, order management, user authentication) to a demonstrable, running state.

**O-2 — Architectural Integrity:** Implement a coherent, documented architecture that can withstand academic scrutiny and justify every structural decision made.

**O-3 — Zero Merge Conflict Tolerance:** Enforce feature-slice ownership so that parallel development by team members produces no overlapping file modifications, thereby eliminating destructive merge conflicts.

**O-4 — Auditability of AI Usage:** All AI-generated code must be produced through the Test-Driven Prompting (TDP) protocol, creating a traceable, defensible record of AI contribution versus human engineering judgment.

**O-5 — Knowledge Continuity:** The `.ai/CONTEXT.md` file must remain the single source of truth for project state, ensuring that any team member or AI assistant can onboard instantly without loss of context.

**O-6 — Grade Defense:** Every non-standard decision (architecture pivot, AI tooling, vertical slicing) must be documented with academic citations and professional rationale sufficient to defend against a rigid rubric.

---

## 2. Architectural Pivot Justification

### 2.1 Original Architecture — Horizontal Layered Assignment

The initial project structure assigned team members to horizontal technical layers:

```
Member A  →  UI / Frontend Layer       (React components, CSS, routing)
Member B  →  Business Logic Layer      (Service classes, validation, controllers)
Member C  →  Data Access Layer         (Database schema, ORM models, queries)
```

This decomposition mirrors the classic n-tier architecture pattern and is a common starting point for academic group projects. However, upon entering active development, this model introduced systemic engineering problems that directly threatened both code quality and team velocity.

### 2.2 Problems Identified with the Layered Model

#### 2.2.1 Cross-Layer Coupling Causes Destructive Merge Conflicts

In a layered model, adding a single feature — for example, "Add item to cart" — requires simultaneous, coordinated changes across all three layers:

- Member A must build a `CartButton` component and wire it to a hypothetical API endpoint.
- Member B must implement a `CartService.addItem()` method that does not yet exist.
- Member C must create the `cart_items` database table and the ORM model.

All three members are blocked by each other. Member A cannot test the UI because Member B's service does not exist. Member B cannot test the service because Member C's schema is not yet migrated. This creates **critical path coupling** — the worst possible outcome in agile development — where team velocity collapses to the speed of the slowest layer.

Furthermore, interface contracts between layers (API shapes, model field names, DTO structures) must be negotiated verbally or via informal Slack messages, producing **implicit contracts** that break silently and produce runtime errors rather than compile-time or test failures.

#### 2.2.2 The God-Merge Problem

When a horizontal-layer project reaches integration — typically 24–48 hours before a deadline — all three members attempt to merge their independent branches into `main` simultaneously. Each member has been working in isolation on different files in the same directories. The result is a **god-merge**: a single merge commit touching hundreds of files across all layers, with conflicts in shared utility files, configuration files, type definition files, and test setup files.

God-merges are not solvable by tooling. They require human judgment on every conflicted hunk. Under deadline pressure, this produces one of two outcomes: (a) incorrect conflict resolutions that introduce subtle bugs, or (b) one member's entire layer being silently overwritten.

#### 2.2.3 Accountability and Grading Opacity

A layered model makes it difficult to attribute specific features to specific team members. If a grader asks "who built the checkout feature?", the truthful answer is "all three of us, partially" — which diffuses accountability and makes it impossible to grade individual contribution with precision. This is a direct threat to individual grades in a group project context.

### 2.3 The Solution — Feature-Based Vertical Slicing

#### 2.3.1 Definition

Feature-Based Vertical Slicing is an architectural decomposition strategy in which the system is divided along **business capability boundaries** rather than technical layer boundaries. Each slice cuts vertically through all technical layers — UI, business logic, API, and database — for a single, self-contained feature domain.

```
┌─────────────────────────────────────────────────────────────┐
│                     APPLICATION                             │
├──────────────┬──────────────┬──────────────┬───────────────┤
│   Auth &     │   Product    │  Checkout &  │   Order       │
│   User Mgmt  │   Catalog    │  Shopping    │   Management  │
│              │              │    Cart      │   & Admin     │
│  (Member B)  │  (Member C)  │  (Member A)  │  (Member B+C) │
├──────────────┴──────────────┴──────────────┴───────────────┤
│  React Frontend (each member owns their feature's UI)      │
├─────────────────────────────────────────────────────────────┤
│  Node/Express Backend (each member owns their routes)      │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL (each member owns their schema migrations)     │
└─────────────────────────────────────────────────────────────┘
```

#### 2.3.2 Academic Foundation

The vertical slicing model is not an invention of this team. It is a well-established industry practice with a strong academic foundation:

> *"The single biggest predictor of software project success is the ability of teams to deliver working software in small, independently deployable increments."*
> — Forsgren, Humble & Kim, *Accelerate: The Science of Lean Software and DevOps* (2018)

The concept of vertical slicing is codified in the Scrum framework's definition of a **User Story** (Schwaber & Sutherland, 2020), which explicitly requires that each story deliver end-to-end value through all layers. The Scaled Agile Framework (SAFe) extends this with the concept of **Vertical Slice Architecture** as a prerequisite for Continuous Delivery.

Conway's Law (Conway, 1968) further supports this decision: *"Organizations which design systems are constrained to produce designs which are copies of the communication structures of those organizations."* A team with three members who communicate primarily within their own feature domains will naturally produce a system architected around features — fighting this tendency by enforcing artificial layer boundaries creates unnecessary friction.

#### 2.3.3 Direct Benefits Over the Layered Model

| Dimension | Horizontal Layered | Vertical Sliced |
|---|---|---|
| **Merge Conflict Risk** | HIGH — all members touch shared directories | MINIMAL — each member owns discrete file trees |
| **Development Velocity** | Sequential (blocked by dependencies) | Parallel (each slice is independently buildable) |
| **Testability** | Integration tests require all layers to be complete | Unit + integration tests can be written per-slice |
| **Grading Clarity** | Diffuse — "we all did everything" | Precise — "Member A owns all files under `checkout/`" |
| **Demo Readiness** | One broken layer breaks the entire demo | One broken slice does not affect other slices |
| **AI Tooling Fit** | AI generates layer code without business context | AI generates full feature code with clear domain scope |
| **Industry Alignment** | Classic, adequate for monoliths | Modern, mirrors microservice decomposition |

#### 2.3.4 Addressing the Rubric Risk

The original rubric assigns tasks by layer (e.g., "UI: 20 points, Backend: 20 points, DB: 20 points"). Under vertical slicing, each team member delivers all three layers for their feature, which means each member independently satisfies all rubric dimensions.

**This is a stronger position than the original, not a weaker one.** Under the layered model, if Member C (DB) submitted poor-quality work, the entire team's database score suffered regardless of the quality of Members A and B's work. Under vertical slicing, Member A's database work for the checkout feature is evaluated independently, insulating individual grades from peer quality variance.

If challenged by the grader, the following response is appropriate:

> *"The rubric evaluates deliverables (UI, logic, database), not the team's internal work allocation. Each team member has delivered all three tiers for their assigned feature domain, fully satisfying every rubric category. The architecture model is an internal engineering decision that improves quality, not a deviation from the deliverable specification."*

---

## 3. System Architecture & Tech Stack

### 3.1 Technology Selections

| Layer | Technology | Justification |
|---|---|---|
| **Frontend** | React 18 + Vite | Industry-standard SPA framework; JSX enforces component isolation per feature slice |
| **Styling** | Tailwind CSS | Utility-first; eliminates global CSS conflicts between feature slices |
| **State Management** | Zustand | Lightweight; per-slice stores avoid Redux boilerplate and cross-slice store coupling |
| **API Client** | Axios + React Query | Declarative data fetching; automatic cache invalidation; aligns with TDD patterns |
| **Backend** | Node.js + Express | Minimal framework; routes map cleanly to feature slice directories |
| **Validation** | Zod | Schema-first validation; shared between frontend and backend via a `shared/` package |
| **ORM** | Prisma | Schema-as-code; migrations are version-controlled and owned per slice |
| **Database** | PostgreSQL | ACID compliance required for transactional order processing |
| **Authentication** | JWT + bcrypt | Stateless; compatible with the vertical slice model |
| **Testing (Unit)** | Vitest + React Testing Library | Vite-native; zero-config |
| **Testing (E2E)** | Playwright | Browser automation; tests user journeys across slices |
| **CI/CD** | GitHub Actions | Free for student accounts; integrates with branch protection rules |
| **Containerisation** | Docker Compose | Reproducible dev environment; `db`, `backend`, `frontend` services |

### 3.2 Repository Structure

```
cse323-customer-ordering-system/
│
├── .ai/
│   └── CONTEXT.md                    # Master AI Brain — MUST be updated after every task
│
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Run tests on all PRs to develop
│       └── deploy.yml                # Deploy on merge to main
│
├── docs/
│   └── MASTER.md                     # This file
│
├── src/
│   ├── frontend/                     # React + Vite application
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── features/             # VERTICAL SLICE ROOT — one dir per feature
│   │   │   │   ├── auth/             # Member B
│   │   │   │   │   ├── components/
│   │   │   │   │   ├── hooks/
│   │   │   │   │   ├── store/
│   │   │   │   │   ├── api/
│   │   │   │   │   └── __tests__/
│   │   │   │   │
│   │   │   │   ├── catalog/          # Member C
│   │   │   │   │   ├── components/
│   │   │   │   │   ├── hooks/
│   │   │   │   │   ├── store/
│   │   │   │   │   ├── api/
│   │   │   │   │   └── __tests__/
│   │   │   │   │
│   │   │   │   ├── checkout/         # Member A — FULL OWNERSHIP
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── CartDrawer.tsx
│   │   │   │   │   │   ├── CartItem.tsx
│   │   │   │   │   │   ├── CartSummary.tsx
│   │   │   │   │   │   ├── CheckoutForm.tsx
│   │   │   │   │   │   ├── CheckoutStepper.tsx
│   │   │   │   │   │   ├── OrderConfirmation.tsx
│   │   │   │   │   │   ├── PaymentForm.tsx
│   │   │   │   │   │   ├── ShippingForm.tsx
│   │   │   │   │   │   └── PromoCodeInput.tsx
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   ├── useCart.ts
│   │   │   │   │   │   ├── useCheckout.ts
│   │   │   │   │   │   └── usePromoCode.ts
│   │   │   │   │   ├── store/
│   │   │   │   │   │   └── cartStore.ts
│   │   │   │   │   ├── api/
│   │   │   │   │   │   ├── cartApi.ts
│   │   │   │   │   │   └── checkoutApi.ts
│   │   │   │   │   ├── types/
│   │   │   │   │   │   └── checkout.types.ts
│   │   │   │   │   └── __tests__/
│   │   │   │   │       ├── CartItem.test.tsx
│   │   │   │   │       ├── CartSummary.test.tsx
│   │   │   │   │       ├── CheckoutForm.test.tsx
│   │   │   │   │       ├── cartStore.test.ts
│   │   │   │   │       └── useCart.test.ts
│   │   │   │   │
│   │   │   │   └── orders/           # Member B + C (shared post-checkout)
│   │   │   │
│   │   │   ├── shared/               # STRICTLY READ-ONLY for feature slices
│   │   │   │   ├── components/       # Generic UI primitives (Button, Input, Modal)
│   │   │   │   ├── hooks/            # Generic hooks (useDebounce, useLocalStorage)
│   │   │   │   ├── utils/            # Pure utility functions
│   │   │   │   └── types/            # Shared TypeScript types (User, Product)
│   │   │   │
│   │   │   ├── App.tsx               # Root router — touches only route definitions
│   │   │   └── main.tsx              # Entry point
│   │   │
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   └── tsconfig.json
│   │
│   ├── backend/                      # Node.js + Express API
│   │   ├── src/
│   │   │   ├── features/             # MIRRORS FRONTEND VERTICAL SLICE ROOT
│   │   │   │   ├── auth/             # Member B
│   │   │   │   ├── catalog/          # Member C
│   │   │   │   ├── checkout/         # Member A — FULL OWNERSHIP
│   │   │   │   │   ├── cart.routes.ts
│   │   │   │   │   ├── cart.controller.ts
│   │   │   │   │   ├── cart.service.ts
│   │   │   │   │   ├── checkout.routes.ts
│   │   │   │   │   ├── checkout.controller.ts
│   │   │   │   │   ├── checkout.service.ts
│   │   │   │   │   ├── checkout.validators.ts
│   │   │   │   │   └── __tests__/
│   │   │   │   │       ├── cart.service.test.ts
│   │   │   │   │       └── checkout.service.test.ts
│   │   │   │   └── orders/
│   │   │   │
│   │   │   ├── shared/
│   │   │   │   ├── middleware/       # Auth guard, error handler, request logger
│   │   │   │   ├── utils/
│   │   │   │   └── types/
│   │   │   │
│   │   │   ├── app.ts                # Express app factory
│   │   │   └── server.ts             # HTTP server entry point
│   │   │
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── database/                     # Prisma ORM + PostgreSQL
│       ├── schema.prisma             # Canonical data model
│       ├── migrations/               # Auto-generated — DO NOT hand-edit
│       │   ├── 001_init_users/
│       │   ├── 002_init_products/
│       │   ├── 003_checkout_cart/    # Member A's migration
│       │   └── 004_checkout_orders/  # Member A's migration
│       └── seed/
│           ├── products.seed.ts
│           └── users.seed.ts
│
├── docker-compose.yml
├── .env.example
└── README.md
```

### 3.3 Data Model — Checkout & Cart Domain

Member A owns the following Prisma models. No other team member may modify these without a formal RFC (Request for Change) documented in `.ai/CONTEXT.md`.

```prisma
// src/database/schema.prisma — CHECKOUT DOMAIN (Member A ownership)

model Cart {
  id         String     @id @default(cuid())
  userId     String?    // Null for guest carts (session-based)
  sessionId  String?    // Guest session identifier
  items      CartItem[]
  promoCode  String?
  discount   Float      @default(0)
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt

  user       User?      @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([sessionId])
}

model CartItem {
  id        String   @id @default(cuid())
  cartId    String
  productId String
  quantity  Int      @default(1)
  unitPrice Float    // Snapshotted at time of add — prevents price-change bugs
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  cart      Cart     @relation(fields: [cartId], references: [id], onDelete: Cascade)
  product   Product  @relation(fields: [productId], references: [id])

  @@unique([cartId, productId])
  @@index([cartId])
}

model Order {
  id              String      @id @default(cuid())
  userId          String?
  sessionId       String?
  status          OrderStatus @default(PENDING)
  items           OrderItem[]
  subtotal        Float
  discount        Float       @default(0)
  tax             Float
  shippingCost    Float
  total           Float
  promoCode       String?
  shippingAddress Json        // { street, city, state, zip, country }
  billingAddress  Json?
  paymentRef      String?     // External payment provider reference
  notes           String?
  placedAt        DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  user            User?       @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([status])
}

model OrderItem {
  id          String  @id @default(cuid())
  orderId     String
  productId   String
  productName String  // Snapshotted — order history must be immutable
  quantity    Int
  unitPrice   Float
  totalPrice  Float

  order       Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product     Product @relation(fields: [productId], references: [id])

  @@index([orderId])
}

model PromoCode {
  id              String   @id @default(cuid())
  code            String   @unique
  discountType    String   // "PERCENTAGE" | "FIXED"
  discountValue   Float
  minimumOrderValue Float  @default(0)
  usageLimit      Int?
  usageCount      Int      @default(0)
  expiresAt       DateTime?
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}
```

### 3.4 API Contract — Checkout & Cart Endpoints

All endpoints are prefixed with `/api/v1`. Authentication is enforced via the shared `authGuard` middleware where noted.

```
Cart Endpoints (Member A owns)
──────────────────────────────
GET    /api/v1/cart                   Get current cart (auth OR session)
POST   /api/v1/cart/items             Add item to cart
PUT    /api/v1/cart/items/:itemId     Update cart item quantity
DELETE /api/v1/cart/items/:itemId     Remove item from cart
DELETE /api/v1/cart                   Clear entire cart
POST   /api/v1/cart/promo             Apply promo code
DELETE /api/v1/cart/promo             Remove promo code

Checkout Endpoints (Member A owns)
───────────────────────────────────
POST   /api/v1/checkout/validate      Validate cart before payment
POST   /api/v1/checkout/shipping      Calculate shipping options
POST   /api/v1/checkout/order         Place order (converts cart → order)
GET    /api/v1/checkout/confirmation/:orderId  Get order confirmation
```

---

## 4. Strict Rulebook

### 4.1 Test-Driven Prompting (TDP) Protocol

Test-Driven Prompting is the mandatory workflow for all AI-assisted code generation in this project. It combines the discipline of Test-Driven Development (TDD) with structured AI prompting, creating an auditable trail that proves human engineering judgment governs AI output — not the reverse.

#### 4.1.1 The TDP Cycle

```
┌─────────────────────────────────────────────────────────┐
│                   TDP CYCLE                             │
│                                                         │
│  1. ENGINEER writes a FAILING TEST                      │
│     (defines the contract, not the implementation)      │
│           │                                             │
│           ▼                                             │
│  2. ENGINEER commits the failing test                   │
│     git commit -m "test(checkout): failing test         │
│     for CartService.addItem quantity guard"             │
│           │                                             │
│           ▼                                             │
│  3. ENGINEER prompts AI with:                           │
│     - The failing test (exact code)                     │
│     - The .ai/CONTEXT.md content                        │
│     - The explicit instruction:                         │
│       "Generate ONLY the minimum code to make           │
│        this test pass. Do not add untested logic."      │
│           │                                             │
│           ▼                                             │
│  4. AI generates implementation                         │
│           │                                             │
│           ▼                                             │
│  5. ENGINEER reviews AI output — accepts, rejects,      │
│     or modifies BEFORE pasting into codebase            │
│           │                                             │
│           ▼                                             │
│  6. ENGINEER runs tests — must go GREEN                 │
│     If not: return to step 3 with the error output      │
│           │                                             │
│           ▼                                             │
│  7. ENGINEER refactors (if needed) — tests stay green   │
│           │                                             │
│           ▼                                             │
│  8. ENGINEER updates .ai/CONTEXT.md                     │
│           │                                             │
│           ▼                                             │
│  9. ENGINEER commits: implementation + updated context  │
│     git commit -m "feat(checkout): CartService.addItem  │
│     with quantity guard [TDP]"                          │
└─────────────────────────────────────────────────────────┘
```

#### 4.1.2 Canonical TDP Prompt Template

Every AI prompt for code generation MUST follow this template. Deviations invalidate the TDP audit trail.

```
=== TDP PROMPT ===

PROJECT CONTEXT (from .ai/CONTEXT.md):
[Paste the full content of .ai/CONTEXT.md here]

CURRENT TASK:
Feature Slice: checkout
Sprint: [Sprint number and name]
Task ID: [e.g., S2-T3]

FAILING TEST (copy-paste exact test code):
```typescript
[paste the failing test here]
```

TEST RUNNER OUTPUT (showing failure):
```
[paste the test failure output here]
```

EXISTING FILES RELEVANT TO THIS TASK:
- [filename]: [brief description of current state]

INSTRUCTION:
Generate ONLY the minimum implementation code required to make the above failing test pass.
Do NOT:
  - Add methods, properties, or logic not covered by the test.
  - Change the test.
  - Add imports not required for the implementation.

Output ONLY the implementation file(s) with no commentary.
=== END TDP PROMPT ===
```

#### 4.1.3 Why TDP Protects Academic Integrity

TDP does not hide AI usage — it documents and governs it. The failing test, written entirely by the engineer before any AI involvement, is proof that:

1. The engineer understood the requirement deeply enough to specify it precisely.
2. The engineer defined the contract (interface, behavior, edge cases) independently.
3. The AI was used as a code-generation accelerator, not as a requirement-definition tool.

This is equivalent to a civil engineer using structural analysis software — the engineer defines the problem; the tool assists with computation. The intellectual contribution is in the test authorship, the context management, and the review of AI output.

### 4.2 Branch Naming Convention

All branches MUST follow this convention. PRs from non-compliant branch names will be rejected by the CI pipeline branch-name linter.

```
{type}/{slice}-{description}

Where:
  type        = feature | fix | test | refactor | chore | docs
  slice       = checkout | cart | auth | catalog | orders | shared | infra
  description = kebab-case description, max 40 characters

Examples (Member A):
  feature/checkout-react-form
  feature/checkout-stepper-component
  feature/cart-zustand-store
  feature/cart-add-item-api-integration
  fix/checkout-promo-code-validation
  test/cart-service-quantity-guard
  refactor/checkout-form-field-extraction
  docs/checkout-api-contract
```

**Prohibited patterns:**
- `feature/my-work` — no slice identifier
- `feature/checkout` — no description
- `Member-A-branch` — personal identifiers
- `main-backup` — never branch from a backup name
- Any branch with spaces or uppercase letters

### 4.3 Commit Message Convention

Follow the Conventional Commits specification (conventionalcommits.org).

```
{type}({scope}): {imperative description}

[optional body]

[optional footer: references, breaking changes]

---

Examples:

feat(checkout): add CheckoutStepper component with 3-step flow [TDP]

fix(cart): prevent duplicate product entries in cart store

test(checkout): add failing test for CartService.addItem quantity guard

refactor(cart): extract price calculation into pure utility function

docs(checkout): update API contract for /checkout/order endpoint

chore(infra): add Playwright config for checkout E2E suite
```

**Rules:**
- Type must be one of: `feat`, `fix`, `test`, `refactor`, `docs`, `chore`, `style`, `perf`, `ci`
- Scope must be the feature slice name: `checkout`, `cart`, `auth`, `catalog`, `orders`, `shared`, `infra`
- Description must be imperative mood ("add" not "added", "fix" not "fixes")
- Append `[TDP]` to any commit that contains AI-generated code
- Maximum 72 characters on the first line

### 4.4 The `.ai/CONTEXT.md` Master Brain

#### 4.4.1 Purpose

The `.ai/CONTEXT.md` file is the single source of truth for project state. It serves two audiences simultaneously:

1. **Human team members** who need to understand the current state of every feature slice without reading code.
2. **AI assistants** who need complete project context to generate accurate, non-contradictory code.

A stale `CONTEXT.md` is worse than no `CONTEXT.md`. It causes AI to generate code that conflicts with the actual codebase state, producing bugs that are difficult to trace.

#### 4.4.2 Required Structure

```markdown
# .ai/CONTEXT.md

**Last Updated:** [ISO 8601 datetime]
**Updated By:** [Member initial + task ID]
**Git Hash:** [first 8 chars of last commit hash]

---

## Project State Summary

[2-3 sentences describing the overall current state of the project]

---

## Feature Slice Status

| Slice | Owner | Status | Last Completed Task | Blockers |
|---|---|---|---|---|
| auth | Member B | 🟡 In Progress | S1-T3: JWT middleware | None |
| catalog | Member C | 🟢 Complete (Sprint 1) | S1-T5: Product list API | None |
| checkout | Member A | 🟡 In Progress | S2-T2: CartStore | Needs Product type from catalog |
| orders | Shared | 🔴 Not Started | — | Blocked on checkout |

---

## Checkout Slice — Detailed State (Member A)

### Completed Components / Files
- [List every completed file with a one-line description of what it does]

### Current In-Progress Task
- **Task ID:** [e.g., S2-T3]
- **Description:** [What you are currently building]
- **Failing Test Location:** [path/to/test.ts]
- **Blockers:** [Any dependencies not yet available]

### API Contract (Current)
[List every endpoint that has been implemented, with status: ✅ Complete | 🔄 In Progress | ❌ Not Started]

### Database Models (Current)
[List every Prisma model owned by this slice with migration status]

### Known Issues / Technical Debt
[Honest list of shortcuts taken, edge cases deferred, or known bugs]

### Next 3 Tasks
1. [Task ID]: [Description]
2. [Task ID]: [Description]
3. [Task ID]: [Description]

---

## Shared Contracts (Read-Only for Checkout)

### Types from `src/frontend/src/shared/types/`
[List the types that checkout depends on from the shared layer, with their current shape]

### Middleware from `src/backend/src/shared/middleware/`
[List middleware that checkout routes use, with their current signatures]

---

## Environment & Infrastructure

- **Local dev:** `docker compose up -d` starts all services
- **Test command:** `cd src/frontend && npm test -- --watch=false`
- **Backend test:** `cd src/backend && npm test`
- **DB migration:** `cd src/database && npx prisma migrate dev`
- **Active ports:** Frontend: 5173 | Backend: 3001 | DB: 5432

---

## AI Prompting Notes

[Notes on patterns that worked well or poorly with AI generation for this project.
For example: "Zod schemas: always provide the target TypeScript type first before asking
for the schema — AI generates more accurate schemas with the type as a reference."]
```

#### 4.4.3 Update Triggers

`CONTEXT.md` MUST be updated (and the update committed) in ALL of the following situations:

- After any TDP cycle completes (implementation passes tests)
- After any database migration is applied
- After any API endpoint is added, modified, or removed
- After any new shared type or utility is added to `src/*/shared/`
- Before starting any new sprint task
- When a blocker is identified or resolved
- When the tech stack or a dependency changes

Failure to update `CONTEXT.md` is treated as a blocking PR review issue — no merge without a current context file.

### 4.5 Pull Request Protocol

```
PR Title Format:
  [SLICE][TYPE] Description matching commit message

PR Body Required Sections:
  ## What this PR does
  [Plain English description of the change]

  ## TDP Evidence
  - [ ] Failing test committed before implementation (commit hash: ______)
  - [ ] All new code is covered by at least one test
  - [ ] AI-generated commits are tagged [TDP]
  - [ ] .ai/CONTEXT.md updated

  ## Test Results
  [Paste or screenshot of passing test output]

  ## Checklist
  - [ ] Branch name follows convention
  - [ ] Commits follow Conventional Commits spec
  - [ ] No files outside my slice's directory tree are modified
  - [ ] No merge conflicts with develop
```

**PR Rules:**
- All PRs target `develop`, never `main`
- Minimum 1 reviewer (another team member) before merge
- CI must be green (tests pass, branch name lints pass)
- PRs that touch files outside the author's slice require explicit written approval from the slice owner of the affected files

---

## 5. Master Scope & Sprints — Checkout & Shopping Cart

### 5.1 Feature Scope Definition

Member A owns the complete Checkout & Shopping Cart feature, defined as:

**In Scope:**
- Shopping cart state management (add, update, remove, clear items)
- Cart persistence (authenticated users: DB-backed; guests: session-based with DB migration on login)
- Cart UI (drawer/sidebar, item list, quantity controls, price summary)
- Promo code application and validation
- Multi-step checkout flow (Cart Review → Shipping → Payment → Confirmation)
- Shipping address form with validation
- Payment form (simulated — no real payment gateway required for academic scope)
- Order placement (converting cart → order record)
- Order confirmation page
- Backend REST API for all above
- Database schema and migrations for Cart, CartItem, Order, OrderItem, PromoCode
- Unit tests for all service layer logic
- Integration tests for all API endpoints
- E2E test for the complete checkout happy path

**Out of Scope (owned by other slices):**
- Product data and product listing (Member C — catalog slice)
- User authentication and session management (Member B — auth slice)
- Order history and admin order management (Member B+C — orders slice)
- Payment gateway integration (deferred — out of academic scope)
- Email notifications (deferred — out of academic scope)

### 5.2 Sprint Overview

| Sprint | Name | Duration | Primary Goal |
|---|---|---|---|
| Sprint 0 | Infrastructure & Foundations | Week 1 | Dev environment, schema, shared types |
| Sprint 1 | Cart Core | Week 2 | Cart store, backend API, basic UI |
| Sprint 2 | Cart UX Polish | Week 3 | Drawer UI, quantity controls, promo codes |
| Sprint 3 | Checkout Flow | Week 4 | Multi-step form, validation |
| Sprint 4 | Order Placement | Week 5 | Order creation, confirmation |
| Sprint 5 | Testing & Hardening | Week 6 | E2E tests, edge cases, bug fixes |

---

### 5.3 Sprint 0 — Infrastructure & Foundations

**Goal:** Establish the dev environment, database schema, and shared contracts so that all subsequent sprint work can proceed without infrastructure blockers.

**Exit Criteria:** `docker compose up -d` starts all services cleanly. Prisma migrations apply without error. Shared TypeScript types compile. All team members can run the test suite locally.

---

#### S0-T1: Docker Compose Environment Setup

**Description:** Create the `docker-compose.yml` with three services: `db` (PostgreSQL 15), `backend` (Node.js with hot-reload), `frontend` (Vite dev server).

**Acceptance Criteria:**
- `docker compose up -d` starts all services without error
- Frontend at `http://localhost:5173` returns HTTP 200
- Backend at `http://localhost:3001/health` returns `{ "status": "ok" }`
- Database is reachable from the backend container

**Failing Test (integration smoke test):**
```typescript
// src/backend/src/__tests__/health.test.ts
describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
```

**TDP Tag:** Yes — backend `app.ts` and route wiring are AI-generated after this test.

---

#### S0-T2: Prisma Schema — Checkout Domain

**Description:** Define the Prisma models for `Cart`, `CartItem`, `Order`, `OrderItem`, and `PromoCode` as specified in Section 3.3. Run `prisma migrate dev` to apply.

**Acceptance Criteria:**
- `npx prisma migrate dev` completes without error
- `npx prisma studio` shows all five tables with correct columns
- `npx prisma generate` produces TypeScript types

**Failing Test:**
```typescript
// src/database/__tests__/schema.test.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

describe('Checkout schema', () => {
  it('can create and retrieve a Cart record', async () => {
    const cart = await prisma.cart.create({ data: { sessionId: 'test-session-001' } });
    expect(cart.id).toBeDefined();
    expect(cart.sessionId).toBe('test-session-001');
    await prisma.cart.delete({ where: { id: cart.id } });
  });
});
```

---

#### S0-T3: Shared TypeScript Types

**Description:** Define the shared frontend TypeScript types that the checkout slice depends on from the shared layer and from the catalog slice. Coordinate with Member C to agree on the `Product` type shape.

**Types to Define:**
```typescript
// src/frontend/src/shared/types/product.types.ts (coordinate with Member C)
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
  category: string;
}

// src/frontend/src/features/checkout/types/checkout.types.ts (Member A owns)
export interface CartItem {
  id: string;
  productId: string;
  product: Pick<Product, 'id' | 'name' | 'imageUrl' | 'price'>;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  promoCode: string | null;
  itemCount: number;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface CheckoutFormData {
  shipping: ShippingAddress;
  paymentRef: string; // Simulated — real token in production
}

export interface Order {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  shippingCost: number;
  total: number;
  shippingAddress: ShippingAddress;
  placedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type CheckoutStep = 'cart' | 'shipping' | 'payment' | 'confirmation';
```

**Acceptance Criteria:** `npx tsc --noEmit` passes with zero errors.

---

### 5.4 Sprint 1 — Cart Core

**Goal:** Implement the foundational cart functionality: Zustand store, backend API (all cart endpoints), Zod validation schemas, and the basic cart API client. By the end of this sprint, items can be added to and retrieved from a persistent cart via API calls — even without UI.

**Exit Criteria:** All cart backend endpoints return correct responses when called via `curl` or Postman. The Zustand store correctly models cart state in isolation (unit tested). The API client successfully calls the backend endpoints from the frontend.

---

#### S1-T1: Zod Validation Schemas — Cart

**Description:** Define Zod schemas for all cart API request bodies. These schemas are used by the backend validators and exported for potential frontend reuse.

**Failing Test:**
```typescript
// src/backend/src/features/checkout/__tests__/cart.validators.test.ts
import { addItemSchema, updateQuantitySchema } from '../checkout.validators';

describe('addItemSchema', () => {
  it('accepts valid payload', () => {
    const result = addItemSchema.safeParse({ productId: 'prod_123', quantity: 2 });
    expect(result.success).toBe(true);
  });

  it('rejects quantity less than 1', () => {
    const result = addItemSchema.safeParse({ productId: 'prod_123', quantity: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects missing productId', () => {
    const result = addItemSchema.safeParse({ quantity: 1 });
    expect(result.success).toBe(false);
  });
});

describe('updateQuantitySchema', () => {
  it('rejects quantity greater than 99', () => {
    const result = updateQuantitySchema.safeParse({ quantity: 100 });
    expect(result.success).toBe(false);
  });
});
```

**TDP Tag:** Yes — `checkout.validators.ts` AI-generated after this test.

---

#### S1-T2: CartService — Core Business Logic

**Description:** Implement `CartService` with methods: `getOrCreateCart`, `addItem`, `updateItemQuantity`, `removeItem`, `clearCart`. The service operates on the Prisma client.

**Failing Tests (excerpt — write all before implementation):**
```typescript
// src/backend/src/features/checkout/__tests__/cart.service.test.ts
import { CartService } from '../cart.service';
// (prisma client is mocked via vitest.mock)

describe('CartService.addItem', () => {
  it('creates a new CartItem when product not in cart', async () => { ... });
  it('increments quantity when product already in cart', async () => { ... });
  it('throws CartError when quantity would exceed 99', async () => { ... });
  it('throws CartError when product stock is 0', async () => { ... });
  it('snapshots the product price at time of add', async () => { ... });
});

describe('CartService.updateItemQuantity', () => {
  it('updates quantity to the specified value', async () => { ... });
  it('removes item when quantity is set to 0', async () => { ... });
  it('throws CartItemNotFoundError for invalid itemId', async () => { ... });
});

describe('CartService.removeItem', () => {
  it('deletes the CartItem record', async () => { ... });
  it('throws CartItemNotFoundError for invalid itemId', async () => { ... });
});

describe('CartService.clearCart', () => {
  it('deletes all CartItems for the given cartId', async () => { ... });
});
```

**Acceptance Criteria:** All unit tests pass. Service layer has zero direct HTTP dependencies (pure business logic).

**TDP Tag:** Yes.

---

#### S1-T3: Cart REST API Routes

**Description:** Implement Express route handlers for all seven cart endpoints (listed in Section 3.4). Controllers call `CartService` methods and handle errors with appropriate HTTP status codes.

**Failing Tests:**
```typescript
// src/backend/src/features/checkout/__tests__/cart.routes.test.ts
import request from 'supertest';
import app from '../../../app';

describe('POST /api/v1/cart/items', () => {
  it('returns 201 with the updated cart on success', async () => {
    const res = await request(app)
      .post('/api/v1/cart/items')
      .set('x-session-id', 'test-session')
      .send({ productId: 'prod_1', quantity: 1 });
    expect(res.status).toBe(201);
    expect(res.body.items).toHaveLength(1);
  });

  it('returns 400 on invalid payload', async () => {
    const res = await request(app)
      .post('/api/v1/cart/items')
      .set('x-session-id', 'test-session')
      .send({ quantity: -1 });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('returns 409 when stock is insufficient', async () => { ... });
});

describe('DELETE /api/v1/cart/items/:itemId', () => {
  it('returns 204 on successful removal', async () => { ... });
  it('returns 404 for unknown itemId', async () => { ... });
});
```

**TDP Tag:** Yes — controllers and route files AI-generated after integration tests are written.

---

#### S1-T4: Zustand Cart Store

**Description:** Implement the frontend Zustand store for cart state. The store manages the local cart state and exposes actions that call the backend API.

**Failing Tests:**
```typescript
// src/frontend/src/features/checkout/__tests__/cartStore.test.ts
import { renderHook, act } from '@testing-library/react';
import { useCartStore } from '../store/cartStore';

// Mock the API client
vi.mock('../api/cartApi');

describe('cartStore', () => {
  beforeEach(() => useCartStore.getState().reset());

  it('initial state has empty items and zero totals', () => {
    const { items, subtotal, total } = useCartStore.getState();
    expect(items).toHaveLength(0);
    expect(subtotal).toBe(0);
    expect(total).toBe(0);
  });

  it('addItem calls API and updates store on success', async () => {
    const { result } = renderHook(() => useCartStore());
    await act(() => result.current.addItem('prod_1', 2));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.itemCount).toBe(2);
  });

  it('optimistically updates quantity before API responds', async () => { ... });
  it('rolls back optimistic update on API error', async () => { ... });
  it('correctly computes subtotal from item prices and quantities', async () => { ... });
  it('applies discount when promoCode is set', async () => { ... });
});
```

**TDP Tag:** Yes.

---

#### S1-T5: Cart API Client

**Description:** Implement `cartApi.ts` — the frontend Axios-based API client that wraps all cart endpoints. All functions return typed responses.

**Acceptance Criteria:** TypeScript compiles with no errors. All functions use the `Cart` and `CartItem` types from `checkout.types.ts`. Error responses are wrapped in a typed `CartApiError` class.

---

### 5.5 Sprint 2 — Cart UX Polish

**Goal:** Build the visual cart experience. By the end of this sprint, a user can open a cart drawer, see their items, change quantities, remove items, and apply a promo code — all with real backend integration.

**Exit Criteria:** Visual regression tests pass. Quantity updates are optimistic (UI updates before API responds). Promo code validation provides clear error messages.

---

#### S2-T1: CartItem Component

**Description:** Build the `CartItem` React component. Displays product image, name, unit price, a quantity stepper (decrement / count / increment), total price, and a remove button.

**Failing Tests:**
```typescript
// src/frontend/src/features/checkout/__tests__/CartItem.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import CartItem from '../components/CartItem';

const mockItem = {
  id: 'ci_1', productId: 'p_1',
  product: { id: 'p_1', name: 'Test Product', imageUrl: '/img.jpg', price: 29.99 },
  quantity: 2, unitPrice: 29.99, totalPrice: 59.98
};

describe('CartItem', () => {
  it('renders product name and total price', () => {
    render(<CartItem item={mockItem} onQuantityChange={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$59.98')).toBeInTheDocument();
  });

  it('calls onQuantityChange with incremented value on + click', () => {
    const onChange = vi.fn();
    render(<CartItem item={mockItem} onQuantityChange={onChange} onRemove={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('Increase quantity'));
    expect(onChange).toHaveBeenCalledWith(mockItem.id, 3);
  });

  it('calls onQuantityChange with 0 on - click when quantity is 1', () => { ... });
  it('disables decrement button when quantity is 1', () => { ... });
  it('calls onRemove with item id when remove button clicked', () => { ... });
  it('displays a loading spinner while quantity update is in flight', () => { ... });
});
```

**TDP Tag:** Yes.

---

#### S2-T2: CartSummary Component

**Description:** Build `CartSummary` — displays subtotal, discount (if promo applied), shipping estimate, and total. Includes a "Proceed to Checkout" button.

**Failing Tests:**
```typescript
describe('CartSummary', () => {
  it('displays subtotal correctly', () => { ... });
  it('shows discount row only when promoCode is applied', () => { ... });
  it('displays "FREE" for shipping when total exceeds free shipping threshold', () => { ... });
  it('disables "Proceed to Checkout" button when cart is empty', () => { ... });
  it('calls onCheckout when button is clicked', () => { ... });
});
```

---

#### S2-T3: CartDrawer Component

**Description:** Build `CartDrawer` — a slide-in panel (accessible, focus-trapped) that renders `CartItem` list and `CartSummary`. Controlled by a boolean `isOpen` prop.

**Acceptance Criteria:**
- ARIA role `dialog` with `aria-modal="true"`
- Keyboard accessible: `Escape` closes the drawer
- Focus is trapped within the drawer when open
- Clicking the overlay closes the drawer
- Smooth CSS transition on open/close

**Failing Tests:**
```typescript
describe('CartDrawer', () => {
  it('renders cart items when open', () => { ... });
  it('is not in the DOM when closed (or has aria-hidden)', () => { ... });
  it('closes on Escape key press', async () => { ... });
  it('closes on overlay click', async () => { ... });
  it('traps focus within drawer when open', async () => { ... });
  it('shows empty state message when cart has no items', () => { ... });
});
```

---

#### S2-T4: PromoCodeInput Component & Backend Validation

**Description:** Build the promo code UI component and the backend promo validation endpoint (`POST /api/v1/cart/promo`). The backend checks `PromoCode` table for active, non-expired, usage-limit-respecting codes.

**Failing Tests — Backend:**
```typescript
describe('POST /api/v1/cart/promo', () => {
  it('returns 200 with updated cart on valid code', async () => { ... });
  it('returns 404 for unknown promo code', async () => { ... });
  it('returns 422 when code is expired', async () => { ... });
  it('returns 422 when usage limit is reached', async () => { ... });
  it('returns 422 when cart subtotal is below minimum order value', async () => { ... });
});
```

**Failing Tests — Frontend:**
```typescript
describe('PromoCodeInput', () => {
  it('displays success message and discount when valid code applied', async () => { ... });
  it('displays specific error message from API on failure', async () => { ... });
  it('shows loading state during API call', () => { ... });
  it('allows removing applied promo code', async () => { ... });
});
```

---

### 5.6 Sprint 3 — Checkout Flow

**Goal:** Implement the multi-step checkout experience: Cart Review → Shipping Information → Payment → Place Order. All form validation uses Zod schemas mirrored from the backend.

**Exit Criteria:** A user can complete all checkout steps. Form validation provides inline error messages. Navigation between steps preserves form state.

---

#### S3-T1: CheckoutStepper Component

**Description:** Build `CheckoutStepper` — a visual progress indicator showing the current checkout step. Steps: "Cart" → "Shipping" → "Payment" → "Confirmation". Shows completed, current, and upcoming step states.

**Failing Tests:**
```typescript
describe('CheckoutStepper', () => {
  it('marks all steps before currentStep as complete', () => { ... });
  it('marks currentStep as active', () => { ... });
  it('marks steps after currentStep as upcoming', () => { ... });
  it('renders correct step labels', () => { ... });
  it('is accessible: steps have aria-current="step" on active step', () => { ... });
});
```

---

#### S3-T2: ShippingForm Component with Zod Validation

**Description:** Build `ShippingForm` — a form collecting first name, last name, street address, city, state/province, postal code, and country. Uses `react-hook-form` with Zod resolver. Validation mirrors the backend Zod schema.

**Failing Tests:**
```typescript
describe('ShippingForm', () => {
  it('renders all required fields', () => { ... });
  it('shows inline error for empty required field on blur', async () => { ... });
  it('validates postal code format for selected country', async () => { ... });
  it('calls onSubmit with correct data on valid submission', async () => { ... });
  it('does not call onSubmit when form has validation errors', async () => { ... });
  it('pre-populates fields when initialValues prop is provided', () => { ... });
});
```

---

#### S3-T3: PaymentForm Component (Simulated)

**Description:** Build `PaymentForm` — a simulated payment form collecting card number (masked), expiry, and CVV. **No real payment processing.** On submit, generates a mock `paymentRef` UUID. Includes a "Simulated Payment" disclaimer for academic context.

**Acceptance Criteria:**
- Card number field formats input as `XXXX XXXX XXXX XXXX` using an input mask
- Expiry field validates MM/YY format and rejects past dates
- CVV field is 3–4 digits
- On "Place Order" click, generates `paymentRef = crypto.randomUUID()` and calls parent's `onPaymentComplete` callback

**Failing Tests:**
```typescript
describe('PaymentForm', () => {
  it('formats card number with spaces every 4 digits', async () => { ... });
  it('rejects expired card dates', async () => { ... });
  it('rejects CVV with fewer than 3 digits', async () => { ... });
  it('generates a paymentRef UUID on valid submission', async () => { ... });
});
```

---

#### S3-T4: CheckoutForm Orchestrator Component

**Description:** Build `CheckoutForm` — the parent component that orchestrates all checkout steps. Manages `currentStep` state, collects form data across steps, and coordinates the final order submission.

**State managed by CheckoutForm:**
```typescript
interface CheckoutState {
  step: CheckoutStep;
  cart: Cart;
  shippingData: ShippingAddress | null;
  paymentRef: string | null;
}
```

**Failing Tests:**
```typescript
describe('CheckoutForm', () => {
  it('renders CartSummary on step "cart"', () => { ... });
  it('advances to "shipping" step after cart review', async () => { ... });
  it('advances to "payment" step after valid shipping submission', async () => { ... });
  it('returns to "shipping" step when back button clicked on payment', async () => { ... });
  it('calls placeOrder API after payment completion', async () => { ... });
  it('navigates to confirmation on successful order placement', async () => { ... });
  it('shows an error toast and stays on payment step if placeOrder fails', async () => { ... });
});
```

---

### 5.7 Sprint 4 — Order Placement & Confirmation

**Goal:** Implement the backend order placement logic (cart → order transaction) and the frontend order confirmation page.

**Exit Criteria:** Placing an order creates an `Order` and `OrderItem` records in the database. The cart is cleared. The confirmation page displays order details correctly. Order IDs are correctly passed via URL params.

---

#### S4-T1: CheckoutService — Place Order

**Description:** Implement `CheckoutService.placeOrder()`. This is the most critical and complex service method in the slice.

**Business Logic Requirements:**
1. Begin a Prisma database transaction
2. Validate cart is not empty
3. Re-validate all item prices against current product prices (prevent stale price exploits)
4. Re-validate all item quantities against current product stock
5. Calculate subtotal, discount (if promo applied), tax (fixed 8%), shipping cost
6. Create the `Order` record with status `PENDING`
7. Create all `OrderItem` records with snapshotted product names and prices
8. Decrement product stock for each ordered item
9. Increment `PromoCode.usageCount` if a promo was applied
10. Clear the cart (delete all `CartItem` records)
11. Update `Order.status` to `CONFIRMED`
12. Commit the transaction
13. Return the completed `Order`
14. On ANY failure: rollback the entire transaction

**Failing Tests:**
```typescript
describe('CheckoutService.placeOrder', () => {
  it('creates Order and OrderItems in a single transaction', async () => { ... });
  it('clears the cart after successful order placement', async () => { ... });
  it('decrements product stock for each ordered item', async () => { ... });
  it('throws StockChangedError if stock is insufficient at placement time', async () => { ... });
  it('throws PriceChangedError if any item price has changed since add-to-cart', async () => { ... });
  it('rolls back entire transaction if any step fails', async () => { ... });
  it('snapshots product name in OrderItem (not relying on join)', async () => { ... });
  it('increments PromoCode usageCount when promo is applied', async () => { ... });
});
```

**TDP Tag:** Yes — this service method is the primary TDP showcase for academic demonstration.

---

#### S4-T2: Order Placement API Endpoint

**Description:** Implement `POST /api/v1/checkout/order`. Calls `CheckoutService.placeOrder()`. Returns the created Order on success.

**Failing Tests:**
```typescript
describe('POST /api/v1/checkout/order', () => {
  it('returns 201 with order data on success', async () => { ... });
  it('returns 409 when stock is insufficient', async () => { ... });
  it('returns 402 when price has changed since cart add', async () => { ... });
  it('returns 400 when cart is empty', async () => { ... });
});
```

---

#### S4-T3: OrderConfirmation Component

**Description:** Build `OrderConfirmation` — displays the completed order details. Fetches order data using the `orderId` from URL params via `GET /api/v1/checkout/confirmation/:orderId`.

**Displayed Information:**
- Order ID (formatted: `#ORD-{shortId}`)
- Order date and estimated delivery
- Ordered items with names, quantities, prices
- Shipping address
- Order totals breakdown (subtotal, discount, tax, shipping, total)
- "Continue Shopping" CTA button

**Failing Tests:**
```typescript
describe('OrderConfirmation', () => {
  it('fetches order data using orderId from URL params', async () => { ... });
  it('renders order ID in formatted display', async () => { ... });
  it('renders all order items with correct quantities and prices', async () => { ... });
  it('renders shipping address', async () => { ... });
  it('renders total breakdown', async () => { ... });
  it('shows loading state while fetching', () => { ... });
  it('shows error state for invalid orderId', async () => { ... });
});
```

---

### 5.8 Sprint 5 — Testing & Hardening

**Goal:** Achieve comprehensive test coverage. Write the E2E happy path test. Fix all known edge cases. Conduct a self-review of all code against the rubric.

---

#### S5-T1: E2E — Complete Checkout Happy Path

**Description:** Write a Playwright E2E test that simulates a real user completing the entire checkout flow.

```typescript
// src/frontend/e2e/checkout-happy-path.spec.ts
import { test, expect } from '@playwright/test';

test('complete checkout happy path', async ({ page }) => {
  // 1. Navigate to product catalog
  await page.goto('/products');

  // 2. Add a product to cart
  await page.click('[data-testid="add-to-cart-btn-prod_1"]');
  await expect(page.locator('[data-testid="cart-item-count"]')).toHaveText('1');

  // 3. Open cart drawer
  await page.click('[data-testid="cart-drawer-toggle"]');
  await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible();

  // 4. Verify cart item
  await expect(page.locator('[data-testid="cart-item-name"]')).toContainText('Test Product');

  // 5. Proceed to checkout
  await page.click('[data-testid="proceed-to-checkout-btn"]');
  await expect(page).toHaveURL('/checkout');

  // 6. Fill shipping form
  await page.fill('[name="firstName"]', 'Ahmed');
  await page.fill('[name="lastName"]', 'Hassan');
  await page.fill('[name="street"]', '123 Nile Street');
  await page.fill('[name="city"]', 'Cairo');
  await page.fill('[name="zip"]', '11511');
  await page.selectOption('[name="country"]', 'EG');
  await page.click('[data-testid="continue-to-payment-btn"]');

  // 7. Fill simulated payment form
  await page.fill('[name="cardNumber"]', '4111 1111 1111 1111');
  await page.fill('[name="expiry"]', '12/28');
  await page.fill('[name="cvv"]', '123');
  await page.click('[data-testid="place-order-btn"]');

  // 8. Verify confirmation page
  await expect(page).toHaveURL(/\/checkout\/confirmation\/.+/);
  await expect(page.locator('[data-testid="order-id-display"]')).toBeVisible();
  await expect(page.locator('[data-testid="confirmation-items"]')).toContainText('Test Product');
});
```

---

#### S5-T2: Edge Case Coverage

**Description:** Write additional unit and integration tests for edge cases not covered in previous sprints.

**Required Edge Cases:**
- Guest cart merges with user cart on login (cart items preserved)
- Adding same product twice merges quantities rather than creating duplicate entries
- Cart with 0-stock product shows "Out of Stock" badge and prevents checkout
- Promo code is case-insensitive (`SAVE10` === `save10`)
- Order confirmation page is inaccessible for order IDs belonging to other users
- Cart total correctly rounds to 2 decimal places (floating point guard)
- Checkout step state is not lost on browser back button (history.pushState awareness)

---

#### S5-T3: Coverage Report & Rubric Self-Review

**Description:** Generate a test coverage report. All files in `src/features/checkout/` must achieve minimum 80% line coverage. Conduct a self-review mapping each deliverable to the rubric line items.

```bash
# Coverage command
cd src/frontend && npx vitest run --coverage
cd src/backend && npx vitest run --coverage

# Target thresholds (set in vitest.config.ts)
coverage: {
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 70
  }
}
```

---

## 6. Risk Register

### 6.1 Risk Overview

| Risk ID | Risk Title | Likelihood | Impact | Severity | Owner |
|---|---|---|---|---|---|
| R-01 | Git merge conflicts | Medium | High | HIGH | All Members |
| R-02 | Grading rubric misalignment | Low | High | MEDIUM | Member A |
| R-03 | AI context desynchronization | High | Medium | HIGH | Member A |
| R-04 | Shared type contract breakage | Medium | High | HIGH | All Members |
| R-05 | Sprint scope creep | Medium | Medium | MEDIUM | Member A |
| R-06 | Test environment instability | Low | High | MEDIUM | All Members |
| R-07 | Team member contribution imbalance | Medium | Medium | MEDIUM | All Members |

---

### 6.2 Risk Detail & Mitigation Plans

#### R-01: Git Merge Conflicts

**Root Cause Analysis:** Merge conflicts arise when two or more contributors modify the same file concurrently. Under vertical slicing, each team member owns a discrete file tree. However, conflicts can still occur in shared files: `App.tsx` (route definitions), `schema.prisma` (all models), `docker-compose.yml`, and `package.json` files.

**Mitigation — Structural:**
1. **Route Registration Protocol:** `App.tsx` uses a route configuration array. Each member exports their routes from their slice's `routes.ts` file. `App.tsx` simply imports and spreads them. No member needs to edit `App.tsx` directly after initial setup.
   ```typescript
   // App.tsx — untouched after Sprint 0
   import { checkoutRoutes } from './features/checkout/routes';
   import { catalogRoutes } from './features/catalog/routes';
   import { authRoutes } from './features/auth/routes';
   const allRoutes = [...authRoutes, ...catalogRoutes, ...checkoutRoutes];
   ```

2. **Schema Prisma Protocol:** The `schema.prisma` file is edited exclusively via new migration files. Members never hand-edit `schema.prisma` directly. Instead, each member runs `prisma migrate dev --name {slice}_{description}` which appends only their models. Changes to `schema.prisma` require a dedicated PR that is not in-flight simultaneously with any other schema PR.

3. **Package.json Protocol:** `package.json` changes require a dedicated PR with the subject line `chore(deps): add {package-name}`. No feature PR should include dependency changes.

**Mitigation — Process:**
- Branch protection on `develop`: require PR merge, no direct pushes.
- Rebase-before-merge policy: all feature branches must rebase onto `develop` immediately before merging, minimizing the window for conflicts.
- Daily sync check: each team member runs `git fetch && git log HEAD..origin/develop --oneline` at the start of each work session.

**Escalation Plan:** If a conflict occurs in a shared file, the resolution meeting follows this protocol: (1) the PR author calls both other members, (2) conflict resolution is done via screen share, (3) the resolution is documented in the PR comment, (4) the `CONTEXT.md` is updated to reflect any interface changes.

---

#### R-02: Grading Rubric Misalignment

**Root Cause Analysis:** The original rubric may award points per-layer (UI layer, business logic layer, database layer). If the grader interprets vertical slicing as "Member A only did the frontend", the individual grades could suffer.

**Mitigation — Documentation:**
This document (Section 2) provides comprehensive academic justification for the architectural pivot. Additionally, Member A's deliverable spans all three layers — React components, Express services, and Prisma migrations — which satisfies every rubric dimension independently.

**Mitigation — Grader Communication:**
Prepare a one-page "Architecture Decision Record" (ADR) summarizing the pivot, attached as `docs/ADR-001-vertical-slicing.md`. Submit alongside the project. If the grader raises concerns, reference this document and Section 2 of this master file.

**Mitigation — Rubric Mapping Table:**
```
Rubric Item         | Member A's Deliverable
--------------------|--------------------------------------------------
UI (20 pts)         | CartDrawer, CheckoutForm, ShippingForm, etc.
Business Logic      | CartService, CheckoutService with full unit tests
(20 pts)            |
Database (20 pts)   | Cart, CartItem, Order, OrderItem, PromoCode models
                    | + migrations 003 and 004
Testing (20 pts)    | Unit, integration, E2E — all in checkout/__tests__/
Documentation       | This MASTER.md + .ai/CONTEXT.md + inline JSDoc
(20 pts)            |
```

---

#### R-03: AI Context Desynchronization

**Root Cause Analysis:** When `.ai/CONTEXT.md` is not updated after a completed task, subsequent AI prompts receive stale information. The AI may generate code that imports non-existent modules, uses outdated function signatures, or duplicates logic already implemented. This is the most likely failure mode in AI-assisted development.

**Mitigation — Mandatory Update Gates:**
The `CONTEXT.md` is updated as part of the TDP cycle (Step 8), not as a separate optional step. It is included in the same commit as the implementation. CI linting checks that the `CONTEXT.md` `Last Updated` timestamp is more recent than the last non-`CONTEXT.md` commit in the `checkout/` directory tree.

**Mitigation — Structured Context Sections:**
The `CONTEXT.md` structure (Section 4.4.2) is designed so that the most critical information for AI prompting — currently completed files, current in-progress task, API contracts, data model shapes — is always in fixed, scannable sections at the top.

**Mitigation — Stale Context Detection:**
Before any TDP session, run this check:
```bash
git log --oneline -10 -- src/frontend/src/features/checkout/ src/backend/src/features/checkout/
git log --oneline -1 -- .ai/CONTEXT.md
# CONTEXT.md commit should be the most recent
```

If the most recent commit in the checkout directories post-dates the `CONTEXT.md` commit, update `CONTEXT.md` before prompting.

**Recovery Plan:** If stale context causes AI to generate broken code, the fix is to (1) update `CONTEXT.md`, (2) re-run the failing test, and (3) run the TDP cycle again with the updated context. The broken generated code is discarded entirely — never patched incrementally.

---

#### R-04: Shared Type Contract Breakage

**Root Cause Analysis:** If Member C changes the `Product` type (e.g., renames `imageUrl` to `image`), the checkout slice's `CartItem` type breaks silently — TypeScript will not catch this at compile time unless both files are checked together.

**Mitigation — Contract Freeze Protocol:**
Once a shared type is consumed by any other slice, it is frozen. Changes require an RFC documented in `CONTEXT.md` with a migration plan. The RFC must be approved by all slice owners who depend on the type.

**Mitigation — TypeScript Project References:**
Configure `tsconfig.json` project references so that the `checkout` slice's TypeScript compilation includes the `shared` types. `tsc --build` in CI will catch type breakages immediately.

**Mitigation — Interface Versioning:**
If a breaking change to a shared type is unavoidable, the new version is added with a `V2` suffix (`ProductV2`) and the old type is deprecated with a `@deprecated` JSDoc comment. Migration happens slice-by-slice over a defined timeline.

---

#### R-05: Sprint Scope Creep

**Root Cause Analysis:** The checkout feature is naturally adjacent to many other features (inventory, pricing, promotions, loyalty points). There is a risk of expanding scope beyond what is academically necessary.

**Mitigation — Strict Out-of-Scope List:** Section 5.1 explicitly defines out-of-scope items. Any feature not in the in-scope list requires a formal scope change documented in `CONTEXT.md` and communicated to the team.

**Mitigation — Sprint Velocity Guard:** If a sprint's remaining tasks cannot be completed at the current velocity, the lowest-priority tasks are moved to Sprint 5 (Hardening), which has a built-in buffer. The E2E test in S5-T1 is the immovable deadline anchor — everything before it must be complete.

---

#### R-06: Test Environment Instability

**Root Cause Analysis:** Tests that depend on a running database or network can be flaky (non-deterministically failing). Flaky tests erode confidence in the test suite and slow down development.

**Mitigation — Hermetic Unit Tests:** All `CartService` and `CheckoutService` unit tests use `vitest.mock('@prisma/client')` to mock the database client. Unit tests never touch a real database.

**Mitigation — Test Database for Integration Tests:** Integration tests (route-level) use a separate PostgreSQL database (`TEST_DATABASE_URL`) that is reset via `prisma migrate reset --force` before the integration test suite runs. This is automated in the CI workflow.

**Mitigation — Test Isolation:** Each test case that writes to the database wraps operations in a transaction that is rolled back after the test, using Prisma's `$transaction` in test setup/teardown.

---

#### R-07: Team Member Contribution Imbalance

**Root Cause Analysis:** In group projects, contribution imbalances can arise from workload differences, blockers, or communication breakdowns. This can affect both grade fairness and team dynamics.

**Mitigation — Git Blame Transparency:** The vertical slicing model means that `git blame` on any file in `src/features/checkout/` will show Member A as the primary author. This is a built-in contribution attribution system.

**Mitigation — CONTEXT.md as Activity Log:** Each `CONTEXT.md` update is timestamped and author-initialed, creating an implicit activity log that supplements `git log`.

**Mitigation — Sprint Review Checkpoints:** At the end of each sprint, all members share their completed task IDs in the team chat. Any member who has not completed their sprint tasks by the checkpoint must document a blocker in `CONTEXT.md` and request help.

---

## 7. Appendices

### Appendix A — Useful Commands Reference

```bash
# === DEVELOPMENT ===
docker compose up -d                          # Start all services
docker compose logs -f backend                # Tail backend logs
docker compose exec backend npm run dev       # Backend hot-reload (if not in compose)

# === DATABASE ===
cd src/database
npx prisma migrate dev --name checkout_init  # Create and apply new migration
npx prisma migrate reset --force             # Reset DB (DESTROYS DATA)
npx prisma studio                            # Open DB browser GUI
npx prisma generate                          # Regenerate Prisma client

# === TESTING ===
cd src/frontend
npx vitest run                               # Run all tests once
npx vitest run --coverage                    # With coverage report
npx vitest watch                             # Watch mode (TDP sessions)
npx vitest run src/features/checkout        # Checkout slice only

cd src/backend
npx vitest run                               # Backend tests
npx vitest run src/features/checkout        # Checkout slice only

# === E2E ===
cd src/frontend
npx playwright test                          # Run all E2E tests
npx playwright test checkout                 # Checkout E2E only
npx playwright test --headed                 # With visible browser
npx playwright show-report                   # Open HTML report

# === GIT WORKFLOW ===
git checkout develop
git pull origin develop
git checkout -b feature/checkout-{description}
# ... make changes ...
git add .
git commit -m "feat(checkout): {description} [TDP]"
git push origin feature/checkout-{description}
# Open PR to develop via GitHub UI

# === BRANCH CLEANUP ===
git branch -d feature/checkout-{description} # Delete local branch after merge
git remote prune origin                       # Remove stale remote refs
```

### Appendix B — AI Prompt Patterns That Work Well

This section is updated throughout the project as effective prompting patterns are discovered.

**Pattern 1 — Schema-First for Zod:**
Always provide the target TypeScript interface BEFORE asking for the Zod schema. The AI generates significantly more accurate schemas when it can see the type it's targeting.

**Pattern 2 — Error Class First:**
When implementing service methods that throw typed errors, define the error classes first in a separate prompt, then reference them in the service method prompt. Mixing error class and service method generation in one prompt produces less clean error hierarchies.

**Pattern 3 — Test-Case Enumeration:**
When the failing test file contains multiple `it()` blocks, paste ALL of them in the TDP prompt even if only one is currently failing. The AI generates more complete implementations when it can see the full test surface.

**Pattern 4 — Prisma Mock Specification:**
When generating service code that uses Prisma, always include a comment block describing the mock setup used in tests. This prevents the AI from generating code that works against the real Prisma client but not against the mock.

### Appendix C — Academic References

- Beck, K. (2002). *Test-Driven Development: By Example*. Addison-Wesley.
- Conway, M. E. (1968). How do committees invent? *Datamation, 14*(4), 28–31.
- Evans, E. (2003). *Domain-Driven Design: Tackling Complexity in the Heart of Software*. Addison-Wesley.
- Forsgren, N., Humble, J., & Kim, G. (2018). *Accelerate: The Science of Lean Software and DevOps*. IT Revolution Press.
- Fowler, M. (2004). *Patterns of Enterprise Application Architecture*. Addison-Wesley.
- Martin, R. C. (2017). *Clean Architecture: A Craftsman's Guide to Software Structure and Design*. Prentice Hall.
- Schwaber, K., & Sutherland, J. (2020). *The Scrum Guide*. Scrum.org. https://scrumguides.org
- Skelton, M., & Pais, M. (2019). *Team Topologies: Organizing Business and Technology Teams for Fast Flow*. IT Revolution Press.

### Appendix D — Glossary

| Term | Definition |
|---|---|
| **TDP** | Test-Driven Prompting — the project's mandatory protocol for AI-assisted code generation |
| **Vertical Slice** | A unit of software decomposition that spans all technical layers for a single business capability |
| **Horizontal Layer** | A technical layer (UI, business logic, database) as a unit of team decomposition |
| **God-Merge** | An anti-pattern where a large-scope merge conflict involving many files must be resolved under deadline pressure |
| **Optimistic Update** | A UI pattern where the interface updates immediately before the API confirms, then corrects on failure |
| **Snapshotting** | Storing a copy of a value (e.g., product price) at a point in time to prevent future changes from affecting historical records |
| **Context Desynchronization** | The state in which `.ai/CONTEXT.md` does not accurately reflect the current codebase, causing AI to generate incorrect code |
| **RFC** | Request for Change — a documented proposal for modifying a frozen interface contract |
| **ADR** | Architecture Decision Record — a short document capturing the context, decision, and consequences of a significant architectural choice |
| **Hermetic Test** | A test that has no external dependencies (no database, no network) and produces identical results on every execution |

---

*End of CSE323 Customer Ordering System — Master Project Documentation*
*Maintained by Member A | All checkout-related queries: open a GitHub Discussion tagged `checkout`*
