# CSE323 — Ticket System | Phase 3 Deliverable D5

## 03b: Failing Integration Tests (TC-01 & TC-02)

**Member:** C — Ticket System Vertical Slice
**TDP STATUS:** FAILING — No implementation logic exists yet. All tests must fail on first run.
**Location:** `src/backend/features/tickets/__tests__/ticket.integration.test.js`

---

## ticket.integration.test.js

```javascript
const request = require('supertest');
const express = require('express');
const nock    = require('nock');

// App is constructed locally for this vertical slice test.
// Member D's Auth Service is not yet available — mock guard is used
// as a stand-in until Member D publishes the confirmed JWT structure.
// ⚠️ PENDING: Replace mockAuthGuard with real JWT middleware from Member D.
const app = express();
app.use(express.json());

const mockAuthGuard = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    req.user = { id: 'user-123', role: 'customer' };
    return next();
  }
  res.status(401).json({ error: 'Unauthorized: JWT missing' });
};

const ticketRoutes = require('../ticket.routes');
app.use('/api/v1/tickets', mockAuthGuard, ticketRoutes);

const HF_API_URL   = 'https://api-inference.huggingface.co';
const HF_API_MODEL = '/models/distilbert-base-uncased-finetuned-sst-2-english';

describe('Ticket System — Integration Tests', () => {

  beforeEach(() => {
    nock.cleanAll();
  });

  // -------------------------------------------------------------------------
  // TC-01: Create Ticket (Happy Path)
  // -------------------------------------------------------------------------
  describe('TC-01: Create Ticket', () => {

    it('TC-01-A: returns 201 and correct response shape on valid input', async () => {
      nock(HF_API_URL)
        .post(HF_API_MODEL)
        .reply(200, [{ label: 'NEGATIVE', score: 0.32 }]);

      const response = await request(app)
        .post('/api/v1/tickets')
        .set('Authorization', 'Bearer mock-jwt-token')
        .send({
          subject: 'Network connectivity issue',
          body:    'I cannot connect to the office VPN since this morning.',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('subject', 'Network connectivity issue');
      expect(response.body).toHaveProperty('status',  'OPEN');
      expect(response.body).toHaveProperty('priority');
      expect(response.body).toHaveProperty('sentimentSource');
      expect(response.body).toHaveProperty('userId', 'user-123');
    });

    it('TC-01-B: userId is taken from the JWT — not the request body', async () => {
      nock(HF_API_URL).post(HF_API_MODEL).reply(200, [{ label: 'NEGATIVE', score: 0.4 }]);

      const response = await request(app)
        .post('/api/v1/tickets')
        .set('Authorization', 'Bearer mock-jwt-token')
        .send({
          subject: 'Order missing',
          body:    'My order #8821 has not arrived after five days.',
        });

      expect(response.status).toBe(201);
      expect(response.body.userId).toBe('user-123');
    });

    it('TC-01-C: returns 401 when no Authorization header is provided', async () => {
      const response = await request(app)
        .post('/api/v1/tickets')
        .send({
          subject: 'No auth test',
          body:    'This request has no JWT attached.',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toMatch(/Unauthorized/i);
    });

  });

  // -------------------------------------------------------------------------
  // TC-02: AI Priority Mapping
  // -------------------------------------------------------------------------
  describe('TC-02: AI Priority Mapping', () => {

    const priorityTestCases = [
      { score: 0.05, expectedPriority: 'CRITICAL', desc: 'score < 0.25 maps to CRITICAL' },
      { score: 0.25, expectedPriority: 'HIGH',     desc: 'score >= 0.25 and < 0.50 maps to HIGH' },
      { score: 0.50, expectedPriority: 'MEDIUM',   desc: 'score >= 0.50 and < 0.75 maps to MEDIUM' },
      { score: 0.92, expectedPriority: 'LOW',      desc: 'score >= 0.75 maps to LOW' },
    ];

    priorityTestCases.forEach(({ score, expectedPriority, desc }) => {
      it(`TC-02: ${desc}`, async () => {
        nock(HF_API_URL)
          .post(HF_API_MODEL)
          .reply(200, [{ score }]);

        const response = await request(app)
          .post('/api/v1/tickets')
          .set('Authorization', 'Bearer mock-jwt-token')
          .send({
            subject: 'Priority test',
            body:    `Testing score ${score} maps to ${expectedPriority}`,
          });

        expect(response.status).toBe(201);
        expect(response.body.priority).toBe(expectedPriority);
        expect(response.body.sentimentSource).toBe('hf_model');
      });
    });

    it('TC-02-E: returns 201 with MEDIUM priority and sentimentSource "fallback" when HuggingFace times out', async () => {
      nock(HF_API_URL)
        .post(HF_API_MODEL)
        .replyWithError('AbortError: socket hang up');

      const response = await request(app)
        .post('/api/v1/tickets')
        .set('Authorization', 'Bearer mock-jwt-token')
        .send({
          subject: 'API timeout test',
          body:    'Testing fallback when HuggingFace is unavailable.',
        });

      expect(response.status).toBe(201);
      expect(response.body.priority).toBe('MEDIUM');
      expect(response.body.sentimentSource).toBe('fallback');
    });

    it('TC-02-F: returns 201 with MEDIUM priority and sentimentSource "score_invalid" when HuggingFace returns NaN', async () => {
      nock(HF_API_URL)
        .post(HF_API_MODEL)
        .reply(200, [{ score: NaN }]);

      const response = await request(app)
        .post('/api/v1/tickets')
        .set('Authorization', 'Bearer mock-jwt-token')
        .send({
          subject: 'NaN score test',
          body:    'Testing NaN fallback from HuggingFace.',
        });

      expect(response.status).toBe(201);
      expect(response.body.priority).toBe('MEDIUM');
      expect(response.body.sentimentSource).toBe('score_invalid');
    });

  });

});
```

