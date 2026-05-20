// ============================================================
// paymentApi — Payment processing client
// Migrated to FastAPI backend on port 8000
// ============================================================
//
// Backend contract:
//   POST /api/v1/payment/process
//   Body:  { amount, promoCode?, idempotencyKey, cartTotal }
//   200 :  { status: "SUCCESS", total, transactionId }
//   422 :  Pydantic validation failure
// ============================================================

import { client } from './client';

/**
 * Submit a payment for the current cart.
 *
 * @param {object} args
 * @param {number} args.amount          - Post-tax total to charge (USD)
 * @param {number} args.cartTotal       - Server-side cart snapshot for collision check
 * @param {string} [args.promoCode]     - Optional promo code
 * @param {string} args.idempotencyKey  - UUID v4; reuse across retries
 * @returns {Promise<{ status: 'SUCCESS', total: number, transactionId: string }>}
 */
export async function processPayment({ amount, cartTotal, promoCode, idempotencyKey, items = [], shipping = {}, customerEmail = "guest@example.com", customerId = "guest" }) {
  // shared client attaches the JWT from localStorage automatically and
  // routes against VITE_PYTHON_API_BASE — no need to wire either by hand.
  const res = await client.post('/payment/process', {
    amount, cartTotal, promoCode, idempotencyKey, items, shipping, customerEmail, customerId,
  });
  return res.data;
}

/**
 * Generate a fresh idempotency key for a new checkout attempt.
 */
export function newIdempotencyKey() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
