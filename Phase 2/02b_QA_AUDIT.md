# CSE323 — Ticket System | Phase 2 Deliverable D3

## QA Refinement Loop: Ambiguity Audit Log

**Member:** C — Ticket System Vertical Slice
**Rubric Target:** Excellent (Full Marks)

---

## Preamble

All functional requirements and edge cases for the Ticket System were scanned for
vague, unquantifiable adjectives. Every such term has been replaced with a measurable
technical metric. The table below is the formal audit record of each replacement.

---

## Ambiguity Audit Log

| #  | Original Term    | Location        | Measurable Replacement                                              | Justification                                                                                                   |
| -- | ---------------- | --------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 1  | "Efficiently"    | Feature Summary | API response time ≤ 1500ms at the 95th percentile of requests      | "Efficiency" is subjective; P95 latency provides a hard performance ceiling for Support Agent workflows.        |
| 2  | "Urgency"        | Feature Summary | Priority ENUM: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`                 | "Urgency" must be a machine-readable ENUM type to be used in database sorting and triage queue logic.           |
| 3  | "Successfully"   | FR-01           | HTTP `201 Created` status code                                      | "Success" is vague; the HTTP protocol defines `201` as the correct measurable outcome for resource creation.    |
| 4  | "Valid"          | FR-01           | JWT with non-expired `exp` claim and verified `HS256` signature     | "Valid" is unquantifiable; cryptographic verification and expiration checks are measurable binary states.        |
| 5  | "Extremely Angry"| FR-02           | HuggingFace positivity score `< 0.25` (scale: 0.0 – 1.0) → CRITICAL| Emotion is subjective; the HuggingFace model output provides a precise float for threshold comparison.          |
| 6  | "Love it"        | FR-02           | HuggingFace positivity score `> 0.75` (scale: 0.0 – 1.0) → LOW    | Positive sentiment must be mapped to a specific upper-bound numerical threshold for priority assignment.         |
| 7  | "Exactly"        | FR-03           | `response.body.tickets.length === 10` assertion in test             | "Exactly" requires a hard assertion against the specific array length in the integration test script.           |
| 8  | "Unresponsive"   | EC-03           | Socket timeout `> 5000ms` triggers `AbortController` fallback       | "Unresponsive" is ambiguous; a 5-second socket timeout is a hard metric for triggering fallback priority logic. |
| 9  | "Extreme"        | EC-04           | `body` character count `> 2000` or `subject` character count `> 120`| "Extreme" is relative; explicit character-count limits are enforceable at the validation middleware layer.      |
| 10 | "Meaningful"     | EC-05           | Tokenizer produces `≥ 1` non-punctuation, non-emoji token           | AI robustness requires a measurable check for empty or junk input to prevent `NaN` / `null` score propagation. |
| 11 | "Securely"       | EC-01           | HTML encoding (`<` → `&lt;`) applied via DOMPurify + Prisma parameterized queries | Security is an outcome; encoding and parameterization are specific, measurable implementation methods. |
| 12 | "Duplicate"      | EC-02           | Identical `userId` + `body` hash created within `600` seconds (10-minute window) | "Duplicate" requires a time-window metric and a hash strategy to be expressed as a database query.  |

---

## Fixes Applied

| # | Issue | Fix |
|---|-------|-----|
| 1 | Row 2 used priority label `"URGENT"` — not defined in Phase 1 schema | Replaced with `"CRITICAL"` to match the ENUM defined across all Phase 1 documents |
| 2 | Row 5 threshold was `< 0.10` for "Extremely Angry" — inconsistent with Phase 1 boundary (`< 0.25` → CRITICAL) | Corrected to `< 0.25` to align with the FR-02 score-to-priority mapping |
| 3 | Row 6 threshold was `> 0.90` for "Love it" — inconsistent with Phase 1 boundary (`≥ 0.75` → LOW) | Corrected to `> 0.75` to align with the FR-02 score-to-priority mapping |
| 4 | Row 9 stated `> 50KB or > 50,000 characters` — conflicts with Phase 1 EC-4 padlock (`body` max 2000 chars, `subject` max 120 chars) | Replaced with the correct field-level character limits from Phase 1 |
| 5 | ASCII box-drawing table would not render in Markdown | Rebuilt as a standard Markdown pipe table |

---

## Audit Confirmation

> I hereby confirm that all Ticket System requirements have been scrubbed of
> unquantifiable adjectives. Every vague term has been replaced with a specific,
> testable, measurable metric.
>
> **Zero (0) vague adjectives remain.**

---

*Phase 2 — QA Refinement Loop | CSE323 D3 | Member C — Ticket System*
