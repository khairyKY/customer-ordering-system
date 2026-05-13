# CSE323 — Ticket System | Phase 2 Deliverable D3

## Gherkin Scripts: BDD Scenarios

**Member:** C — Ticket System Vertical Slice
**Rubric Target:** Excellent (Full Marks)

---

> **Score → Priority Mapping Convention (FR-02):**
> The HuggingFace model returns a *positivity* score (0.0 = most negative/angry, 1.0 = most positive).
> Low positivity = high urgency. Mapping: `< 0.25` → CRITICAL | `0.25–0.49` → HIGH | `0.50–0.74` → MEDIUM | `>= 0.75` → LOW

---

```gherkin
Feature: Ticket System Vertical Slice
  As a Customer or Support Agent
  I want a sentiment-aware ticketing system
  So that customer issues are triaged and resolved efficiently based on urgency.

  Background:
    Given the backend service is running at "http://localhost:3001"
    And the database has been seeded with "default_roles"


  # ---------------------------------------------------------------------------
  # FUNCTIONAL REQUIREMENTS
  # ---------------------------------------------------------------------------

  @FR-01 @Auth
  Scenario: Successfully create a ticket (Happy Path)
    Given the user is authenticated with a valid "Customer" JWT
    When they POST to "/api/v1/tickets" with:
      | field   | value                                              |
      | subject | "Missing Item"                                     |
      | body    | "My order #12345 is missing the wireless mouse."   |
    Then the response status should be 201
    And the response should contain a "ticketId"
    And the ticket "status" should be "OPEN"
    And the ticket "userId" should match the JWT "sub" claim

  @FR-01 @Auth @Negative
  Scenario: Reject ticket creation without authentication
    Given no "Authorization" header is provided
    When they POST to "/api/v1/tickets" with:
      | field   | value                  |
      | subject | "Unauthorized"         |
      | body    | "This should fail."    |
    Then the response status should be 401
    And the response should contain "Unauthorized: JWT missing"

  @FR-02 @AI @Triage
  Scenario Outline: Sentiment Scoring and Priority Assignment
    Given the user is authenticated as a "Customer"
    When they submit a ticket with body <message_content>
    Then the HuggingFace API returns a positivity score of <sentiment_score>
    And the ticket should be assigned priority <priority_band>

    Examples:
      | message_content                                | sentiment_score | priority_band |
      | "EXTREMELY ANGRY! Order is 10 days late!!"     | 0.05            | "CRITICAL"    |
      | "The product is broken and I want a refund."   | 0.25            | "HIGH"        |
      | "How do I track my shipping status?"           | 0.55            | "MEDIUM"      |
      | "Thanks for the great service, love it!"       | 0.92            | "LOW"         |

  @FR-03 @Pagination
  Scenario: Customer views own tickets (JWT-scoped and Paginated)
    Given the user is authenticated as "Customer_A" with ID "usr_123"
    And "Customer_A" has 15 existing tickets in the database
    When they GET "/api/v1/tickets?page=1&limit=10"
    Then the response status should be 200
    And the response should contain exactly 10 tickets
    And all tickets in the list must have "userId" equal to "usr_123"
    And the "pagination" metadata should indicate "totalTickets: 15"

  @FR-04 @Triage @RoleGate
  Scenario: Agent retrieves triage queue sorted by priority
    Given the user is authenticated as "Support_Agent" with role "agent"
    When they GET "/api/v1/tickets/triage"
    Then the response status should be 200
    And the tickets should be sorted by "priority" in order: CRITICAL > HIGH > MEDIUM > LOW
    And tickets with equal priority should be sorted by "createdAt" ascending (oldest first)

  @FR-04 @RoleGate @Negative
  Scenario: Deny Customer access to Agent Triage Queue
    Given the user is authenticated as "Customer" with role "customer"
    When they GET "/api/v1/tickets/triage"
    Then the response status should be 403
    And the response should contain "Forbidden: Agent role required"

  @FR-05 @StateMachine
  Scenario: Ticket status lifecycle OPEN to IN_PROGRESS to RESOLVED
    Given a ticket exists with status "OPEN"
    And the user is authenticated as "Support_Agent"
    When they PATCH "/api/v1/tickets/{id}/status" with body "IN_PROGRESS"
    Then the ticket status should become "IN_PROGRESS"
    When they PATCH "/api/v1/tickets/{id}/status" with body "RESOLVED"
    Then the ticket status should become "RESOLVED"
    When they attempt to PATCH status back to "OPEN" from "RESOLVED"
    Then the response status should be 422
    And the error message should be "Illegal status regression: RESOLVED to OPEN"


  # ---------------------------------------------------------------------------
  # EDGE CASES
  # ---------------------------------------------------------------------------

  @EC-01 @Security
  Scenario: Sanitize XSS and SQL Injection payloads
    Given the user is authenticated as "Customer"
    When they submit a ticket with:
      | field   | value                              |
      | subject | "<script>alert('xss')</script>"    |
      | body    | "SELECT * FROM users; --"          |
    Then the response status should be 201
    And the stored "subject" should contain no HTML tags or script elements
    And the stored "body" should be treated as a literal string in the Prisma query
    And the "tickets" table should still exist in the database

  @EC-02 @Deduplication
  Scenario: Prevent duplicate submission within 10-minute window
    Given a ticket was successfully created by "Customer_A" at 10:00 AM
    When "Customer_A" submits an identical ticket at 10:05 AM
    Then the response status should be 409
    And the response should contain "Conflict: Duplicate ticket detected within 10-minute window"
    And exactly 1 row should exist in the database for this content
    And the HuggingFace client should have been called exactly 1 time

  @EC-03 @Fallback
  Scenario: HuggingFace API timeout fallback
    Given the HuggingFace sentiment API is unresponsive with timeout greater than 5000ms
    When a customer submits a new ticket
    Then the response status should be 201
    And the ticket should be saved with "priority" set to "MEDIUM"
    And the ticket should be saved with "sentimentSource" set to "fallback"
    And a warning log entry "AI_TIMEOUT_FALLBACK_TRIGGERED" should be generated

  @EC-04 @Boundary @Negative
  Scenario Outline: Reject extreme payloads before AI processing
    Given the user is authenticated as "Customer"
    When they submit a ticket with <field> set to <value>
    Then the response status should be 422
    And the HuggingFace sentiment service should NOT have been called

    Examples:
      | field   | value                                        | reason                        |
      | body    | string of 50001 characters                   | Exceeds 2000 character limit  |
      | subject | "" (empty string)                            | Required field — min 5 chars  |
      | subject | string of 121 characters                     | Exceeds 120 character limit   |
      | payload | { "nested": { "recursive": "deeply..." } }   | Schema violation              |

  @EC-05 @AI @Robustness
  Scenario: Handle tokenizer failure caused by emoji-only body
    Given a customer submits a ticket with body containing only "💩💩💩💩💩💩💩"
    When the HuggingFace tokenizer fails to produce meaningful tokens and returns NaN
    Then the system should catch the invalid NaN score
    And the ticket should be saved with "priority" set to "MEDIUM"
    And the ticket should be saved with "sentimentSource" set to "score_invalid"
    And the response status should be 201
```

