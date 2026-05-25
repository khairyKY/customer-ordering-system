// ============================================================
// CheckoutFlow — Dev-Cosmic 7-Step Checkout Funnel (Zone 2)
// pc-parts.store  |  CSE323 Customer Ordering System
//
// Steps: Cart → Auth → Shipping → Method → Payment → Review → Success
//
// Each step is a panel that mounts the right Stitch layout
// and advances `step` state on a successful action. The Cart
// step delegates to the existing CartPage component to avoid
// duplicating Member A's table.
//
// API:
//   step 1 — fetchCart / updateCartItem / removeCartItem   (cartApi)
//   step 2 — login / register                              (authApi)
//   step 5 — processPayment + newIdempotencyKey            (paymentApi)
// ============================================================

import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import NeonButton    from '../components/ui/NeonButton';
import TerminalInput from '../components/ui/TerminalInput';

import { processPayment, newIdempotencyKey } from '../api/paymentApi';
import { useAuthStore } from '../features/auth/store/authStore';

import CartPage from '../components/CartPage';

const STEPS = [
  { id: 1, key: 'cart',     label: 'CART' },
  { id: 2, key: 'auth',     label: 'AUTH' },
  { id: 3, key: 'shipping', label: 'SHIPPING' },
  { id: 4, key: 'method',   label: 'METHOD' },
  { id: 5, key: 'payment',  label: 'PAYMENT' },
  { id: 6, key: 'review',   label: 'REVIEW' },
  { id: 7, key: 'success',  label: 'SUCCESS' },
];

function Stepper({ step }) {
  return (
    <ol
      className="flex items-center justify-center gap-2 font-mono text-[12px] mb-8"
      aria-label="Checkout progress"
    >
      {STEPS.map((s, idx) => (
        <li key={s.key} className="flex items-center gap-2">
          <span
            className={[
              'border px-2 py-1 uppercase tracking-wider',
              s.id < step  ? 'border-tertiary-container text-tertiary-container'
              : s.id === step ? 'border-primary-container text-primary-container bg-primary-container/10'
              : 'border-outline-variant text-text-muted',
            ].join(' ')}
            data-testid={`step-${s.key}`}
          >
            {s.id}. {s.label}
          </span>
          {idx < STEPS.length - 1 && <span className="text-outline-variant">─</span>}
        </li>
      ))}
    </ol>
  );
}

