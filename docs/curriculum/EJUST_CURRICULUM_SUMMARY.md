# EJUST CSE323 Software Engineering: Curriculum Summary Report

## 1. Work Division Rules
The project mandates a shift from traditional **Horizontal Slicing** (Technical Layers) to **Vertical Slicing** (Business Sub-Problems).

- **Horizontal Slicing (REJECTED):** Member A (UI), Member B (Logic), Member C (DB). Identified as having high communication overhead and "Chain Vulnerability" (one failure breaks the project).
- **Vertical Slicing (MANDATED):** Each team member acts as a full-stack owner of a specific business sub-problem (e.g., Customer-facing, Kitchen-related, Management-related).
- **Orchestration Role:** The human acts as an "Orchestrator" (Architect), defining vertical interfaces and API contracts. The AI provides the "Labor" (internal logic) within strictly bounded constraints.

## 2. Required Testing Protocols
Testing is centered around **Acceptance Testing (UAT)** and the **AI-Enhanced QA Pipeline**.

- **Gherkin Syntax:** All user stories must be translated into structured Gherkin (`Given`, `When`, `Then`).
- **QA Refinement Loop:**
    1. **Ambiguity Audit:** Use AI to identify and replace subjective terms (e.g., "fast", "secure") with measurable technical metrics.
    2. **Edge Case Discovery:** AI acts as a "Malicious User" to uncover at least 5 negative acceptance tests.
    3. **Automated Validation:** Convert Gherkin scenarios into executable **Playwright** scripts using the **Page Object Model (POM)**.
- **Grading Tiers:**
    - **Foundational (C):** Correct Gherkin usage.
    - **Analytical (B):** Inclusion of negative paths and boundary value analysis.
    - **Advanced (A):** Evidence of AI-assisted requirement refinement and script generation.

## 3. Security & Maintenance Mandates
Security shifts from syntax-based defense to **AI-Native / Semantic Perimeter** defense.

- **Threat Vectors:** Protection against **Direct Prompt Injection** (jailbreaking) and **Indirect Prompt Injection** (malicious external data).
- **Privacy Firewall:** Implementation of "Redaction Middleware" to strip PII (Credit Card numbers, Emails) before data reaches API/LLM calls.
- **The Compliance Budget:** Design defaults to be safe and usable; avoid overly complex rules that force users to find shortcuts.

## 4. Phase Deliverables & Grading Criteria
- **Phase 1:** Actor Classification & Edge Case Discovery (AI as User).
- **Phase 2:** Design Refinement & SSDs (AI as Senior QA).
- **Phase 3:** Automated Script Generation (AI as Developer).
- **Critical Rubric:** Architectural integrity and the ability to justify structural decisions override mere code volume.
