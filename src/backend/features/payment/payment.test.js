const { describe, it, expect } = require('vitest');
const { calculateTotal, validatePaymentInput } = require('./payment.logic');

describe('Payment Calculation & Validation Boundaries', () => {
  
  it('REQ_PAY_01: Should calculate exactly 10% tax on subtotal', () => {
    const subtotal = 100.00;
    const expected = 110.00; // 100 * 1.10
    const result = calculateTotal(subtotal, 0);
    expect(result).toBe(expected);
  });

  it('REQ_EC_1: Should throw InvalidAmountError for negative cart totals', () => {
    const subtotal = -10.00;
    expect(() => calculateTotal(subtotal, 0)).toThrow('InvalidAmountError');
  });

  it('REQ_EC_4: Should apply promo floor at $0.00 for excessive discounts', () => {
    const subtotal = 40.00;
    const discount = 50.00;
    const result = calculateTotal(subtotal, discount);
    expect(result).toBe(0.00); // Floor logic: Max(0, 40-50) * 1.10 = 0
  });

  it('REQ_EC_2: Should prevent double charges via Idempotency Key', async () => {
    // This test mocks the DB/Gateway to ensure duplicate keys return cached results
    const paymentData = {
      idempotencyKey: '550e8400-e29b-41d4-a716-446655440000',
      amount: 100
    };
    
    // First call (Mocking success)
    const firstCall = await processPayment(paymentData);
    
    // Second call with SAME key
    const secondCall = await processPayment(paymentData);
    
    expect(secondCall.isDuplicate).toBe(true);
    expect(secondCall.transactionId).toBe(firstCall.transactionId);
  });
});