export default function CheckoutFlow({ cart, onCartUpdate }) {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const [step, setStep] = useState(1);
  const [shipping, setShipping] = useState({
    fullName: '',
    street:   '',
    city:     '',
    state:    '',
    zip:      '',
    country:  'EG',
  });
  const [method, setMethod] = useState('card');           // 'card' | 'cod'
  const [promoCode, setPromoCode] = useState('');
  const [paymentToken, setPaymentToken] = useState('');   // masked CC token (mock)
  const [idempotencyKey] = useState(() => newIdempotencyKey());
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(null); // { transactionId, total }

  const cartTotal = useMemo(() => cart?.total ?? 0, [cart]);
  
  if (user?.role === 'admin') {
    return (
      <div className="p-8 max-w-md mx-auto text-center font-mono py-16" data-testid="checkout-flow">
        <h1 className="text-error text-[24px] font-bold mb-4">// ACCESS_DENIED</h1>
        <p className="text-text-muted">Administrators are restricted from making storefront purchases. Switch to a customer account to test checkout.</p>
      </div>
    );
  }

  // ── Step renderers ──────────────────────────────────────────

  function renderCartStep() {
    return (
      <div className="flex flex-col gap-4" data-testid="checkout-cart-step">
        <CartPage cart={cart} onCartUpdate={onCartUpdate} onNavigate={() => {}} hideCheckoutButton={true} />
        <div className="flex justify-end">
          <NeonButton onClick={() => setStep(2)} disabled={!cart?.items?.length}>
            [ NEXT → AUTH ]
          </NeonButton>
        </div>
      </div>
    );
  }

  function renderAuthStep() {
    if (isAuthenticated) {
      return (
        <div className="flex flex-col items-center gap-4 py-8" data-testid="checkout-auth-step">
          <p className="font-mono text-[13px] text-text-muted">
            // SIGNED_IN_AS: <span className="text-on-background">{user?.email}</span>
          </p>
          <NeonButton onClick={() => setStep(3)}>[ NEXT → SHIPPING ]</NeonButton>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center gap-4 py-8" data-testid="checkout-auth-step">
        <p className="font-mono text-[13px] text-text-muted">
          // AUTHENTICATION_REQUIRED
        </p>
        <div className="flex gap-2">
          <NeonButton onClick={() => navigate('/admin/login', { state: { returnTo: '/checkout' } })}>
            [ SIGN IN ]
          </NeonButton>
          <NeonButton variant="secondary"
            onClick={() => navigate('/admin/register', { state: { returnTo: '/checkout' } })}
          >
            [ CREATE ACCOUNT ]
          </NeonButton>
        </div>
        <button
          onClick={(e) => { e.preventDefault(); setStep(3); }}
          className="font-mono text-[12px] text-text-muted underline hover:text-on-background"
        >
          continue as guest →
        </button>
      </div>
    );
  }

  function renderShippingStep() {
    const ok = shipping.fullName && shipping.street && shipping.city && shipping.zip;
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto" data-testid="checkout-shipping-step">
        <TerminalInput placeholder="FULL NAME"     value={shipping.fullName} onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })} ariaLabel="Full name" />
        <TerminalInput placeholder="COUNTRY"       value={shipping.country}  onChange={(e) => setShipping({ ...shipping, country:  e.target.value })} ariaLabel="Country" />
        <TerminalInput placeholder="STREET"        value={shipping.street}   onChange={(e) => setShipping({ ...shipping, street:   e.target.value })} ariaLabel="Street" className="md:col-span-2" />
        <TerminalInput placeholder="CITY"          value={shipping.city}     onChange={(e) => setShipping({ ...shipping, city:     e.target.value })} ariaLabel="City" />
        <TerminalInput placeholder="STATE/REGION"  value={shipping.state}    onChange={(e) => setShipping({ ...shipping, state:    e.target.value })} ariaLabel="State" />
        <TerminalInput placeholder="POSTAL_CODE"   value={shipping.zip}      onChange={(e) => setShipping({ ...shipping, zip:      e.target.value })} ariaLabel="ZIP" />
        <div className="md:col-span-2 flex justify-between mt-4">
          <NeonButton variant="secondary" onClick={() => setStep(2)}>[ ← BACK ]</NeonButton>
          <NeonButton onClick={() => setStep(4)} disabled={!ok}>[ NEXT → METHOD ]</NeonButton>
        </div>
      </div>
    );
  }

  function renderMethodStep() {
    return (
      <div className="max-w-md mx-auto flex flex-col gap-3" data-testid="checkout-method-step">
        <h3 className="font-mono text-[13px] text-text-muted uppercase mb-2">// SELECT_PAYMENT_METHOD</h3>
        {[
          { v: 'card', label: '[ CREDIT / DEBIT CARD ]' },
          { v: 'cod',  label: '[ CASH ON DELIVERY     ]' },
        ].map((opt) => (
          <label
            key={opt.v}
            className={`block cursor-pointer border px-3 py-3 font-mono text-[13px] ${
              method === opt.v ? 'border-primary-container text-primary-container bg-primary-container/10' : 'border-outline-variant text-on-background'
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value={opt.v}
              checked={method === opt.v}
              onChange={() => setMethod(opt.v)}
              className="mr-2 accent-primary-container"
            />
            {opt.label}
          </label>
        ))}
        <div className="flex justify-between mt-4">
          <NeonButton variant="secondary" onClick={() => setStep(3)}>[ ← BACK ]</NeonButton>
          <NeonButton onClick={() => setStep(5)}>[ NEXT → PAYMENT ]</NeonButton>
        </div>
      </div>
    );
  }

  function renderPaymentStep() {
    if (method === 'cod') {
      return (
        <div className="max-w-md mx-auto py-6 flex flex-col items-center gap-3" data-testid="checkout-payment-step">
          <p className="font-mono text-[13px] text-text-muted">
            // CASH_ON_DELIVERY — no card capture needed.
          </p>
          <div className="flex justify-between w-full mt-2">
            <NeonButton variant="secondary" onClick={() => setStep(4)}>[ ← BACK ]</NeonButton>
            <NeonButton onClick={() => setStep(6)}>[ NEXT → REVIEW ]</NeonButton>
          </div>
        </div>
      );
    }
    return (
      <div className="max-w-md mx-auto flex flex-col gap-3" data-testid="checkout-payment-step">
        <TerminalInput placeholder="CARD NUMBER (mock)"
          value={paymentToken} onChange={(e) => setPaymentToken(e.target.value)} ariaLabel="Card token" />
        <TerminalInput placeholder="PROMO_CODE (optional)" prefix="%"
          value={promoCode} onChange={(e) => setPromoCode(e.target.value)} ariaLabel="Promo code" />
        <p className="font-mono text-[11px] text-text-muted">
          // PADLOCK: idempotency_key = <code className="text-primary-container">{idempotencyKey.slice(0, 8)}...</code>
        </p>
        <div className="flex justify-between mt-4">
          <NeonButton variant="secondary" onClick={() => setStep(4)}>[ ← BACK ]</NeonButton>
          <NeonButton onClick={() => setStep(6)} disabled={!paymentToken}>[ NEXT → REVIEW ]</NeonButton>
        </div>
      </div>
    );
  }

  async function submitPayment() {
    setSubmitting(true);
    setError(null);
    try {
      const result = await processPayment({
        amount:         cartTotal,
        cartTotal,
        promoCode:      promoCode || undefined,
        idempotencyKey,
        items:          cart.items || [],
        shipping:       shipping,
        customerEmail:  user?.email || 'guest@example.com',
        customerId:     user?.id || user?.user_id || 'guest',
      });
      setConfirmation({ transactionId: result.transactionId, total: result.total });
      setStep(7);
    } catch (err) {
      const detail = err.response?.data?.error || err.response?.data?.detail?.error;
      setError(detail || 'Payment failed. Try again or use a different method.');
    } finally {
      setSubmitting(false);
    }
  }

  function renderReviewStep() {
    return (
      <div className="max-w-2xl mx-auto flex flex-col gap-4" data-testid="checkout-review-step">
        <h3 className="font-mono text-[13px] text-text-muted uppercase">// ORDER_REVIEW</h3>

        <div className="border border-outline-variant p-4 font-mono text-[13px] flex flex-col gap-1">
          <div className="flex justify-between"><span className="text-text-muted">SUBTOTAL</span><span>${(cart?.subtotal ?? 0).toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-text-muted">TAX (10%)</span><span>${(cart?.tax ?? 0).toFixed(2)}</span></div>
          <div className="flex justify-between border-t border-outline-variant pt-1 mt-1 font-bold text-primary-container">
            <span>TOTAL</span><span data-testid="review-total">${cartTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="font-mono text-[12px] text-text-muted">
          // SHIPPING_TO: {shipping.fullName} — {shipping.street}, {shipping.city} {shipping.zip}, {shipping.country}<br />
          // METHOD: {method.toUpperCase()}
        </div>

        {error && (
          <div className="font-mono text-[13px] text-error bg-error-container/20 border border-error/30 px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex justify-between mt-2">
          <NeonButton variant="secondary" onClick={() => setStep(5)} disabled={submitting}>
            [ ← BACK ]
          </NeonButton>
          <NeonButton onClick={submitPayment} disabled={submitting}>
            <span data-testid="checkout-submit">
              {submitting ? '[ PROCESSING... ]' : '[ PLACE ORDER ]'}
            </span>
          </NeonButton>
        </div>
      </div>
    );
  }

  function renderSuccessStep() {
    return (
      <div className="max-w-md mx-auto py-8 flex flex-col items-center gap-3 text-center" data-testid="checkout-success-step">
        <h2 className="font-mono text-[24px] text-tertiary-container">// ORDER_CONFIRMED</h2>
        <p className="font-mono text-[13px] text-text-muted">
          Your order has been queued for fulfilment.
        </p>
        <div className="border border-outline-variant p-4 font-mono text-[13px] w-full">
          <div className="flex justify-between"><span className="text-text-muted">TXN_ID</span><span>{confirmation?.transactionId}</span></div>
          <div className="flex justify-between"><span className="text-text-muted">CHARGED</span><span className="text-primary-container">${Number(confirmation?.total ?? 0).toFixed(2)}</span></div>
        </div>
        <div className="flex gap-2 mt-4">
          <NeonButton onClick={() => navigate('/account/orders')}>[ VIEW ORDERS ]</NeonButton>
          <NeonButton variant="secondary" onClick={() => navigate('/')}>[ KEEP SHOPPING ]</NeonButton>
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-background" data-testid="checkout-flow">
      {/* ── Minimal branded checkout header (replaces global TopNavBar) ──
          Per spec: nav links suppressed during transactional flow; only
          brand wordmark + "CHECKOUT" label + escape-hatch back to cart. */}
      <header
        className="h-[56px] w-full bg-background border-b border-outline-variant
                   flex justify-between items-center px-margin sticky top-0 z-50 flex-shrink-0"
        aria-label="Checkout header"
      >
        <Link
          to="/"
          className="font-inter text-[18px] font-bold text-white tracking-tight focus:outline-none"
          aria-label="pc-parts.store — home"
        >
          pc-parts<span className="text-primary-container">.</span>
        </Link>
        <span className="font-mono text-label-md text-on-surface-variant uppercase tracking-widest">
          // CHECKOUT
        </span>
        <Link
          to="/cart"
          className="font-mono text-[12px] text-text-muted hover:text-on-surface transition-none uppercase"
        >
          [ ← Back to Cart ]
        </Link>
      </header>

      <main className="flex-1 p-8">
        <Stepper step={step} />

        {step === 1 && renderCartStep()}
        {step === 2 && renderAuthStep()}
        {step === 3 && renderShippingStep()}
        {step === 4 && renderMethodStep()}
        {step === 5 && renderPaymentStep()}
        {step === 6 && renderReviewStep()}
        {step === 7 && renderSuccessStep()}
      </main>
    </div>
  );
}
