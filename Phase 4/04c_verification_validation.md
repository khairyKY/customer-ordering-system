# CSE323 — Ticket System | Phase 4 Deliverable D4

## 04c: Verification vs. Validation Statement

**Member:** C — Ticket System Vertical Slice
**Rubric Target:** Excellent (Full Marks)

---

## Distinction

| | Question | Method | Evidence |
|---|---|---|---|
| **Verification** | Did we build the thing *right*? | Automated TDP test suite | 10 passing test cases |
| **Validation** | Did we build the *right* thing? | Persona behavioural alignment | Alex B-1 through B-5 |

---

## Verification — Engineering Correctness

Verification was achieved through Test-Driven Prompting (TDP), ensuring the system adheres strictly to the technical specifications and architectural constraints defined in Phase 2. All ten automated test cases (TC-01 through TC-10) passed with a 100% pass rate.

**Happy Path & AI Priority (TC-01, TC-02)**
TC-01 confirms the core ticket creation flow returns `201 Created` with the correct response shape and binds `userId` from the JWT `sub` claim — never from the request body. TC-02 verifies that all four priority bands (CRITICAL, HIGH, MEDIUM, LOW) are correctly assigned from HuggingFace sentiment scores using the defined boundaries (`< 0.25`, `< 0.50`, `< 0.75`, `>= 0.75`).

**Security (TC-06 — EC-1)**
XSS and SQL injection payloads are stripped before persistence. The stored `subject` contains no HTML tags and the `tickets` table survives SQL injection attempts — confirmed by database assertion.

**Deduplication (TC-07 — EC-2)**
SHA-256(userId + subject + body) hash is checked within a 600-second window. The first submission returns `201`, the second returns `409 Conflict`, exactly one DB row exists, and HuggingFace is called exactly once — protecting against billable API waste.

**Resilience (TC-08, TC-10 — EC-3, EC-5)**
TC-08 proves that when HuggingFace times out after 5000ms (AbortController), the ticket is still persisted with `priority: MEDIUM` and `sentimentSource: "fallback"` — a `201` is always returned. TC-10 proves that `NaN` and `null` scores are caught and stored with `sentimentSource: "score_invalid"`, preventing a null priority from reaching the database.

**Payload Guard (TC-09 — EC-4)**
Payloads violating field constraints (`subject` > 120 chars or `body` > 2000 chars) are rejected with `422 Unprocessable Entity` before the HuggingFace API is ever called.

> **Verification conclusion:** The system was built correctly. All 10 test cases pass. Every padlock holds.

---

## Validation — Stakeholder Utility

Beyond technical correctness, the system was validated against the real-world needs of the target user persona, **Alex — The Anxious Shopper**, whose five observable behaviours (B-1 through B-5) drove every design decision in Phase 1.

**B-1 — Repeated clicking (Duplicate Spam)**
Alex clicks Submit 8–10 times when there is no visual feedback. The 600-second deduplication window ensures Alex's queue is not flooded with identical tickets. The `409 Conflict` response with a human-readable error message tells Alex the ticket was already received — directly addressing the root cause of the behaviour.

**B-2 — Large email paste (Extreme Payload)**
Alex pastes entire email histories into the body field. The `body` 2000-character limit and `422` response with a clear validation message prevents memory exhaustion and AI token overflow — while giving Alex actionable feedback rather than a silent failure.

**B-3 — Emoji-only body (Tokenizer Failure)**
Alex expresses urgency through emojis rather than text. The NaN/null score guard assigns `MEDIUM` priority and flags the ticket as `low_content` for manual agent review — ensuring Alex's issue is not silently mis-prioritised at the bottom of the queue.

**B-4 — Pasting error messages (XSS / SQL Injection)**
Alex copies JavaScript error messages from the browser as "proof." DOMPurify sanitization and parameterized queries ensure these are stored as plain text — protecting the support agent's triage view from script execution.

**B-5 — Peak traffic submission (HuggingFace Timeout)**
Alex submits during flash sales when the AI endpoint is under load. The AbortController fallback guarantees the ticket is always persisted with a sensible default priority — Alex's complaint is never silently discarded.

> **Validation conclusion:** The system solves the right problem. Every feature maps directly to a documented Alex behaviour. The Gherkin scenarios bridge the gap between technical test cases and user behavioural goals.

---

## Conclusion

The Ticket System has been formally **verified** through 10 passing automated test cases that guarantee technical compliance with the Phase 2 design specification, and **validated** by demonstrating that every implemented feature directly addresses a documented behavioural need of the target persona. These are two distinct claims: verification proves the code does what the spec says; validation proves the spec described the right problem. Both claims hold.

---

*Phase 4c — Verification vs. Validation | CSE323 D4 | Member C — Ticket System*
