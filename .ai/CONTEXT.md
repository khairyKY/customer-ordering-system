# SYSTEM CONTEXT: CSE323 Customer Ordering System

## 1. THE PRIME DIRECTIVE
This is an educational vertical slice requiring Test-Driven Prompting (TDP). 
Strict Workflow: Failing Test -> AI Generation -> Passing Test.
**Rule:** For every piece of code generated, you MUST output a brief log of the prompt used so it can be compiled into the "AI Prompt Appendix" for the D5 submission.

## 2. ARCHITECTURAL BOUNDARIES
- src/ui: Frontend. Cannot directly access src/db.
- src/logic: Business Logic. Exposed only via defined API contracts. Internal logic remains hidden.
- src/db: Database/Persistence layer.

## 3. WORK DIVISION & ROSTER
Deadline for all deliverables: 18/05/2026.

**Member A (Active Role)**
- D2: Actor Classification (Primary, Supporting, Offstage).
- D3: UML System Sequence Diagrams (SSD) - Happy/Failure paths.
- D5: UI layer of the Vertical Slice.
- D4: Verification vs Validation Statement.

**Member B**
- D2: Traceability Heatmap.
- D3: Gherkin Scripts (Given/When/Then).
- D5: Business Logic layer of the Vertical Slice.
- D4: Playwright Automation using Page Object Model (POM).

**Member C**
- D2: Persona Discovery (Hidden requirements via AI simulation).
- D3: API Contracts + Information Hiding.
- D5: Database layer of the Vertical Slice (Edge Case Cage).
- D4: Testing Pyramid - Unit Test layer (70%).

**Member D**
- D2: Requirements Report compilation.
- D3: QA Refinement Loop (Measurable technical metrics).
- D5: TDP Iteration Documentation + AI Prompt Appendix.
- D4: Testing Pyramid - Integration (20%) + E2E (10%) layers.

**Shared by all:**
- D1: Project Registration Form.
- D6: Final Presentation Slide Deck.
- Disclose all AI-assisted code.
