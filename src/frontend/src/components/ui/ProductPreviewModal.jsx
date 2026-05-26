// ============================================================
// ProductPreviewModal — quick-look popup for a product
// ============================================================
//
// Renders a fixed overlay (same pattern as Addresses.jsx) with the
// product's image, key specs, price and stock. Intentionally does
// NOT include the related-products section that the full detail
// page shows — this is meant to stay lightweight.
//
// Closes on: ESC key, backdrop click, or [ CLOSE ] button.
// ============================================================

import { useEffect } from 'react';
import { Link } from 'react-router-dom';

import NeonButton from './NeonButton';

export default function ProductPreviewModal({
  product,
  onClose,
  onAddToCart,
  fullDetailsHref,
}) {
  // ESC key closes the modal
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!product) return null;

  const inStock = (product.stock ?? 0) > 0;
  const specs   = product.specs && typeof product.specs === 'object' ? product.specs : {};
  // Show at most 6 spec entries to keep the modal lightweight.
  const specEntries = Object.entries(specs).slice(0, 6);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Preview: ${product.name}`}
    >
      <div
        className="bg-surface-dark border border-outline-variant shadow-2xl w-full max-w-[720px] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-outline-variant px-5 py-3">
          <div className="font-mono text-[12px] text-primary-container uppercase tracking-widest">
            // QUICK_PREVIEW
          </div>
          <button
            onClick={onClose}
            className="font-mono text-[12px] text-text-muted hover:text-white uppercase px-2 py-1 cursor-pointer whitespace-nowrap"
            aria-label="Close preview"
          >
            [ ✕ CLOSE ]
          </button>
        </div>

        {/* Body: image + info side by side on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-5 p-5">
          {/* Image */}
          <div className="sm:col-span-2 aspect-square border border-outline-variant bg-[#0D0D0D] flex items-center justify-center overflow-hidden">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-contain p-3"
              />
            ) : (
              <span className="font-mono text-[12px] text-text-muted">// NO_IMAGE</span>
            )}
          </div>

          {/* Info */}
          <div className="sm:col-span-3 flex flex-col gap-3">
            <div className="font-mono text-[11px] text-primary-container uppercase tracking-widest">
              // {(product.category || 'HARDWARE').toUpperCase()}
            </div>
            <h3 className="font-inter text-[22px] font-bold text-white leading-tight">
              {product.name}
            </h3>

            <div className="flex items-end justify-between border-y border-outline-variant py-3 my-1">
              <div className="font-mono text-[32px] font-bold text-primary-container leading-none">
                ${Number(product.price).toFixed(2)}
              </div>
              <div className={`font-mono text-[11px] uppercase px-2 py-1 border ${inStock ? 'border-[#22C55E] text-[#22C55E]' : 'border-error text-error'}`}>
                {inStock ? `[ IN_STOCK: ${product.stock} ]` : '[ DEPLETED ]'}
              </div>
            </div>

            {/* Compact specs table */}
            {specEntries.length > 0 && (
              <div className="bg-background/50 border border-outline-variant p-3">
                <div className="font-mono text-[10px] text-text-muted uppercase mb-2 pb-1 border-b border-outline-variant">
                  &gt;_ SPECS
                </div>
                <table className="w-full font-mono text-[12px]">
                  <tbody>
                    {specEntries.map(([key, val]) => (
                      <tr key={key}>
                        <td className="py-0.5 text-text-muted w-1/3 uppercase">{key.replace(/_/g, ' ')}</td>
                        <td className="py-0.5 text-white text-right truncate">{String(val)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <NeonButton
                variant="primary"
                disabled={!inStock}
                onClick={onAddToCart}
                className="flex-1"
              >
                {inStock ? '[ ADD TO CART ]' : '[ OUT_OF_STOCK ]'}
              </NeonButton>
              {fullDetailsHref && (
                <Link
                  to={fullDetailsHref}
                  onClick={onClose}
                  className="flex-1 inline-flex items-center justify-center border border-outline-variant text-text-muted hover:text-white hover:border-primary-container font-mono text-[13px] uppercase px-4 py-2 cursor-pointer whitespace-nowrap"
                  style={{transition: 'none'}}
                >
                  [ FULL DETAILS → ]
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
