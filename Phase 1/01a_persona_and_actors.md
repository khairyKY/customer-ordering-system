# CSE323 — Ticket System | Phase 1 Deliverable D2

## File 01a: User Persona & Actor Classification

**Member:** C — Ticket System Vertical Slice

---

## Section 1: User Persona

**"Alex — The Anxious Shopper"**

```
+------------------------------------------------------------------+
|  Name         : Alex Carter                                      |
|  Age          : 27        Occupation : Freelance Graphic Designer|
|  Device       : iPhone (mobile-first)   Location : Urban         |
|  Tech Literacy: Moderate  E-Commerce Experience : High           |
+------------------------------------------------------------------+
```

### Background

Alex shops online 4–6 times per week across multiple platforms. When an order goes wrong, Alex does not wait — Alex acts immediately and repeatedly until acknowledged. Alex treats digital silence as confirmation that the problem is being ignored.

### Goals

| Goal | Description |
| :--- | :--- |
| **Instant Acknowledgment** | Wants a confirmation that the ticket was received within seconds. |
| **Urgency Recognition** | Expects the system to detect that "my payment was charged TWICE!!" is more critical than "wrong color item" — without Alex having to manually select a priority level. |
| **Status Visibility** | Wants to track the ticket's lifecycle (Open → In Progress → Resolved) without emailing support again. |

### Tech Literacy & Frustrations

- **Literacy level:** Moderate. Comfortable with apps, unfamiliar with what happens server-side.
- **Frustration 1:** Generic error messages. Alex reads 422 Unprocessable Entity as "the website is broken," not "your input was invalid."
- **Frustration 2:** No visual feedback on submit. If the page does not react within 2 seconds, Alex assumes the click did not register.
- **Frustration 3:** Forms that silently drop input. Alex has lost long ticket descriptions to session timeouts and now pastes enormous text blocks to "be safe."

### Alex's Behaviours → System Risks (Clear Reasoning)

The following table is the core justification for every edge case addressed in this system. Each of Alex's observable real-world behaviours maps directly to a measurable system risk that must be mitigated.

| # | Alex's Behaviour | Trigger Reason | System Risk Introduced | Maps To |
| :--- | :--- | :--- | :--- | :--- |
| **B-1** | Clicks "Submit Ticket" 8–10 times in 30 seconds | No visual confirmation; assumes click did not register | Duplicate rows in DB; HuggingFace API called 8–10 times (billable); agent queue flooded with identical tickets | EC-2 |
| **B-2** | Pastes a full email thread or order history into the body field | Wants to "be thorough"; does not know there is a length constraint | 50,000-character payload exceeds HuggingFace token limit (512 tokens); potential DB column overflow; memory spike in parser | EC-4 |
| **B-3** | Uses heavy compound emojis to express emotion: "fix this NOW" followed by a sequence of family/flag emoji | Natural expression of urgency; does not consider machine-readability | HuggingFace tokenizer splits multi-codepoint emoji incorrectly; returns score of NaN or 0.001, which maps to LOW — the opposite of Alex's intent | EC-5 |
| **B-4** | Copies a JavaScript error popup directly from the browser into the ticket body | Wants to show "proof" of the technical error seen on screen | Raw `<script>` or SQL fragment stored unescaped; renders as executable code in agent triage view | EC-1 |
| **B-5** | Submits during a peak traffic period (flash sale, payday weekend) | Cannot choose when problems occur | HuggingFace inference endpoint under load; request times out after 5+ seconds; ticket silently lost if no fallback exists | EC-3 |

---

## Section 2: Actor Classification

### Classification Principle

Actors are classified by their relationship to the use case initiation boundary:

- **Primary:** Consciously initiates a use case. Has a goal the system exists to serve.
- **Supporting:** Responds to requests from within the system boundary. Enables primary actors' goals but does not initiate use cases independently.
- **Offstage:** Operates entirely behind the scenes. Has no direct interface with human actors during normal operation, but failure or absence causes system-level consequences.

### 2.1 Primary Actors

#### P-1: Customer (Alex)

