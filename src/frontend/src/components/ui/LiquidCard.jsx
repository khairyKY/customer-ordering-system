// ============================================================
// LiquidCard — Dev-Cosmic Product / Category Card
// ============================================================

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
  className = '',
}) {
  const stockCfg = STOCK_CONFIG[stock] || STOCK_CONFIG.in_stock;

  return (
    <article className={`liquid-card group ${className}`}>
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
        {/* Stock dot badge */}
        <div
          className="absolute top-2 right-2 bg-[#0D0D0D] p-1 border border-[#242424]"
          title={stockCfg.label}
        >
          <span className={`stock-dot ${stockCfg.dotClass}`} />
        </div>
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

        <div className="flex justify-between items-end mt-4">
          <span className="font-mono text-[24px] font-bold text-[#e5e2e1]">
            {price}
          </span>
          <button
            onClick={onAdd}
            className="border border-[#00bfff] bg-transparent text-[#00bfff] hover:bg-[#00bfff] hover:text-[#0D0D0D] font-mono text-[13px] uppercase px-2 py-1 cursor-pointer"
            style={{transition: 'none'}}
            aria-label={`Add ${title} to cart`}
          >
            [ ADD ]
          </button>
        </div>

        <div className={`flex items-center gap-1 font-mono text-[12px] mt-1 ${stockCfg.textColor}`}>
          <span className={`stock-dot ${stockCfg.dotClass}`} />
          {stockCfg.label}
        </div>
      </div>
    </article>
  );
}
