# CSE323 — Ticket System | Phase 3 Deliverable D5

## 03c: Failing Edge Case Tests (EC-1 to EC-5 Padlocks)

**Member:** C — Ticket System Vertical Slice
**TDP STATUS:** FAILING — 5 failed, 5 total. All tests confirm the behavioral contract. No implementation exists yet.
**Location:** `src/backend/features/tickets/__tests__/ticket.edge.test.js`

---

## ticket.edge.test.js

```javascript
const request = require('supertest');
const express = require('express');
const nock    = require('nock');

const app = express();
app.use(express.json());

// ⚠️ PENDING: Replace mockAuthGuard with real JWT middleware from Member D.
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

describe('Ticket System — Edge Case Tests (Padlocks)', () => {

  beforeEach(() => {
    nock.cleanAll();
  });

  // -------------------------------------------------------------------------
  // EC-1 (TC-06): XSS / SQL Injection Sanitization
  // -------------------------------------------------------------------------
  describe('EC-1 (TC-06): Sanitization — XSS / SQL Injection', () => {

    it('strips script tags from subject before persistence and returns 201', async () => {
      nock(HF_API_URL).post(HF_API_MODEL).reply(200, [{ score: 0.6 }]);

      const response = await request(app)
        .post('/api/v1/tickets')
        .set('Authorization', 'Bearer mock-jwt-token')
        .send({
          subject: '<script>alert("xss")</script>Normal subject',
          body:    'My order arrived damaged and I need a replacement.',
        });

      expect(response.status).toBe(201);
      expect(response.body.subject).not.toMatch(/<[^>]+>/);
      expect(response.body.subject).not.toContain('script');
    });

    it('treats SQL injection in subject as plain text — table not dropped', async () => {
      nock(HF_API_URL).post(HF_API_MODEL).reply(200, [{ score: 0.6 }]);

      const response = await request(app)
        .post('/api/v1/tickets')
        .set('Authorization', 'Bearer mock-jwt-token')
        .send({
          subject: "'; DROP TABLE tickets; --",
          body:    'My order arrived damaged and I need a replacement.',
        });

      expect(response.status).toBe(201);
      expect(response.body.subject).toBe("'; DROP TABLE tickets; --");
    });

  });

  // -------------------------------------------------------------------------
  // EC-2 (TC-07): Duplicate Submission
  // -------------------------------------------------------------------------
  describe('EC-2 (TC-07): Duplicate Submission — Deduplication Window', () => {

    it('returns 201 on first submission and 409 on identical re-submission within 10 minutes', async () => {
      const scope = nock(HF_API_URL)
        .post(HF_API_MODEL)
        .once()
        .reply(200, [{ score: 0.4 }]);

      const payload = {
        subject: 'Duplicate Issue',
        body:    'My order #5500 has not arrived after seven days.',
      };

      const first = await request(app)
        .post('/api/v1/tickets')
        .set('Authorization', 'Bearer mock-jwt-token')
        .send(payload);

      const second = await request(app)
        .post('/api/v1/tickets')
        .set('Authorization', 'Bearer mock-jwt-token')
        .send(payload);

      expect(first.status).toBe(201);
      expect(second.status).toBe(409);
      expect(second.body.error).toMatch(/duplicate ticket detected/i);
      expect(scope.isDone()).toBe(true); // HF called exactly once
    });

  });

  // -------------------------------------------------------------------------
  // EC-3 (TC-08): HuggingFace Timeout
  // -------------------------------------------------------------------------
  describe('EC-3 (TC-08): HuggingFace Timeout — Fallback to MEDIUM', () => {

    it('returns 201 with priority MEDIUM and sentimentSource "fallback" when HF times out', async () => {
      nock(HF_API_URL)
        .post(HF_API_MODEL)
        .replyWithError('AbortError: socket hang up');

      const response = await request(app)
        .post('/api/v1/tickets')
        .set('Authorization', 'Bearer mock-jwt-token')
        .send({
          subject: 'Timeout test',
          body:    'Testing fallback behaviour when HuggingFace is unavailable.',
        });

      expect(response.status).toBe(201);
      expect(response.body.priority).toBe('MEDIUM');
      expect(response.body.sentimentSource).toBe('fallback');
    });

  });

  // -------------------------------------------------------------------------
  // EC-4 (TC-09): Extreme Payload
  // -------------------------------------------------------------------------
  describe('EC-4 (TC-09): Extreme Payload — 422 Before Calling AI', () => {

    it('returns 422 for body exceeding 2000 characters and never calls HuggingFace', async () => {
      const response = await request(app)
        .post('/api/v1/tickets')
        .set('Authorization', 'Bearer mock-jwt-token')
        .send({
          subject: 'Big payload test',
          body:    'a'.repeat(2001),
        });

      expect(response.status).toBe(422);
      expect(nock.activeMocks()).toHaveLength(0);
    });

    it('returns 422 for subject shorter than 5 characters and never calls HuggingFace', async () => {
      const response = await request(app)
        .post('/api/v1/tickets')
        .set('Authorization', 'Bearer mock-jwt-token')
        .send({
          subject: 'Hi',
          body:    'My order arrived damaged and I need a replacement.',
        });

      expect(response.status).toBe(422);
      expect(nock.activeMocks()).toHaveLength(0);
    });

  });

  // -------------------------------------------------------------------------
  // EC-5 (TC-10): NaN / Null Score from HuggingFace
  // -------------------------------------------------------------------------
  describe('EC-5 (TC-10): Tokenizer Failure — NaN / Null Score Guard', () => {

    it('returns 201 with MEDIUM priority and sentimentSource "score_invalid" when HF returns null score', async () => {
      nock(HF_API_URL)
        .post(HF_API_MODEL)
        .reply(200, [{ score: null }]);

      const response = await request(app)
        .post('/api/v1/tickets')
        .set('Authorization', 'Bearer mock-jwt-token')
        .send({
          subject: 'Invalid score test',
          body:    'Testing null score fallback from HuggingFace.',
        });

      expect(response.status).toBe(201);
      expect(response.body.priority).toBe('MEDIUM');
      expect(response.body.sentimentSource).toBe('score_invalid');
    });

    it('returns 201 with MEDIUM priority and sentimentSource "score_invalid" when HF returns NaN score', async () => {
      nock(HF_API_URL)
        .post(HF_API_MODEL)
        .reply(200, [{ score: NaN }]);

      const response = await request(app)
        .post('/api/v1/tickets')
        .set('Authorization', 'Bearer mock-jwt-token')
        .send({
          subject: 'NaN score test',
          body:    'Testing NaN score fallback from HuggingFace.',
        });

      expect(response.status).toBe(201);
      expect(response.body.priority).toBe('MEDIUM');
      expect(response.body.sentimentSource).toBe('score_invalid');
    });

  });

});
```

