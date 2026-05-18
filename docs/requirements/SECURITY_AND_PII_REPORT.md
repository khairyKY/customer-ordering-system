# Security & PII Report — Semantic Perimeter Defense

**Date:** 2026-05-18
**Rubric Source:** `docs/curriculum/EJUST_CURRICULUM_SUMMARY.md` §3 (Security & Maintenance Mandates)
**Scope:** Python FastAPI backend (`src/backend_python/`)

This report documents the security middleware implemented to satisfy the
CSE323 "AI-Native / Semantic Perimeter" mandate. All claims below are backed by
code that exists in the repository at the cited paths.

---

## 1. Prompt-Injection Defense

**Implementation:** `src/backend_python/app/middleware/security.py` → `PromptInjectionGuard`
**Wired in:** `src/backend_python/app/main.py` via `app.add_middleware(PromptInjectionGuard)`

### Threat addressed
- **Direct prompt injection** — a user submitting instruction-override text
  (e.g. "ignore all previous instructions", "you are now…", `[SYSTEM …]`) in a
  request body, intended to subvert any downstream LLM consumer.
- **Indirect prompt injection** — the same payloads arriving through stored
  fields (ticket text, product reviews) that an AI step may later read.

### How it works
1. Implemented as **pure ASGI middleware** (not `BaseHTTPMiddleware`) so the
   request body can be buffered, inspected, and **replayed** to the route
   handler without consuming the receive stream.
2. Only `POST`, `PUT`, `PATCH` requests are inspected (`_GUARDED_METHODS`);
   bodyless methods are passed straight through.
3. The decoded body is matched against `_INJECTION_PATTERNS` — a set of
   case-insensitive regexes covering instruction-override phrasing, system-tag
   markers (`<|im_start|>`, `</system>`, `[system …]`), jailbreak keywords, and
   role-elevation phrasing.
4. On a match: the request is rejected with **HTTP 400** and a JSON body
   `{"error": ..., "code": "PROMPT_INJECTION_BLOCKED"}`, and a `WARNING` is
   logged with the matched pattern (never the raw payload).
5. Bodies larger than `_MAX_SCAN_BYTES` (1 MB) are rejected **HTTP 413**.

### Limitations (honest disclosure)
- This is a **pattern-based allowlist perimeter**, not a semantic classifier;
  novel paraphrases can bypass it. It is a defense-in-depth layer, not a
  guarantee.
- It does not inspect query strings or headers — only mutating-request bodies.

---

## 2. PII Redaction (Privacy Firewall)

**Implementation:** `src/backend_python/app/middleware/security.py` → `redact()`,
`RedactionFilter`, `install_pii_redaction()`
**Wired in:** `src/backend_python/app/main.py` via `install_pii_redaction()`

### Threat addressed
PII (emails, passwords, card numbers, tokens) leaking into terminal output or
log files, where it could be harvested or shipped to an LLM/observability sink.

### How it works
1. `install_pii_redaction()` attaches a `RedactionFilter` to the root logger,
   the `app` logger, and the three `uvicorn*` loggers (and their handlers).
2. `RedactionFilter` runs `redact()` over every log record's message **and**
   its `args` before the record is emitted.
3. `redact()` masks three classes of data with `[REDACTED]`:
   - **Emails** — RFC-ish address regex.
   - **Card numbers** — runs of 13–19 digits, with optional spaces/dashes.
   - **Sensitive JSON key/value pairs** — values of keys named `password`,
     `pwd`, `secret`, `token`, `jwt`, `cvv`, `cvc`, `card_number`,
     `credit_card`, etc.

### Verification
The detection and redaction functions were exercised standalone:
- `"ignore all previous instructions"` → matched (blocked).
- `"[SYSTEM DIRECTIVE: …]"` → matched (blocked).
- `"buy 2 RTX 5090 graphics cards"` → no match (passes through).
- `redact('user alice@example.com card 4242 4242 4242 4242 "password": "hunter2"')`
  → `user [REDACTED] card [REDACTED] "password": "[REDACTED]"`.

### Limitations (honest disclosure)
- Redaction is applied at the **logging layer**, not at the persistence layer —
  PII is still stored in the database where the schema requires it (e.g. the
  `users.email` column). This is intentional: the firewall protects logs/LLM
  surfaces, not legitimate first-party storage.
- A full integration test against a running server has **not** been executed in
  this session because the backend virtualenv was not provisioned. The pure
  functions are verified; a server-level smoke test (`pytest`, manual curl)
  remains a recommended follow-up.

---

## 3. Rubric Traceability

| Rubric §3 Mandate | Artifact | Status |
|---|---|---|
| Direct prompt-injection defense | `PromptInjectionGuard` | 🟢 Implemented |
| Indirect prompt-injection defense | Same guard inspects all mutating bodies | 🟢 Implemented |
| Privacy Firewall / Redaction Middleware | `RedactionFilter` + `redact()` | 🟢 Implemented |
| Compliance Budget (safe-by-default) | Guard is fail-closed; redaction is on by default at startup | 🟢 Documented |
