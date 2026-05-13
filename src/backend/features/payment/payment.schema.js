const { z } = require('zod');

/**
 * REQ_EC_1, REQ_EC_2, REQ_EC_4 Padlocks
 * Structurally impossible to violate boundaries at input layer.
 */
const paymentSchema = z.object({
  amount: z.number()
    .positive('Amount must be positive (REQ_EC_1)')
    .multipleOf(0.01, 'Max 2 decimal places'),
  
  promoCode: z.string()
    .regex(/^[a-zA-Z0-9]*$/, 'Alphanumeric only')
    .max(20, 'Max 20 characters')
    .optional(),
  
  idempotencyKey: z.string()
    .uuid('Invalid Idempotency Key format (REQ_EC_2)'),
  
  cartTotal: z.number()
    .refine((val) => val >= 0, {
      message: "Cart total cannot be negative (REQ_EC_2 Padlock)",
    })
});

module.exports = { paymentSchema };
