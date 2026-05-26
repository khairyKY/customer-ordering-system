// ============================================================
// LiquidCard — Dev-Cosmic Product / Category Card
// ============================================================
//
// Two opt-in interactions, controlled by props the caller can mix:
//
//   href:        Make the whole card a click target → navigates to href.
//                Implemented via useNavigate + onClick on the <article>
//                (click is ignored when the user is targeting an inner
//                <button>/<a>/<input>, so all controls stay clickable).
//
//   expandData:  Pass the full product object → enables (a) the expand
//                icon button at the top-right of the image (opens the
//                quick-look modal) AND (b) the qty-input + [ + ] bulk-add
//                pair in the bottom row. The qty input is bounded by
//                expandData.stock so users can never add more than the
//                in-stock count. Modal state is managed internally.
//
// Bottom-row buttons:
//   [ qty ][ + ]  — bulk add: adds whatever the user typed (default 1,
//                    bounded by stock). Only rendered when expandData
//                    is provided (we need the stock value).
//   [ ADD ]       — quick add 1, always available.
//
// onAdd is invoked as `onAdd(quantity)`. Callers can read the qty arg
// to pass into their addToCart call.
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ProductPreviewModal from './ProductPreviewModal';

const STOCK_CONFIG = {
  in_stock:  { dotClass: 'stock-dot--in',  label: 'IN_STOCK',  textColor: 'text-[#22C55E]' },
  low_stock: { dotClass: 'stock-dot--low', label: 'LOW_STOCK', textColor: 'text-[#F59E0B]' },
  out_stock: { dotClass: 'stock-dot--out', label: 'OUT_STOCK', textColor: 'text-[#ffb4ab]' },
};

