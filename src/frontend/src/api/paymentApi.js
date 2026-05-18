// ============================================================
// paymentApi — Member B's Payment Slice client
// Stitch-source: cart-checkout terminal | Payment step (Zone 2)
// ============================================================
//
// Backend contract (Member B):
//   POST /api/payment/process
//   Body:  { amount, promoCode?, idempotencyKey, cartTotal }
//   Auth:  Bearer JWT (issued by Auth slice)
//   200 :  { status: "SUCCESS", total, transactionId }
//   400 :  Zod validation failure (negative amount, decimal, etc.)
//   401 :  No / invalid JWT
//   409 :  Idempotency window collision (replay-safe)
//   500 :  Database / gateway error
//
// Idempotency: client MUST generate one UUID per checkout session
//              and reuse it on retries. We use `crypto.randomUUID()`.

import axios from 'axios';

const PAYMENT_BASE = 'http://localhost:3001/api/payment';

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
export async function processPayment({ amount, cartTotal, promoCode, idempotencyKey }) {
  const token = localStorage.getItem('jwt');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await axios.post(
    `${PAYMENT_BASE}/process`,
    { amount, cartTotal, promoCode, idempotencyKey },
    { headers },
  );
  return res.data;
}

/**
 * Generate a fresh idempotency key for a new checkout attempt.
 * Falls back to a v4-shaped string if crypto.randomUUID is unavailable
 * (older browsers / non-secure contexts).
 */
export function newIdempotencyKey() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  // Fallback — RFC4122-shaped, not crypto-strong
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