- **Initiates:** `POST /tickets`, `GET /tickets`
- **Goal:** Submit a complaint and receive prioritised acknowledgment
- **Identity:** JWT with `role: "customer"`, issued by Member D's Auth Service
- **System dependency:** The ticket system exists solely to serve this actor
- **Rationale:** The Customer is primary because they are the origin of every use case the system implements. FR-01 (Create Ticket) and FR-03 (View Tickets) are both initiated by a deliberate, conscious action from this actor. The Customer also generates all 5 edge cases through normal, motivated behaviour. Without this actor, no other component — the sentiment API, the database, the agent queue — has any reason to exist.

#### P-2: Support Agent

- **Initiates:** `GET /tickets/queue`, `PATCH /tickets/:id/status`
- **Goal:** Triage open tickets by AI-assigned priority; resolve customer issues efficiently
- **Identity:** JWT with `role: "agent"`, issued by Member D's Auth Service
- **System dependency:** Consumes the output of FR-02 (Sentiment Scoring) to do their job
- **Rationale:** The Support Agent is primary because they are a named human actor who logs in and performs deliberate work. They are not a background process. Crucially, the HuggingFace integration (FR-02) only delivers business value through the Support Agent: the priority label assigned by the AI is useless unless a human agent reads it and acts on it. Classifying the agent as primary forces the design to treat the triage queue and status update as first-class use cases, not afterthoughts.

### 2.2 Supporting Actors

#### S-1: HuggingFace Sentiment API

- **Invoked by:** Ticket backend, during `POST /tickets` processing
- **Returns:** Sentiment score (float, 0.0–1.0) mapped to LOW / MEDIUM / HIGH / CRITICAL
- **Failure contract:** If timeout > 5,000ms or HTTP error: fallback to MEDIUM, `sentiment_source: "fallback"`
- **Billing model:** Per-call; duplicate submissions (EC-2) have direct cost consequences
- **Rationale:** HuggingFace is supporting, not primary, because it never acts on its own initiative — it only responds when the backend calls it. However, it is not offstage because its behaviour is visible to human actors: the priority label it produces appears in the customer's ticket view and drives the agent's triage order. Classifying it correctly as supporting — rather than treating it as infrastructure — is what forces the design to plan for its failure mode (EC-3) as a first-class architectural concern.

#### S-2: Member D's Auth Service (JWT)

- **Invoked by:** Every inbound request to the ticket backend (middleware layer)
- **Returns:** Validated identity `{ user_id, role }` or 401 Unauthorized
- **Phase 3 dependency:** Member C cannot implement any protected route until Member D publishes the JWT structure
- **Rationale:** The Auth Service is supporting because its presence is directly visible at the system boundary: a missing or expired JWT produces a 401 that the customer experiences. It does not initiate use cases, but it gates every single one. It is classified as supporting rather than offstage because a failure here results in a response the user sees, not a silent internal error.

### 2.3 Offstage Actors

#### O-1: Ticket Database

- **Managed by:** ORM / query layer inside `src/backend/ticket/`
- **Persists:** `tickets` table (`id`, `customer_id`, `title`, `body`, `priority`, `status`, `sentiment_source`, `dedup_hash`, `created_at`)
- **Constraint role:** Column widths enforce EC-4 padlocks as a last line of defence: `title VARCHAR(120)`, `body VARCHAR(2000)`
- **Rationale:** The database is offstage because no human actor interacts with it directly. It is nevertheless a Phase 1 concern. The `dedup_hash` column is the technical foundation of the EC-2 padlock. Naming it offstage — rather than ignoring it — is what forces the team to design its schema before writing any code, preventing late-stage migrations that break other team members' work.

#### O-2: Notification Queue

- **Triggered by:** Status change event (`OPEN -> IN_PROGRESS`, `IN_PROGRESS -> RESOLVED`)
- **Consumed by:** A separate notification microservice (out of scope for Member C)
- **Interaction model:** Asynchronous, fire-and-forget; ticket backend publishes an event and does not wait for delivery
- **Rationale:** The Notification Queue is offstage because it is asynchronous and invisible during the synchronous request lifecycle. Documenting this actor in Phase 1 prevents a critical architectural mistake that commonly occurs in Phase 3: placing email-sending logic directly inside the status route handler, which would make the route slow, fragile, and untestable. By naming this actor offstage now, we enforce clean separation of concerns.