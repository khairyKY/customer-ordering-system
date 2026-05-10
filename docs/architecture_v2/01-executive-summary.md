# 01 — Executive Summary & Core Objectives

## Project Identity

| Field | Value |
|---|---|
| **Course** | CSE323 — Software Engineering |
| **Project** | Customer Ordering System (COS) |
| **Architecture Model** | Feature-Based Vertical Slicing |
| **Primary Deliverable Owner (This Doc)** | Member A — Checkout & Shopping Cart |
| **Repository** | `cse323-customer-ordering-system` |
| **Primary Branch** | `main` |
| **Development Branch** | `develop` |

## System Vision

The Customer Ordering System (COS) is a full-stack web application simulating a production-grade e-commerce ordering pipeline. It enables customers to:

- Browse a product catalog
- Manage a persistent shopping cart
- Proceed through a structured checkout flow
- Receive order confirmations

The system also exposes an administrative interface for order management and inventory control.

The project satisfies the CSE323 academic rubric while simultaneously demonstrating professional software engineering practices: agile feature ownership, test-driven development, CI/CD pipelines, and AI-assisted code generation governed by structured prompting protocols.

---

## Core Objectives

| ID | Title | Description |
|---|---|---|
| **O-1** | Functional Completeness | Deliver all specified features (catalog, cart, checkout, order management, auth) to a demonstrable, running state. |
| **O-2** | Architectural Integrity | Implement a coherent, documented architecture that justifies every structural decision. |
| **O-3** | Zero Merge Conflict Tolerance | Enforce feature-slice ownership so parallel development produces no overlapping file modifications. |
| **O-4** | Auditability of AI Usage | All AI-generated code must be produced through the Test-Driven Prompting (TDP) protocol, creating a traceable record of AI contribution vs. human judgment. |
| **O-5** | Knowledge Continuity | `.ai/CONTEXT.md` must remain the single source of truth for project state, enabling instant onboarding for any team member or AI assistant. |
| **O-6** | Grade Defense | Every non-standard decision (architecture pivot, AI tooling, vertical slicing) must be documented with academic citations and professional rationale sufficient to defend against a rigid rubric. |

---

## Team Ownership Summary

| Member | Feature Slice | Layers Owned |
|---|---|---|
| Member A | Checkout & Shopping Cart | Frontend (React), Backend (Express), Database (Prisma) |
| Member B | Auth & User Management | Frontend, Backend, Database |
| Member C | Product Catalog | Frontend, Backend, Database |
| Member B + C | Order Management & Admin | Shared post-checkout responsibility |
