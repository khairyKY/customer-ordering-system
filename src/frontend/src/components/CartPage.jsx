// ============================================================
// CartPage — Dev-Cosmic Cart Table + Order Summary + Checkout
// pc-parts.store  |  CSE323 Customer Ordering System
//
// Layout (from stitch_cart_checkout Stitch export):
//   YOUR CART heading
//   └── [Cart Table] ── [Order Summary sidebar]
//         │                 │
//     Terminal qty inputs   Dotted-line totals breakdown
//     [ × ] remove btns     [ PROCEED TO CHECKOUT ] CTA
//
//
// Business logic preserved (from CartWidget.jsx):
//   - fetchCart()      → runs on mount to hydrate cart
//   - updateCartItem() → fires on qty input blur
//   - removeCartItem() → fires on [ × ] click
// ============================================================

import { useState, useEffect } from 'react';
import { fetchCart, updateCartItem, removeCartItem } from '../api/cartApi';
import NeonButton    from './ui/NeonButton';
import TerminalInput from './ui/TerminalInput';

const TAX_RATE = 0.10; // 10% — matches Phase 3 Mathematical Boundary canonical value

/**
 * @param {object}   props
 * @param {object}   props.cart           - Cart state from App
 * @param {function} props.onCartUpdate   - Lifted setter
 * @param {function} props.onNavigate     - App-level view router
 */