export default function LiquidCard({
  category,
  title,
  subtitle,
  price,
  imageSrc,
  imageAlt = '',
  stock = 'in_stock',
  onAdd,
  href,
  expandData,
  className = '',
}) {
  const navigate = useNavigate();
  const [previewOpen, setPreviewOpen] = useState(false);
  // Bulk-add qty for the [ qty ][ + ] pair. Bounded by stock below.
  const [qty, setQty] = useState(1);
  const stockCfg = STOCK_CONFIG[stock] || STOCK_CONFIG.in_stock;

  // Raw stock count for the qty input cap. Comes from expandData (the full
  // product object); falls back to 99 when not provided so we never set
  // max=0 by accident on cards that don't pass stock through.
  const stockCount = Number.isFinite(expandData?.stock) ? expandData.stock : 99;
  const outOfStock = stockCount <= 0;

  // Clamp qty whenever the user types something outside [1, stockCount].
  const clampQty = (raw) => {
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 1) return 1;
    if (n > stockCount) return stockCount;
    return n;
  };

  // Click anywhere on the card → navigate, unless the click landed on a
  // button / link / input (those have their own handlers).
  const handleCardClick = (e) => {
    if (!href) return;
    if (e.target.closest('button, a, input')) return;
    navigate(href);
  };

  return (
    <>
      <article
        className={`liquid-card group ${href ? 'cursor-pointer' : ''} ${className}`}
        onClick={handleCardClick}
        role={href ? 'link' : undefined}
        tabIndex={href ? 0 : undefined}
        onKeyDown={(e) => {
          if (!href) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navigate(href);
          }
        }}
      >
        {/* Image Panel */}
        <div className="h-48 border-b border-[#242424] relative bg-[#0D0D0D] overflow-hidden">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={imageAlt || title}
              className="liquid-card__img"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-mono text-[13px] text-[#87929b]">NO_IMAGE</span>
            </div>
          )}
          {/* Top-right expand button — opens the quick-preview modal.
              Stock indication moved out of here; the bottom row already
              shows IN_STOCK / LOW_STOCK / OUT_STOCK with a coloured dot. */}
          {expandData && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPreviewOpen(true);
              }}
              className="absolute top-2 right-2 bg-[#0D0D0D]/90 backdrop-blur-sm p-1.5 border border-[#242424] hover:border-[#00bfff] hover:text-[#00bfff] text-[#87929b] cursor-pointer"
              style={{transition: 'none'}}
              title="Quick preview"
              aria-label={`Open quick preview for ${title}`}
            >
              {/* Arrows-pointing-away (expand / maximize) icon */}
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
                <polyline points="9 2 14 2 14 7" />
                <line x1="14" y1="2" x2="9" y2="7" />
                <polyline points="7 14 2 14 2 9" />
                <line x1="2" y1="14" x2="7" y2="9" />
              </svg>
            </button>
          )}
        </div>

        {/* Content Panel */}
        <div className="p-4 flex flex-col gap-2 flex-1">
          <span className="font-mono text-[13px] text-[#87929b] tracking-tighter">
            {category}
          </span>

          <h3 className="font-sans text-[18px] font-semibold text-[#e5e2e1] leading-[1.4] line-clamp-2 group-hover:text-[#8fd6ff]" style={{transition: 'none'}}>
            {title}
          </h3>

          {subtitle && (
            <p className="font-mono text-[13px] text-[#87929b] mt-auto">
              {subtitle}
            </p>
          )}

          <div className="flex justify-between items-end mt-4 gap-2 flex-wrap">
            <span className="font-mono text-[24px] font-bold text-[#e5e2e1]">
              {price}
            </span>
            <div className="flex items-center gap-1.5">
              {/* Bulk-add pair: qty input + [ + ]. Only rendered when we
                  know the stock (via expandData), so we can cap the input. */}
              {expandData && (
                <>
                  <input
                    type="number"
                    min={1}
                    max={stockCount || 1}
                    step={1}
                    value={qty}
                    disabled={outOfStock}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setQty(clampQty(e.target.value))}
                    onBlur={(e) => setQty(clampQty(e.target.value))}
                    className="w-14 h-[30px] bg-[#0D0D0D] border border-[#242424] text-[#e5e2e1] font-mono text-[13px] text-center pl-1.5 pr-0 focus:outline-none focus:border-[#00bfff] disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label={`Quantity to add (max ${stockCount})`}
                    title={`Quantity (max ${stockCount})`}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (outOfStock) return;
                      onAdd?.(qty);
                    }}
                    disabled={outOfStock}
                    className="border border-[#00bfff] bg-transparent text-[#00bfff] hover:bg-[#00bfff] hover:text-[#0D0D0D] font-mono text-[13px] uppercase px-2 h-[30px] cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{transition: 'none'}}
                    aria-label={`Add ${qty} of ${title} to cart`}
                    title={`Add ${qty} to cart`}
                  >
                    [ + ]
                  </button>
                </>
              )}
              {/* Always-available quick add 1 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (outOfStock) return;
                  onAdd?.(1);
                }}
                disabled={outOfStock}
                className="border border-[#00bfff] bg-transparent text-[#00bfff] hover:bg-[#00bfff] hover:text-[#0D0D0D] font-mono text-[13px] uppercase px-2 h-[30px] cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                style={{transition: 'none'}}
                aria-label={`Add one ${title} to cart`}
                title="Add 1 to cart"
              >
                [ ADD ]
              </button>
            </div>
          </div>

          <div className={`flex items-center gap-1 font-mono text-[12px] mt-1 ${stockCfg.textColor}`}>
            <span className={`stock-dot ${stockCfg.dotClass}`} />
            {stockCfg.label}
          </div>
        </div>
      </article>

      {expandData && previewOpen && (
        <ProductPreviewModal
          product={expandData}
          onClose={() => setPreviewOpen(false)}
          onAddToCart={async () => {
            await onAdd?.();
            setPreviewOpen(false);
          }}
          fullDetailsHref={href}
        />
      )}
    </>
  );
}
