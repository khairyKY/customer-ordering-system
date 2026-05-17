// ============================================================
// TopNavBar — Dev-Cosmic Global Navigation
// Extracted from stitch_terminal_hardware_store Stitch export
// ============================================================

/**
 * @param {object}  props
 * @param {number}  props.cartCount   - Number shown in Cart badge
 * @param {string}  props.activeView  - 'storefront' | 'cart'
 * @param {function} props.onNavigate - Called with view name string
 */
export default function TopNavBar({ cartCount = 0, activeView, onNavigate }) {
  const linkBase   = 'font-inter text-[14px] flex items-center h-[56px] transition-none';
  const linkActive = `${linkBase} text-white border-b-2 border-primary-container`;
  const linkMuted  = `${linkBase} text-text-muted hover:text-white`;

  return (
    <header
      id="topnav"
      className="fixed top-0 left-0 w-full h-[56px] bg-background border-b border-outline-variant z-50
                 flex items-center justify-between px-margin"
    >
      {/* ── Left: Wordmark ─────────────────────────────── */}
      <button
        onClick={() => onNavigate('storefront')}
        className="font-inter text-[18px] font-bold text-white tracking-tight focus:outline-none"
        aria-label="pc-parts.store — go to storefront"
      >
        pc-parts<span className="text-primary-container">.</span>
      </button>

      {/* ── Center: Nav links (hidden on mobile) ─────── */}
      <nav className="hidden md:flex items-center gap-[32px] h-full" aria-label="Primary navigation">
        <button onClick={() => onNavigate('storefront')} className={activeView === 'storefront' ? linkActive : linkMuted}>
          Shop
        </button>
        <span className={linkMuted}>Deals</span>
        <span className={linkMuted}>Builds</span>
        <span className={linkMuted}>Support</span>
      </nav>

      {/* ── Right: Cart + Sign In ─────────────────────── */}
      <div className="flex items-center gap-[32px]">
        <button
          id="nav-cart-btn"
          onClick={() => onNavigate('cart')}
          className={`font-inter text-[13px] transition-none ${
            activeView === 'cart' ? 'text-primary-container' : 'text-text-muted hover:text-white'
          }`}
          aria-label="View cart"
        >
          Cart ({cartCount})
        </button>

        <button
          id="nav-signin-btn"
          className="font-mono text-[13px] text-primary-container border border-primary-container
                     bg-transparent px-4 py-1 uppercase hover:bg-primary-container hover:text-background
                     transition-none"
          aria-label="Sign in"
        >
          [ Sign In ]
        </button>
      </div>
    </header>
  );
}
