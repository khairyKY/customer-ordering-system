# CSE323 Master State Transfer Document
**Purpose:** Prime a fresh LLM session with absolute repository state.

---

## 1. Architecture State: Vertical Slicing Monolith
- **Model:** Feature-Based Vertical Slicing (Mandated by Professor).
- **Frontend:** React 18 + Vite + Tailwind CSS + Framer Motion (State: Zustand/Local).
- **Backend:** Node.js + Express (In-memory mock store for Sprints 1 & 2).
- **Database:** PostgreSQL + Prisma (Initialized `schema.sql` with carts/items/products).
- **Protocol:** Test-Driven Prompting (TDP). All AI code must follow a Failing Test -> AI Implement -> Human Review cycle.

## 2. Member A (Khairy) Progress: Core Foundations
- **Shopping Cart System:** 
    - Full-stack CRUD complete (Add, Update Quantity, Remove, Clear).
    - Real-time total & 10% tax calculation on backend.
    - Persistent session-based cart (`session_id = "dev-session"`).
- **Product Catalog:**
    - `GET /api/products` established with 6 mock items.
    - Responsive `ProductGrid` UI with stock validation logic.
- **Centralized UI Library:**
    - Established `src/frontend/src/components/ui/` (`Button`, `Card`, `Input`).
    - Standardized typography and layout in `App.jsx`.
    - **Policy:** 100% compliance verified; no raw `<button>` or `<input>` tags remain.

## 3. Team Roadmap & Feature Ownership
- **Member A (Khairy):** Checkout & Shopping Cart System.
- **Member B:** Authentication & User Management.
- **Member C:** Product Catalog Management.
- **Member D:** Admin Dashboard & Order Fulfillment.

## 4. Operational Prompt Library
The following prompts are archived in `docs/prompt_library/`:
1. `01-team-sync.md`: Onboarding new team members/LLM sessions to the architecture.
2. `02-surgical-fix.md`: Guidelines for making targeted fixes without architectural drift.
3. `03-debugging-protocol.md`: Standardized procedure for resolving terminal/syntax errors.

## 5. Next Immediate Action
- **Role Shift:** Member A is transitioning into the **Scrum Master** role.
- **Kanban Task:** Distribute Phase 1 "Vertical Slice" tickets to Members B, C, and D based on their ownership.
- **Technical Decision:** Decide whether to proceed with **Phase 4 (Playwright E2E Tests)** for the Checkout feature before handing over the repository state.
