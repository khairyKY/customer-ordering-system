const { paymentSchema } = require('./payment.schema');
const { calculateTotal } = require('./payment.logic');

// Mock Database Storage for Testing Idempotency
const mockPayments = new Map();

const processPayment = async (data) => {
  // Support both Express req.body and direct object for testing
  const input = data.body || data;
  
  // 1. Validate Input (Step 2 Padlock)
  const validatedData = paymentSchema.parse(input);

  // 2. Check Idempotency (REQ_EC_2)
  if (mockPayments.has(validatedData.idempotencyKey)) {
    return { isDuplicate: true, transactionId: mockPayments.get(validatedData.idempotencyKey).id };
  }

  // 3. Logic Execution (REQ_PAY_01, REQ_EC_4)
  const discount = 0; // Simplified for basic slice audit
  const finalTotal = calculateTotal(validatedData.amount, discount);

  // 4. Record Payment
  const transactionId = `tx_${Date.now()}`;
  mockPayments.set(validatedData.idempotencyKey, { id: transactionId, ...validatedData });

  return { status: 'SUCCESS', total: finalTotal, transactionId };
};

// Express Wrapper for Route
const processPaymentRoute = async (req, res) => {
  try {
    const result = await processPayment(req);
    res.status(201).json(result);
  } catch (error) {
    if (error.name === 'ZodError') return res.status(400).json({ error: error.errors });
    res.status(500).json({ error: error.message });
  }
};

module.exports = { processPayment, processPaymentRoute };
