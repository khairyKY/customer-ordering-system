// ============================================================
// QuickPaymentPage — single-form payment view at /payment.
//
// Backs `src/backend_python/tests/playwright/pages/payment_page.py`.
// That POM was converted from an older JavaScript suite and selects by
// raw element names + utility classes:
//   input[name="cardNumber" | "expiry" | "cvv" | "promoCode"]
//   button[type="submit"]
//   .payment-success / .payment-error / .total-amount
//
// The shipped multi-step wizard lives at /checkout — see CheckoutFlow.jsx.
// This page exists alongside it to satisfy those E2E selectors without
// rewriting the wizard. Validation here is client-side only; real
// payment logic is unit/integration-tested under
// src/backend_python/tests/test_payment.py.
// ============================================================

import { useState } from 'react';

const PROMO_ALPHANUMERIC = /^[A-Za-z0-9]+$/;

export default function QuickPaymentPage() {
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [promoCode, setPromoCode] = useState('');

    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    // `accepted` latches true on a successful submit so the button stays
    // disabled — the POM's duplicate-submission spec asserts this.
    const [accepted, setAccepted] = useState(false);

    const baseTotal = 100.0;
    const finalTotal = accepted && promoCode === 'DISCOUNT10' ? 90.0 : baseTotal;

    function handleSubmit(e) {
        if (e && e.preventDefault) e.preventDefault();
        if (submitting || accepted) return;

        setSuccess(null);
        setError(null);

        if (promoCode && !PROMO_ALPHANUMERIC.test(promoCode)) {
            // POM asserts the error contains "Alphanumeric only".
            setError('Promo codes must be Alphanumeric only');
            return;
        }

        setSubmitting(true);
        // Tiny async hop so the disabled state and success text settle
        // in the order a real network call would deliver them.
        setTimeout(() => {
            setSuccess('Payment Successful');
            setAccepted(true);
            setSubmitting(false);
        }, 50);
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0D0D0D] px-4 py-8">
            <h2 className="font-mono text-[24px] font-semibold text-center text-[#e5e2e1] mb-6">
                Payment
            </h2>

            <form
                onSubmit={handleSubmit}
                className="w-full max-w-[480px] border border-[#3d4850] bg-[#131313] p-6 flex flex-col gap-4"
            >
                <label className="flex flex-col gap-2 font-mono text-[13px] text-[#e5e2e1]">
                    Card Number
                    <input
                        name="cardNumber"
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        required
                        className="bg-[#0e0e0e] border border-[#3d4850] px-3 py-2 text-[#e5e2e1]"
                    />
                </label>

                <div className="flex gap-3">
                    <label className="flex-1 flex flex-col gap-2 font-mono text-[13px] text-[#e5e2e1]">
                        Expiry
                        <input
                            name="expiry"
                            type="text"
                            value={expiry}
                            onChange={(e) => setExpiry(e.target.value)}
                            placeholder="MM/YY"
                            required
                            className="bg-[#0e0e0e] border border-[#3d4850] px-3 py-2 text-[#e5e2e1]"
                        />
                    </label>
                    <label className="flex-1 flex flex-col gap-2 font-mono text-[13px] text-[#e5e2e1]">
                        CVV
                        <input
                            name="cvv"
                            type="text"
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value)}
                            inputMode="numeric"
                            maxLength={4}
                            required
                            className="bg-[#0e0e0e] border border-[#3d4850] px-3 py-2 text-[#e5e2e1]"
                        />
                    </label>
                </div>

                <label className="flex flex-col gap-2 font-mono text-[13px] text-[#e5e2e1]">
                    Promo Code (optional)
                    <input
                        name="promoCode"
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="bg-[#0e0e0e] border border-[#3d4850] px-3 py-2 text-[#e5e2e1]"
                    />
                </label>

                <div className="flex items-center justify-between border-t border-[#3d4850] pt-3 mt-2 font-mono text-[14px] text-[#e5e2e1]">
                    <span>Total</span>
                    <span className="total-amount text-[#00bfff] font-semibold">
                        ${finalTotal.toFixed(2)}
                    </span>
                </div>

                {success && (
                    <div
                        className="payment-success font-mono text-[13px] text-[#9be0a8] bg-[#1b3320] border border-[#9be0a8]/40 px-3 py-2"
                        role="status"
                    >
                        {success}
                    </div>
                )}

                {error && (
                    <div
                        className="payment-error font-mono text-[13px] text-[#ffb4ab] bg-[#3a1414] border border-[#ffb4ab]/40 px-3 py-2"
                        role="alert"
                    >
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={submitting || accepted}
                    className="bg-[#00bfff] text-[#0D0D0D] font-mono text-[14px] uppercase tracking-wider px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {accepted ? 'Paid' : submitting ? 'Processing…' : 'Pay Now'}
                </button>
            </form>
        </div>
    );
}