---

## Faults Fixed

| # | Location | Fault | Fix |
|---|----------|-------|-----|
| 1 | TC-01 request body | Used `title` / `description` — wrong field names | Corrected to `subject` / `body` to match Phase 1 schema |
| 2 | TC-01 response assertion | Checked `sentiment_source: "HuggingFace"` — wrong value and wrong case | Corrected to `sentimentSource: "hf_model"` (camelCase, Phase 1 value) |
| 3 | TC-02 priority test cases | Only 2 cases (`HIGH` and `LOW`) — missing `CRITICAL` and `MEDIUM` bands | Added all 4 priority bands with correct score boundaries |
| 4 | TC-02 priority mapping | `NEGATIVE score 0.98 → HIGH` — wrong; Phase 1 maps `score < 0.25 → CRITICAL` | Rebuilt test cases using the positivity score boundaries from Phase 1 FR-02 |
| 5 | TC-02 fallback | `sentiment_source: "Local Fallback"` — wrong value | Corrected to `sentimentSource: "fallback"` |
| 6 | TC-02 fallback | Used `reply(500)` to simulate timeout — wrong; a 500 is not a timeout | Changed to `replyWithError('AbortError')` to correctly simulate socket timeout |
| 7 | TC-02 | Missing NaN score test case (EC-5) | Added `TC-02-F` for NaN score → `score_invalid` fallback |
| 8 | TC-01 | Missing `userId` binding assertion | Added `TC-01-B` to verify `userId` comes from JWT, not request body |
| 9 | All routes | Used `/api/tickets` — wrong path | Corrected to `/api/v1/tickets` to match API contract |
| 10 | CLI output | Gemini UI chrome (`sandbox`, `quota`, `30% used`) leaked into line 12–13 | Removed — was terminal UI bleeding into the file content |

---

*Phase 3b — Failing Tests | CSE323 D5 | Member C — Ticket System*
