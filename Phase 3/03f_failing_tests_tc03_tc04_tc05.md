# CSE323 — Ticket System | Phase 3 Deliverable D5

## 03f: Failing Integration Tests (TC-03, TC-04 & TC-05)

**Member:** C — Ticket System Vertical Slice
**TDP STATUS:** FAILING — No implementation exists yet for these three endpoints. All tests must fail on first run.
**Location:** `src/backend/features/tickets/__tests__/ticket.routes.test.js`

---

## ticket.routes.test.js

```javascript
const request = require('supertest');
const express = require('express');

const app = express();
app.use(express.json());

// ⚠️ PENDING: Replace mockAuthGuard with real JWT middleware from Member D.
// Role is simulated via token string for testing purposes only.
const mockAuthGuard = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: JWT missing' });
  }

  const token = authHeader.split(' ')[1];

  if (token === 'agent-token') {
    req.user = { id: 'agent-456', role: 'agent' };
  } else {
    req.user = { id: 'user-123', role: 'customer' };
  }
  next();
};

const ticketRoutes = require('../ticket.routes');
app.use('/api/v1/tickets', mockAuthGuard, ticketRoutes);

describe('Ticket System — TC-03, TC-04, TC-05', () => {

  // -------------------------------------------------------------------------
  // TC-03: GET /api/v1/tickets — Customer views own tickets (JWT-scoped, paginated)
  // -------------------------------------------------------------------------
  describe('TC-03: Customer Ticket List (Paginated)', () => {

    it('TC-03-A: returns 200 with paginated list scoped to authenticated customer userId', async () => {
      const response = await request(app)
        .get('/api/v1/tickets?page=1&limit=10')
        .set('Authorization', 'Bearer customer-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tickets');
      expect(Array.isArray(response.body.tickets)).toBe(true);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('currentPage', 1);
      expect(response.body.pagination).toHaveProperty('totalTickets');
      expect(response.body.pagination).toHaveProperty('totalPages');

      // All returned tickets must belong to the authenticated user
      response.body.tickets.forEach(ticket => {
        expect(ticket.userId).toBe('user-123');
      });
    });

    it('TC-03-B: returns 401 when no Authorization header is provided', async () => {
      const response = await request(app).get('/api/v1/tickets');
      expect(response.status).toBe(401);
    });

  });

  // -------------------------------------------------------------------------
  // TC-04: GET /api/v1/tickets/triage — Agent triage queue (role-gated, priority sorted)
  // -------------------------------------------------------------------------
  describe('TC-04: Agent Triage Queue (Priority Sorted)', () => {

    it('TC-04-A: returns 403 when a customer JWT attempts to access the triage queue', async () => {
      const response = await request(app)
        .get('/api/v1/tickets/triage')
        .set('Authorization', 'Bearer customer-token');

      expect(response.status).toBe(403);
      expect(response.body.error).toMatch(/Forbidden/i);
    });

    it('TC-04-B: returns 200 with tickets sorted CRITICAL → HIGH → MEDIUM → LOW for agent JWT', async () => {
      const response = await request(app)
        .get('/api/v1/tickets/triage')
        .set('Authorization', 'Bearer agent-token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.tickets)).toBe(true);

      const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      const tickets       = response.body.tickets;

      for (let i = 0; i < tickets.length - 1; i++) {
        const currentRank = priorityOrder[tickets[i].priority];
        const nextRank    = priorityOrder[tickets[i + 1].priority];
        expect(currentRank).toBeLessThanOrEqual(nextRank);
      }
    });

  });

  // -------------------------------------------------------------------------
  // TC-05: PATCH /api/v1/tickets/:id/status — Status state machine
  // -------------------------------------------------------------------------
  describe('TC-05: Ticket Status State Machine', () => {

    it('TC-05-A: returns 200 on valid transition OPEN → IN_PROGRESS', async () => {
      const response = await request(app)
        .patch('/api/v1/tickets/tk-valid-1/status')
        .set('Authorization', 'Bearer agent-token')
        .send({ status: 'IN_PROGRESS' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('IN_PROGRESS');
    });

    it('TC-05-B: returns 422 on regression RESOLVED → OPEN', async () => {
      const response = await request(app)
        .patch('/api/v1/tickets/tk-resolved/status')
        .set('Authorization', 'Bearer agent-token')
        .send({ status: 'OPEN' });

      expect(response.status).toBe(422);
      expect(response.body.error).toMatch(/Invalid status transition/i);
    });

    it('TC-05-C: returns 422 on skip OPEN → RESOLVED', async () => {
      const response = await request(app)
        .patch('/api/v1/tickets/tk-open-skip/status')
        .set('Authorization', 'Bearer agent-token')
        .send({ status: 'RESOLVED' });

      expect(response.status).toBe(422);
      expect(response.body.error).toMatch(/Invalid status transition/i);
    });

    it('TC-05-D: returns 403 when a customer JWT attempts to update ticket status', async () => {
      const response = await request(app)
        .patch('/api/v1/tickets/tk-any/status')
        .set('Authorization', 'Bearer customer-token')
        .send({ status: 'IN_PROGRESS' });

      expect(response.status).toBe(403);
    });

    it('TC-05-E: returns 404 when ticket ID does not exist', async () => {
      const response = await request(app)
        .patch('/api/v1/tickets/NON_EXISTENT_ID/status')
        .set('Authorization', 'Bearer agent-token')
        .send({ status: 'IN_PROGRESS' });

      expect(response.status).toBe(404);
    });

  });

});
```

---

*Phase 3f — Failing Tests TC-03, TC-04 & TC-05 | CSE323 D5 | Member C — Ticket System*
