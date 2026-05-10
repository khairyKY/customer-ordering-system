# CSE323 Customer Ordering System — Master Project Documentation

> **Maintained by:** Member A (Checkout & Shopping Cart — Full-Stack Owner)
> **Document Version:** 1.1.0
> **Last Updated:** 2026-05-09
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
| **Primary Deliverable Owner** | Member A — Checkout & Shopping Cart |
| **Repository** | `customer-ordering-system` |
| **Primary Branch** | `main` |
| **Deadline** | May 18, 2026 |

### 1.2 System Vision
The Customer Ordering System (COS) is a full-stack web application simulating a production e-commerce pipeline. It handles product discovery, persistent cart management, and a structured checkout flow. The project demonstrates professional engineering via **Vertical Feature Ownership**, **Test-Driven Prompting (TDP)**, and rigorous **Automated Validation**.

### 1.3 Core Objectives
- **O-1 — Functional Completeness:** Deliver an end-to-end checkout experience.
- **O-2 — Architectural Integrity:** Justify structural decisions against academic rubrics.
- **O-3 — Conflict Elimination:** Use vertical slicing to ensure zero merge conflicts between team members.
- **O-4 — TDP Auditability:** Maintain a traceable record of human-led, AI-assisted development.
- **O-5 — Knowledge Continuity:** Use `.ai/CONTEXT.md` as the single source of truth for all agents and engineers.

---

## 2. Architectural Pivot Justification

### 2.1 Original Model: Horizontal Layering (REJECTED)
The initial structure assigned members to tech layers (UI vs. Logic vs. DB).
**Failures Identified:**
- **Coupling:** Member A (UI) is blocked if Member B (Logic) hasn't finished the API.
- **The "God-Merge":** Merging horizontal layers 24 hours before a deadline causes catastrophic conflicts in shared directories.
- **Diffused Accountability:** Hard to grade individual impact when everyone touches every file.

### 2.2 Final Model: Feature-Based Vertical Slicing (APPROVED)
System is divided by **Business Capability**. Each member owns the UI, Logic, and DB for their specific feature.
- **Member A Ownership:** `src/features/checkout/` (Full-Stack).
- **Benefit:** Independent development, localized testing, and clear grading attribution.
- **Rubric Compliance:** Satisfies all tech layers (UI/API/DB) within the assigned feature domain.

---

## 3. System Architecture & Tech Stack

### 3.1 Technology Selections
- **Frontend:** React 18 (Vite) + Tailwind CSS + Zustand (State).
- **Backend:** Node.js + Express.
- **Database:** PostgreSQL + Prisma ORM.
- **Testing:** Vitest (Unit/Integration) + Playwright (E2E/POM).
- **Validation:** Zod (Shared schemas).

### 3.2 Data Model — Checkout Domain (Prisma)
Member A owns the following models in `schema.prisma`.

```prisma
model Cart {
  id         String     @id @default(cuid())
  userId     String?    @index
  sessionId  String?    @index
  items      CartItem[]
  promoCode  String?
  discount   Float      @default(0)
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt
}

model CartItem {
  id        String   @id @default(cuid())
  cartId    String
  productId String
  quantity  Int      @default(1)
  unitPrice Float    // Snapshotted price
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  cart      Cart     @relation(fields: [cartId], references: [id], onDelete: Cascade)
  
  @@unique([cartId, productId])
}

model Order {
  id              String      @id @default(cuid())
  userId          String?
  status          OrderStatus @default(PENDING)
  items           OrderItem[]
  total           Float
  shippingAddress Json
  paymentRef      String?     // Mock UUID
  placedAt        DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}

model OrderItem {
  id          String  @id @default(cuid())
  orderId     String
  productId   String
  productName String  // Snapshotted
  quantity    Int
  unitPrice   Float
  totalPrice  Float

  order       Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}
```

---

## 4. Strict Rulebook

### 4.1 Test-Driven Prompting (TDP)
1. **Human** writes a **failing test** (Unit or Integration).
2. **Human** commits the failure (`test(slice): add failing case`).
3. **Human** prompts AI with the test and context.
4. **AI** generates **minimum code** to pass.
5. **Human** verifies, refactors, and updates `.ai/CONTEXT.md`.

### 4.2 Branching & Commits
- **Branches:** `{type}/{slice}-{description}` (e.g., `feat/checkout-cart-logic`).
- **Commits:** Conventional Commits only. Use `[TDP]` for AI-generated code.

---

## 5. Master Scope & Sprints (Member A Focus)

### S0: Infrastructure
- Docker Compose, Prisma Init, Shared Types.
### S1: Cart Core
- Zustand Store, Cart API (GET/POST/DELETE), Zod Validation.
### S2: UX Polish
- Cart Drawer (React), Quantity Stepper, Promo Code Logic.
### S3: Checkout Flow
- Multi-step Form (Shipping -> Payment), Stepper UI.
### S4: Order Placement
- Prisma Transaction (Cart -> Order), Stock Decrement, Confirmation UI.
### S5: Validation
- Playwright E2E Happy Path, Edge Case Hardening, Rubric Audit.

---

## 6. Risk Register
- **R-01: Merge Conflicts:** Mitigated by strict vertical folder boundaries.
- **R-02: Context Drift:** Mitigated by mandatory `.ai/CONTEXT.md` updates after every TDP cycle.
- **R-03: Flaky Tests:** Mitigated by hermetic mocking of Prisma in unit tests.

---

## 7. Appendices
- **Appendix A:** CLI Reference (`npx vitest`, `npx prisma migrate`, `npx playwright test`).
- **Appendix B:** Prompting Patterns (Schema-first, Error Class segregation).
- **Appendix C:** Academic Citations (Beck, 2002; Forsgren et al., 2018).

---
*End of Master Documentation — Member A*