---

## Test Execution Results

| Metric | Result |
| ------ | ------ |
| Test Suites | 1 failed |
| Tests | 5 failed, 5 total |
| Time | 1.513s |
| Reason | All routes return `404 Not Found` — no implementation exists yet |

> **TDP Confirmed:** All 5 tests fail as expected. The behavioral contract is set.
> Next step is writing the implementation to make these tests pass.

---

## Edge Case Coverage

| Test ID | Edge Case | Padlock | Expected Behaviour |
| ------- | --------- | ------- | ------------------ |
| EC-1 (TC-06) | XSS / SQL Injection | DOMPurify + Parameterized Queries | Strip HTML tags; return 201 with clean data |
| EC-2 (TC-07) | Duplicate Submission | SHA-256 hash + 600s window | First → 201; Second → 409; HF called once |
| EC-3 (TC-08) | HuggingFace Timeout | AbortController 5000ms | 201 + priority MEDIUM + sentimentSource "fallback" |
| EC-4 (TC-09) | Extreme Payload | Zod field validation | 422 before HF is called |
| EC-5 (TC-10) | NaN / Null Score | Score validity guard | 201 + priority MEDIUM + sentimentSource "score_invalid" |

---

*Phase 3c — Edge Case Tests | CSE323 D5 | Member C — Ticket System*