export default function CartPage({ cart, onCartUpdate, onNavigate }) {
  const [loading,   setLoading]   = useState(!cart?.items?.length);
  const [promoCode, setPromoCode] = useState('');
  const [removing,  setRemoving]  = useState(null); // product_id being removed

  // ── Hydrate cart on mount ──────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchCart();
        if (data) onCartUpdate(data);
      } catch (err) {
        console.error('[CartPage] cart fetch error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Update quantity ────────────────────────────────────────
  const handleQtyChange = async (productId, newQty) => {
    const qty = parseInt(newQty, 10);
    if (isNaN(qty) || qty < 1) return;
    try {
      const updated = await updateCartItem(productId, qty);
      onCartUpdate(updated);
    } catch (err) {
      console.error('[CartPage] updateCartItem error:', err);
      alert('Stock limit reached or sync error.');
    }
  };

  // ── Remove item ────────────────────────────────────────────
  const handleRemove = async (productId) => {
    setRemoving(productId);
    try {
      const updated = await removeCartItem(productId);
      onCartUpdate(updated);
    } catch (err) {
      console.error('[CartPage] removeCartItem error:', err);
    } finally {
      setRemoving(null);
    }
  };

  // ── Computed totals ────────────────────────────────────────
  const subtotal = cart?.subtotal ?? 0;
  const tax      = cart?.tax      ?? subtotal * TAX_RATE;
  const total    = cart?.total    ?? subtotal + tax;
  const items    = cart?.items    ?? [];

  const fmt = (n) => `$${Number(n).toFixed(2)}`;

  // ── Loading state ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="pt-[56px] pb-[24px] px-margin font-mono text-label-md text-outline animate-pulse py-16">
        RETR_CART_DATA...
      </div>
    );
  }

  return (
    <main
      id="cart-page"
      className="px-margin max-w-[1000px] mx-auto w-full pt-unit-8 pb-unit-12"
    >
      {/* ── Heading ──────────────────────────────────────────── */}
      <div className="mb-unit-8">
        <h1
          className="font-inter text-headline-lg text-on-surface uppercase
                     border-b border-outline-variant pb-unit-2 w-max inline-block"
        >
          YOUR CART
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-gutter items-start">
        {/* ── Cart Table ─────────────────────────────────────── */}
        <div className="flex-grow w-full">
          <div className="border border-outline-variant overflow-x-auto bg-background/50">
            <table
              className="w-full text-left border-collapse whitespace-nowrap
                         font-mono text-code-snippet"
              aria-label="Cart items"
            >
              <thead className="bg-surface-container text-outline border-b border-outline-variant
                                font-inter uppercase text-[12px] tracking-wider">
                <tr>
                  <th className="p-unit-4 font-normal w-12">#</th>
                  <th className="p-unit-4 font-normal min-w-[200px]">ITEM</th>
                  <th className="p-unit-4 font-normal">SKU</th>
                  <th className="p-unit-4 font-normal text-right">QTY</th>
                  <th className="p-unit-4 font-normal text-right">UNIT PRICE</th>
                  <th className="p-unit-4 font-normal text-right">TOTAL</th>
                  <th className="p-unit-4 font-normal w-16 text-center">—</th>
                </tr>
              </thead>

              <tbody className="text-on-surface">
                {items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-unit-8 text-center text-outline font-mono text-code-snippet"
                    >
                      EMPTY_BUFFER — no items in cart.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr
                      key={item.id ?? item.product_id}
                      className="border-b border-outline-variant
                                 hover:bg-surface-container transition-none
                                 odd:bg-background even:bg-surface-container-low"
                    >
                      {/* Row number */}
                      <td className="p-unit-4 text-outline">
                        {String(idx + 1).padStart(2, '0')}
                      </td>

                      {/* Item name */}
                      <td className="p-unit-4 font-medium text-primary">
                        {item.product_name ?? item.name}
                      </td>

                      {/* SKU */}
                      <td className="p-unit-4 text-outline text-[11px] tracking-wider">
                        {item.sku ?? `SKU-${item.product_id ?? item.id}`}
                      </td>

                      {/* Quantity input */}
                      <td className="p-unit-4 text-right">
                        <div className="inline-flex w-20">
                          <TerminalInput
                            type="number"
                            prefix=""
                            min={1}
                            value={item.quantity}
                            textAlign="right"
                            ariaLabel={`Quantity for ${item.product_name ?? item.name}`}
                            onChange={e =>
                              handleQtyChange(item.product_id ?? item.id, e.target.value)
                            }
                            inputClassName="p-1"
                          />
                        </div>
                      </td>

                      {/* Unit price */}
                      <td className="p-unit-4 text-right">
                        {fmt(item.unit_price ?? item.price)}
                      </td>

                      {/* Line total */}
                      <td className="p-unit-4 text-right text-primary-container font-bold">
                        {fmt(item.total_price ?? (item.quantity * (item.unit_price ?? item.price)))}
                      </td>

                      {/* Remove */}
                      <td className="p-unit-4 text-center">
                        <NeonButton
                          variant="destructive"
                          onClick={() => handleRemove(item.product_id ?? item.id)}
                          aria-label={`Remove ${item.product_name ?? item.name}`}
                          disabled={removing === (item.product_id ?? item.id)}
                        >
                          [ × ]
                        </NeonButton>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Promo code row */}
          <div className="mt-unit-6 flex flex-wrap justify-between items-center gap-4">
            <div className="w-full sm:w-72">
              <TerminalInput
                id="promo-code-input"
                prefix="_>"
                placeholder="ENTER_PROMO_CODE"
                type="text"
                value={promoCode}
                onChange={e => setPromoCode(e.target.value)}
                ariaLabel="Enter promo code"
              />
            </div>
            <NeonButton
              variant="secondary"
              onClick={() => alert(`Promo code "${promoCode}" submitted.`)}
            >
              [ APPLY CODE ]
            </NeonButton>
          </div>
        </div>

        {/* ── Order Summary Sidebar ─────────────────────────── */}
        <aside
          className="w-full lg:w-[320px] flex-shrink-0"
          aria-label="Order summary"
        >
          <div className="border border-outline-variant bg-surface-container-low p-unit-6">
            <h2 className="font-inter text-headline-sm text-on-surface mb-unit-6 uppercase tracking-tight">
              Order Summary
            </h2>

            {/* Line items */}
            <div className="flex flex-col gap-unit-4 font-mono text-code-snippet mb-unit-6">
              {[
                { label: 'Subtotal',  value: fmt(subtotal), color: 'text-on-surface' },
                { label: 'Shipping',  value: '$0.00',        color: 'text-on-surface' },
                { label: 'Tax (Est)', value: fmt(tax),       color: 'text-on-surface' },
              ].map(row => (
                <div key={row.label} className="flex items-center">
                  <span className="text-outline">{row.label}</span>
                  <div className="flex-grow border-b border-dotted border-outline-variant mx-unit-2" />
                  <span className={row.color}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="border-t border-outline-variant pt-unit-4 mb-unit-6">
              <div className="flex flex-col gap-1">
                <span className="font-inter text-[12px] text-outline uppercase tracking-wider">
                  TOTAL
                </span>
                <span
                  id="cart-total"
                  className="font-mono text-headline-lg text-primary-container leading-none"
                >
                  {fmt(total)}
                </span>
              </div>
            </div>

            {/* Primary CTA */}
            <NeonButton
              id="checkout-btn"
              variant="primary"
              fullWidth
              disabled={items.length === 0}
              onClick={() => alert('Routing to Payment slice (Member B)…')}
            >
              [ PROCEED TO CHECKOUT ]
            </NeonButton>

            {/* Trust badge */}
            <div className="mt-unit-4 text-center text-outline font-inter text-[11px]
                            flex justify-center items-center gap-2 uppercase tracking-wide">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              Secure checkout — 30-day returns
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
