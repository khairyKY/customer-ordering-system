const { describe, it, expect } = require('vitest');
const { calculateTotal, validatePaymentInput } = require('./payment.logic');
const { processPayment } = require('./payment.controller');
const { paymentSchema } = require('./payment.schema');

describe('Payment Unit Tests (Pyramid: 70%)', () => {

  describe('Mathematical Boundaries (calculateTotal)', () => {
    it('REQ_PAY_01: Should calculate exactly 10% tax on subtotal', () => {
      expect(calculateTotal(100.00, 0)).toBe(110.00);
    });

    it('REQ_PAY_01: Should handle floating point precision ($19.99 case)', () => {
      // 19.99 * 1.10 = 21.989 -> 21.99
      expect(calculateTotal(19.99, 0)).toBe(21.99);
    });

    it('REQ_EC_1: Should throw InvalidAmountError for negative subtotal', () => {
      expect(() => calculateTotal(-1, 0)).toThrow('InvalidAmountError');
    });

    it('REQ_EC_4: Should apply promo floor at $0.00 for excessive discounts', () => {
      expect(calculateTotal(50, 60)).toBe(0.00);
    });

    it('Threshold: Should calculate correctly at the $0.01 minimum', () => {
      // 0.01 * 1.10 = 0.011 -> 0.01
      expect(calculateTotal(0.01, 0)).toBe(0.01);
    });
  });

  describe('Input Validation (paymentSchema Padlocks)', () => {
    const validData = {
      amount: 100,
      idempotencyKey: '550e8400-e29b-41d4-a716-446655440000',
      cartTotal: 100
    };

    it('Boundary: Should reject non-positive amounts', () => {
      const result = paymentSchema.safeParse({ ...validData, amount: 0 });
      expect(result.success).toBe(false);
    });

    it('Threshold: Should reject amounts with > 2 decimal places', () => {
      const result = paymentSchema.safeParse({ ...validData, amount: 10.001 });
      expect(result.success).toBe(false);
    });

    it('Extreme: Should reject malformed UUIDs for idempotency', () => {
      const result = paymentSchema.safeParse({ ...validData, idempotencyKey: 'not-a-uuid' });
      expect(result.success).toBe(false);
    });

    it('Extreme: Should reject non-alphanumeric promo codes', () => {
      const result = paymentSchema.safeParse({ ...validData, promoCode: 'PROMO-123!' });
      expect(result.success).toBe(false);
    });

    it('Threshold: Should reject promo codes > 20 characters', () => {
      const result = paymentSchema.safeParse({ ...validData, promoCode: 'A'.repeat(21) });
      expect(result.success).toBe(false);
    });
  });

  describe('Idempotency & Logic Integration', () => {
    it('REQ_EC_2: Should prevent double charges via Idempotency Key', async () => {
      const paymentData = {
        amount: 100,
        idempotencyKey: 'unique-key-123',
        cartTotal: 100
      };
      
      const firstCall = await processPayment(paymentData);
      const secondCall = await processPayment(paymentData);
      
      expect(secondCall.isDuplicate).toBe(true);
      expect(secondCall.transactionId).toBe(firstCall.transactionId);
    });

    it('Failure Path: Should handle missing idempotency key in logic layer', () => {
      expect(() => validatePaymentInput({ amount: 100 })).toThrow('MissingIdempotencyKey');
    });

    it('Failure Path: Should handle invalid amount in logic layer', () => {
      expect(() => validatePaymentInput({ amount: -5, idempotencyKey: 'key' })).toThrow('InvalidAmountError');
    });
  });

});
