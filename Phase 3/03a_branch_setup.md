# CSE323 — Ticket System | Phase 3 Deliverable D5

## 03a: Branch Setup & Vertical Slice Initialization

**Member:** C — Ticket System Vertical Slice
**Branch:** `feature/ticket-api`
**Status:** 🟡 In Progress — Scaffold complete, no business logic yet.

---

## Section 1: Folder Structure

```
src/backend/features/tickets/
├── ticket.routes.js
├── ticket.controller.js
├── ticket.service.js
├── ticket.validators.js
└── __tests__/
    ├── ticket.service.test.js
    └── ticket.controller.test.js

src/frontend/src/features/tickets/
├── api/
│   └── ticketApi.js
├── components/
│   ├── TicketForm.jsx
│   └── TicketList.jsx
├── hooks/
│   └── useTickets.js
├── store/
│   └── ticketStore.js
├── types/
│   └── ticket.types.js
└── __tests__/
    ├── TicketForm.test.jsx
    └── TicketList.test.jsx

src/database/
└── tickets.sql
```

---

## Section 2: Backend Files

### ticket.validators.js
**Location:** `src/backend/features/tickets/ticket.validators.js`

```javascript
const { z } = require('zod');

const createTicketSchema = z.object({
  subject: z
    .string()
    .min(5,   { message: 'subject must be at least 5 characters' })
    .max(120, { message: 'subject must be at most 120 characters' }),
  body: z
    .string()
    .min(10,   { message: 'body must be at least 10 characters' })
    .max(2000, { message: 'body must be at most 2000 characters' }),
});

const updateStatusSchema = z.object({
  status: z.enum(['IN_PROGRESS', 'RESOLVED'], {
    errorMap: () => ({ message: 'status must be IN_PROGRESS or RESOLVED' }),
  }),
});

module.exports = { createTicketSchema, updateStatusSchema };
```

---

## Section 3: Frontend Files

### ticket.types.js
**Location:** `src/frontend/src/features/tickets/types/ticket.types.js`

```javascript
/**
 * @typedef {Object} Ticket
 * @property {string}  id
 * @property {string}  userId
 * @property {string}  subject
 * @property {string}  body
 * @property {TicketStatus}    status
 * @property {PriorityLevel}   priority
 * @property {SentimentSource} sentimentSource
 * @property {number|null}     sentimentScore
 * @property {string}  dedupHash
 * @property {string}  createdAt
 * @property {string}  updatedAt
 */

export const TicketStatus = {
  OPEN:        'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED:    'RESOLVED',
};

export const PriorityLevel = {
  CRITICAL: 'CRITICAL',
  HIGH:     'HIGH',
  MEDIUM:   'MEDIUM',
  LOW:      'LOW',
};

export const SentimentSource = {
  HF_MODEL:      'hf_model',
  FALLBACK:      'fallback',
  SCORE_INVALID: 'score_invalid',
  LOW_CONTENT:   'low_content',
};
```

---

### useTickets.js
**Location:** `src/frontend/src/features/tickets/hooks/useTickets.js`

```javascript
import { useState, useEffect } from 'react';
import { ticketApi } from '../api/ticketApi';

export const useTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const fetchTickets = async (page = 1, limit = 10) => {
    setLoading(true);
    setError(null);
    try {
      const data = await ticketApi.getMyTickets({ page, limit });
      setTickets(data.tickets);
    } catch (err) {
      setError(err.message || 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  return { tickets, loading, error, fetchTickets };
};
```

---

### ticketStore.js
**Location:** `src/frontend/src/features/tickets/store/ticketStore.js`

```javascript
import { create } from 'zustand';

export const useTicketStore = create((set) => ({
  tickets:    [],
  loading:    false,
  error:      null,

  setTickets: (tickets) => set({ tickets }),
  setLoading: (loading) => set({ loading }),
  setError:   (error)   => set({ error }),
  clearError: ()        => set({ error: null }),
}));
```

---

## Section 4: Database

### tickets.sql
**Location:** `src/database/tickets.sql`

```sql
-- CSE323 — Ticket System | Database Schema
-- Member C — Ticket System Vertical Slice

CREATE TABLE IF NOT EXISTS tickets (
    id               TEXT          PRIMARY KEY,
    user_id          TEXT          NOT NULL,
    subject          VARCHAR(120)  NOT NULL CHECK (LENGTH(subject) >= 5),
    body             VARCHAR(2000) NOT NULL CHECK (LENGTH(body) >= 10),
    status           TEXT          NOT NULL DEFAULT 'OPEN'
                                   CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED')),
    priority         TEXT          NOT NULL DEFAULT 'MEDIUM'
                                   CHECK (priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    sentiment_score  REAL,
    sentiment_source TEXT          NOT NULL DEFAULT 'fallback'
                                   CHECK (sentiment_source IN ('hf_model', 'fallback', 'score_invalid', 'low_content')),
    dedup_hash       TEXT          NOT NULL,
    created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (user_id, dedup_hash)
);

CREATE INDEX IF NOT EXISTS idx_tickets_user_id    ON tickets (user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_priority   ON tickets (priority);
CREATE INDEX IF NOT EXISTS idx_tickets_status     ON tickets (status);
CREATE INDEX IF NOT EXISTS idx_tickets_dedup_hash ON tickets (user_id, dedup_hash);
```

---

## Section 5: Faults Fixed

| # | File | Fault | Fix |
|---|------|-------|-----|
| 1 | `ticket.validators.js` | Zod import commented out; empty placeholder | Replaced with real Zod schemas for create and status update |
| 2 | `ticket.types.js` | Used `title`/`description` instead of `subject`/`body` | Corrected to match Phase 1 field names |
| 3 | `ticket.types.js` | Status ENUM had `CLOSED` instead of `RESOLVED` | Corrected to `RESOLVED` |
| 4 | `ticket.types.js` | Missing `PriorityLevel` and `SentimentSource` ENUMs | Added both |
| 5 | `useTickets.js` | Returned empty `{}`; no real logic | Replaced with real state + fetch logic |
| 6 | `ticketStore.js` | Zustand import commented out; returned empty `{}` | Replaced with real Zustand store |
| 7 | `tickets.sql` | Schema fully commented out | Uncommented and rebuilt with all required columns |
| 8 | `tickets.sql` | Used `title`/`description`; missing `priority`, `sentiment_source`, `dedup_hash`, `user_id` | Added all missing columns with CHECK constraints |
| 9 | `TicketForm.test.jsx` | Used default import; component exported as named export | Changed to `import { TicketForm }` |
| 10 | `CONTEXT.md` | Row said `catalog \| Member C` — wrong feature | Correct entry is `tickets \| Member C \| 🟡 In Progress` |

---

*Phase 3a — Branch Setup | CSE323 D5 | Member C — Ticket System*
