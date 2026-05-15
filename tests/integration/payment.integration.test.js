const { describe, it, expect, beforeAll } = require('vitest');
const { processPayment } = require('../../src/backend/features/payment/payment.controller');

describe('Payment Integration Tests (Pyramid: 20%)', () => {
  
  it('Should successfully flow through Schema -> Controller -> Logic', async () => {
    const validRequest = {
      body: {
        amount: 50.00,
        idempotencyKey: 'int-test-uuid-1',
        cartTotal: 50.00
      }
    };

    const result = await processPayment(validRequest);
    
    expect(result.status).toBe('SUCCESS');
    expect(result.total).toBe(55.00); // 50 * 1.10
    expect(result.transactionId).toBeDefined();
  });

  it('Should block invalid data at the schema boundary before reaching logic', async () => {
    const invalidRequest = {
      body: {
        amount: -10, // REQ_EC_1 violation
        idempotencyKey: 'valid-uuid', // Not actually a UUID per Zod
        cartTotal: 100
      }
    };

    // processPayment uses paymentSchema.parse which throws ZodError
    await expect(processPayment(invalidRequest)).rejects.toThrow();
  });

  it('Should maintain state isolation across multiple payment attempts', async () => {
    const req1 = { amount: 10, idempotencyKey: 'iso-1', cartTotal: 10 };
    const req2 = { amount: 20, idempotencyKey: 'iso-2', cartTotal: 20 };

    const res1 = await processPayment(req1);
    const res2 = await processPayment(req2);

    expect(res1.transactionId).not.toBe(res2.transactionId);
    expect(res1.total).toBe(11);
    expect(res2.total).toBe(22);
  });
});
