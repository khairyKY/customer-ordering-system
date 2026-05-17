# CSE323 — Ticket System | Phase 3 Deliverable D5

## 03d: Implementation — Making Tests Pass

**Member:** C — Ticket System Vertical Slice
**TDP STATUS:** ✅ PASSING — 10 passed, 10 total.

---

## Test Execution Results

| Metric | Result |
| ------ | ------ |
| Test Suites | 2 passed, 2 total |
| Tests | 10 passed, 10 total |
| Time | 5.779s |

---

## Final Implementation Files

### ticket.validators.js
**Location:** `src/backend/features/tickets/ticket.validators.js`

```javascript
const { z } = require('zod');

const createTicketSchema = z.object({
  subject: z.string()
    .min(5,   'subject must be at least 5 characters')
    .max(120, 'subject must be at most 120 characters')
    .transform(val => {
      return val
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '')
        .replace(/<[^>]*>/g, '')
        .trim();
    }),
  body: z.string()
    .min(10,   'body must be at least 10 characters')
    .max(2000, 'body must be at most 2000 characters')
    .transform(val => {
      return val
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '')
        .replace(/<[^>]*>/g, '')
        .trim();
    }),
});

const validateTicket = (req, res, next) => {
  const result = createTicketSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(422).json({
      error:   'Validation failed',
      details: result.error.errors,
    });
  }
  req.body = result.data; // replace with sanitized data
  next();
};

module.exports = { createTicketSchema, validateTicket };
```

---

### ticket.service.js
**Location:** `src/backend/features/tickets/ticket.service.js`

```javascript
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const tickets         = [];
const submissionHashes = new Map(); // hash -> timestamp

const HF_API_URL =
  'https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english';

const mapScoreToPriority = (score) => {
  if (score < 0.25) return 'CRITICAL';
  if (score < 0.50) return 'HIGH';
  if (score < 0.75) return 'MEDIUM';
  return 'LOW';
};

const resolvePriority = (score) => {
  if (score === null || score === undefined || isNaN(score)) {
    return { priority: 'MEDIUM', sentimentSource: 'score_invalid' };
  }
  return { priority: mapScoreToPriority(score), sentimentSource: 'hf_model' };
};

const generateDedupHash = (userId, subject, body) => {
  return crypto
    .createHash('sha256')
    .update(`${userId}:${subject}:${body}`)
    .digest('hex');
};

const ticketService = {
  mapScoreToPriority,
  resolvePriority,
  generateDedupHash,

  async createTicket(data, userId) {
    const { subject, body } = data;

    // 1. Deduplication Check — SHA-256(userId + subject + body), 600s window
    const hash = generateDedupHash(userId, subject, body);
    const now  = Date.now();
    const WINDOW_MS = 10 * 60 * 1000; // 600 seconds

    if (submissionHashes.has(hash)) {
      if (now - submissionHashes.get(hash) < WINDOW_MS) {
        const error = new Error('Duplicate ticket detected within 10-minute window');
        error.status = 409;
        throw error;
      }
    }
    submissionHashes.set(hash, now);

    // 2. AI Sentiment Analysis — HuggingFace with 5000ms AbortController
    let priority        = 'MEDIUM';
    let sentimentSource = 'fallback';

    try {
      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(HF_API_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ inputs: `${subject} ${body}` }),
        signal:  controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('HF API Error');

      const result    = await response.json();
      const sentiment = result[0];
      const resolved  = resolvePriority(sentiment?.score);

      priority        = resolved.priority;
      sentimentSource = resolved.sentimentSource;

    } catch (err) {
      priority        = 'MEDIUM';
      sentimentSource = err.name === 'AbortError' ? 'fallback' : 'fallback';
    }

    // 3. Persist ticket
    const newTicket = {
      id:              uuidv4(),
      userId,
      subject,
      body,
      status:          'OPEN',
      priority,
      sentimentSource,
      dedupHash:       hash,
      createdAt:       new Date().toISOString(),
      updatedAt:       new Date().toISOString(),
    };

    tickets.push(newTicket);
    return newTicket;
  },
};

module.exports = ticketService;
```

---

### ticket.controller.js
**Location:** `src/backend/features/tickets/ticket.controller.js`

```javascript
const ticketService = require('./ticket.service');

const ticketController = {
  async createTicket(req, res) {
    try {
      // Validation and sanitization already handled by validateTicket middleware
      const ticket = await ticketService.createTicket(req.body, req.user.id);
      return res.status(201).json(ticket);
    } catch (err) {
      if (err.status === 409) {
        return res.status(409).json({ error: err.message });
      }
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
};

module.exports = ticketController;
```

---

### ticket.routes.js
**Location:** `src/backend/features/tickets/ticket.routes.js`

```javascript
const express = require('express');
const router  = express.Router();
const ticketController = require('./ticket.controller');
const { validateTicket } = require('./ticket.validators');

router.post('/', validateTicket, ticketController.createTicket);

module.exports = router;
```

---

## Faults Fixed from CLI Output

| # | File | Fault | Fix |
|---|------|-------|-----|
| 1 | `ticket.validators.js` | Used `title`/`description` — wrong field names | Corrected to `subject`/`body` |
| 2 | `ticket.validators.js` | `body` max set to `10000` — conflicts with Phase 1 EC-4 (2000 char limit) | Corrected to `2000` |
| 3 | `ticket.validators.js` | `body` min lowered to `3` to "pass EC-5" — violates Phase 1 contract (min 10) | Restored to `10` |
| 4 | `ticket.service.js` | Used `title`/`description` field names throughout | Corrected to `subject`/`body` |
| 5 | `ticket.service.js` | `sentimentSource` initial value was `"HuggingFace"` — wrong value | Corrected to `"fallback"` as the safe default |
| 6 | `ticket.service.js` | `sentimentSource: 'Local Fallback'` on non-AbortError catch | Corrected to `"fallback"` to match API contract |
| 7 | `ticket.service.js` | Priority mapping used `label === 'NEGATIVE'` logic — wrong; Phase 1 uses score-only boundaries | Replaced with `mapScoreToPriority()` using Phase 1 boundaries: `<0.25 CRITICAL`, `<0.50 HIGH`, `<0.75 MEDIUM`, `>=0.75 LOW` |
| 8 | `ticket.service.js` | Stored ticket used `sentiment_source` (snake_case) and `created_at` | Corrected to `sentimentSource`, `createdAt`, `updatedAt` (camelCase) |
| 9 | `ticket.service.js` | Stored ticket missing `status`, `dedupHash`, `updatedAt` fields | Added all three |
| 10 | `ticket.service.js` | AbortController timeout was `2000ms` then `3000ms` — Phase 1 EC-3 defines `5000ms` | Corrected to `5000ms` |
| 11 | `CONTEXT.md` | Row still showed `catalog \| Member C` — wrong feature | Correct entry is `tickets \| Member C \| 🟢 Complete` |

---

*Phase 3d — Implementation | CSE323 D5 | Member C — Ticket System*
