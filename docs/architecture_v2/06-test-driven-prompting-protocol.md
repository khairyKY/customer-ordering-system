# 06 — Test-Driven Prompting (TDP) Protocol

## What is TDP?

Test-Driven Prompting is the **mandatory workflow** for all AI-assisted code generation in this project. It combines the discipline of Test-Driven Development (TDD) with structured AI prompting, creating an auditable trail that proves human engineering judgment governs AI output — not the reverse.

---

## The TDP Cycle

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

---

## Canonical TDP Prompt Template

Every AI prompt for code generation **MUST** follow this template exactly. Deviations invalidate the TDP audit trail.

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

---

## CONTEXT.md — Required Structure

`.ai/CONTEXT.md` is the single source of truth for project state. It must be kept current at all times.

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
| catalog | Member C | 🟢 Complete | S1-T5: Product list API | None |
| checkout | Member A | 🟡 In Progress | S2-T2: CartStore | Needs Product type |
| orders | Shared | 🔴 Not Started | — | Blocked on checkout |

---

## Checkout Slice — Detailed State (Member A)

### Completed Components / Files
- [Every completed file with a one-line description]

### Current In-Progress Task
- **Task ID:** [e.g., S2-T3]
- **Description:** [What you are currently building]
- **Failing Test Location:** [path/to/test.ts]
- **Blockers:** [Any dependencies not yet available]

### API Contract (Current)
[Every endpoint: ✅ Complete | 🔄 In Progress | ❌ Not Started]

### Database Models (Current)
[Every Prisma model with migration status]

### Known Issues / Technical Debt
[Shortcuts taken, edge cases deferred, known bugs]

### Next 3 Tasks
1. [Task ID]: [Description]
2. [Task ID]: [Description]
3. [Task ID]: [Description]

---

## Shared Contracts (Read-Only for Checkout)
[Types and middleware the checkout slice depends on]

---

## Environment & Infrastructure
- Local dev: `docker compose up -d`
- Test: `cd src/frontend && npm test -- --watch=false`
- Backend test: `cd src/backend && npm test`
- DB migration: `cd src/database && npx prisma migrate dev`
- Ports: Frontend: 5173 | Backend: 3001 | DB: 5432

---

## AI Prompting Notes
[Patterns that worked well or poorly — updated throughout the project]
```

---

## CONTEXT.md Update Triggers

`CONTEXT.md` **MUST** be updated and committed in ALL of the following situations:

- After any TDP cycle completes (implementation passes tests)
- After any database migration is applied
- After any API endpoint is added, modified, or removed
- After any new shared type or utility is added to `src/*/shared/`
- Before starting any new sprint task
- When a blocker is identified or resolved
- When the tech stack or a dependency changes

> Failure to update `CONTEXT.md` is a **blocking PR review issue** — no merge without a current context file.

---

## Why TDP Protects Academic Integrity

TDP does not hide AI usage — it documents and governs it. The failing test, written entirely by the engineer *before* any AI involvement, proves:

1. The engineer understood the requirement deeply enough to specify it precisely.
2. The engineer defined the contract (interface, behavior, edge cases) independently.
3. The AI was used as a **code-generation accelerator**, not a requirement-definition tool.

This is equivalent to a civil engineer using structural analysis software — the engineer defines the problem; the tool assists with computation. The intellectual contribution is in test authorship, context management, and review of AI output.

---

## Effective AI Prompting Patterns

Discovered patterns to incorporate into `.ai/CONTEXT.md` as they are validated:

| Pattern | Description |
|---|---|
| **Schema-First for Zod** | Provide the target TypeScript interface BEFORE asking for the Zod schema. Produces more accurate schemas. |
| **Error Class First** | Define custom error classes in a separate prompt, then reference them in the service method prompt. Produces cleaner error hierarchies. |
| **Test-Case Enumeration** | Paste ALL `it()` blocks in the TDP prompt even if only one is failing. AI generates more complete implementations with the full test surface visible. |
| **Prisma Mock Specification** | Include a comment block describing the mock setup used in tests. Prevents AI from generating code that works against real Prisma but not the test mock. |