---

## Fixes Applied

| # | Location | Issue | Fix |
|---|----------|-------|-----|
| 1 | FR-02 Examples | Priority label `"URGENT"` is not defined in Phase 1 schema | Replaced with `"CRITICAL"` to match FR schema across all Phase 1 documents |
| 2 | FR-02 Examples | Column header said "sentiment_score" with no mapping convention documented | Added score→priority mapping note in the preamble |
| 3 | FR-04 | Secondary sort condition (createdAt) was present in the scenario but not in the Then clause | Promoted to explicit `Then` assertion |
| 4 | EC-02 | Missing DB idempotency and HuggingFace billing assertions | Added: exactly 1 DB row, HF called once |
| 5 | EC-03 | Missing `sentimentSource: "fallback"` field assertion | Added to align with Phase 1 EC-3 padlock definition |
| 6 | EC-04 | Body limit stated as "50KB" — conflicts with Phase 1 field validation (2000 chars) | Corrected reason to "Exceeds 2000 character limit"; added 121-char subject boundary row |
| 7 | EC-05 | Used `sentimentScore: 0.5` as fallback — conflicts with Phase 1 EC-5 padlock | Replaced with `priority: MEDIUM` + `sentimentSource: "score_invalid"` to match Phase 1 |
| 8 | All tables | Pipe-only rows without headers caused broken table rendering | Added `field / value` headers to all inline data tables |

---

*Phase 2 — Gherkin Scripts | CSE323 D3 | Member C — Ticket System*
