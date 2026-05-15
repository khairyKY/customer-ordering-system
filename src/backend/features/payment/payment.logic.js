/**
 * REQ_PAY_01, REQ_EC_1, REQ_EC_4 Implementation
 */

const calculateTotal = (subtotal, discount) => {
  if (subtotal < 0) {
    const error = new Error('InvalidAmountError');
    error.name = 'InvalidAmountError';
    throw error;
  }

  // REQ_EC_4: Promo Floor at $0.00
  const discountedSubtotal = Math.max(0, subtotal - discount);
  
  // REQ_PAY_01: 10% Tax Calculation
  const total = discountedSubtotal * 1.10;
  
  // Return rounded to 2 decimal places to avoid floating point issues in tests
  return Math.round(total * 100) / 100;
};

const validatePaymentInput = (data) => {
  if (!data.amount || data.amount <= 0) throw new Error('InvalidAmountError');
  if (!data.idempotencyKey) throw new Error('MissingIdempotencyKey');
  return true;
};

module.exports = { calculateTotal, validatePaymentInput };
