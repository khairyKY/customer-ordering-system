# CSE323 — Ticket System | Phase 2 Deliverable D3

## UML Activity Diagram: POST /api/v1/tickets Request Lifecycle

**Member:** C — Ticket System Vertical Slice
**Rubric Target:** Excellent (Full Marks)

---

```plantuml
@startuml
title Activity Diagram: POST /api/v1/tickets Request Lifecycle

start
:Receive POST /api/v1/tickets Request;

' Decision 1: JWT Validation
if (Valid JWT provided?) then (no)
    :Return 401 Unauthorized;
    stop
else (yes)
    :Extract userId and role from JWT;
endif

' Decision 2: Payload Validation
if (subject: 5–120 chars\nAND body: 10–2000 chars\nAND Zod schema valid?) then (no)
    :Return 422 Unprocessable Entity\n{ error: "Validation failed" };
    stop
else (yes)
    :Calculate SHA-256 body hash\n(userId + subject + body);
endif

' Decision 3: Deduplication
if (Hash exists in DB for this userId\nwithin 600s window?) then (yes)
    :Return 409 Conflict\n{ error: "Duplicate ticket detected\nwithin 10-minute window" };
    stop
else (no)
    :Initiate Sentiment Analysis;
endif

' Decision 4 & 5: AI Interaction & Fallbacks
partition "Priority Determination Logic" {
    if (HuggingFace response\nreceived within 5000ms?) then (no — AbortError)
        :Set priority = "MEDIUM";
        :Set sentimentSource = "fallback";
    else (yes)
        if (Sentiment score is NaN or null?) then (yes)
            :Set priority = "MEDIUM";
            :Set sentimentSource = "score_invalid";
        else (no — valid float)
            :Map score to priority band:\nscore < 0.25  → CRITICAL\nscore < 0.50  → HIGH\nscore < 0.75  → MEDIUM\nscore >= 0.75 → LOW;
            :Set sentimentSource = "hf_model";
        endif
    endif
}

' Decision 6: Database Persistence
:INSERT INTO tickets\n(userId, subject, body, priority,\nsentimentSource, dedupHash, status: "OPEN");

if (Prisma INSERT successful?) then (no)
    :Return 500 Internal Server Error;
    stop
else (yes)
    :Return 201 Created\n{ ticketId, priority, status: "OPEN",\nsentimentSource };
    stop
endif

@enduml
```

---

## Fixes Applied

| # | Location | Issue | Fix |
|---|----------|-------|-----|
| 1 | Decision 2 — Payload Validation | Constraint stated as `Payload size <= 50KB` — conflicts with Phase 1 EC-4 padlock (subject 5–120 chars, body 10–2000 chars) | Replaced with correct field-level character constraints |
| 2 | Decision 2 — Payload Validation | 422 response had no error message body | Added `{ error: "Validation failed" }` to match API contract |
| 3 | Decision 2 — Hash Calculation | Hash described as "Body Hash" only — Phase 1 EC-2 defines hash as `SHA-256(userId + subject + body)` | Updated label to include all three inputs |
| 4 | Decision 3 — Dedup window | Window described as "10-minute window" without the numeric value | Added `600s` to make it a measurable metric consistent with QA audit log row 12 |
| 5 | Decision 3 — Dedup | 409 response had no error message body | Added matching the EC-02 Gherkin error string |
| 6 | Decision 4 — Priority Mapping | Label `"URGENT"` not defined in Phase 1 ENUM schema | Replaced with `"CRITICAL"` |
| 7 | Decision 4 — Priority Mapping | Only one boundary shown (`< 0.1 → URGENT`) — all four bands were missing | Added complete mapping: `< 0.25 → CRITICAL`, `< 0.50 → HIGH`, `< 0.75 → MEDIUM`, `>= 0.75 → LOW` |
| 8 | Decision 5 — NaN check | Only checked for `NaN` — Phase 1 EC-5 padlock also guards against `null` | Added `or null` to the condition |
| 9 | Decision 4 — sentimentSource | Value was `"ai"` — conflicts with Phase 1 EC-3 which defines the value as `"hf_model"` | Corrected to `"hf_model"` |
| 10 | Decision 6 — DB INSERT | INSERT activity was missing and the persistence decision came before the INSERT | Added explicit INSERT activity node with all required columns before the success/failure decision |
| 11 | Decision 6 — Success response | Response was missing `status: "OPEN"` and `sentimentSource` fields | Added both to the 201 response |

---

*Phase 2 — Activity Diagram | CSE323 D3 | Member C — Ticket System*
