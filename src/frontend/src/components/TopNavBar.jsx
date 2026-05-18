// ============================================================
// TopNavBar — Dev-Cosmic Global Navigation (react-router edition)
// Extracted from stitch_terminal_hardware_store Stitch export
// ============================================================
//
// Migration note (2026-05-18):
// Previously took an `onNavigate(view)` callback. Now consumes
// react-router-dom <NavLink>/<Link> so the URL is the source of
// truth instead of App.jsx state.

import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../features/auth/store/authStore';

/**
 * @param {object} props
 * @param {number} props.cartCount  - Number shown in the Cart badge
 */
export default function TopNavBar({ cartCount = 0, onClearCart }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuthStore();

  // We're "on" cart whenever the URL begins with /cart or /checkout
  const onCart = location.pathname.startsWith('/cart') || location.pathname.startsWith('/checkout');

  const linkBase   = 'font-inter text-[14px] flex items-center h-[56px] transition-none';
  const linkActive = `${linkBase} text-white border-b-2 border-primary-container`;
  const linkMuted  = `${linkBase} text-text-muted hover:text-white`;

  // Active = matched OR (for /products) when on a product detail too
  const navClassFor = (matchExact = true) => ({ isActive }) =>
    isActive ? linkActive : linkMuted;

  return (
    <header
      id="topnav"
      className="fixed top-0 left-0 w-full h-[56px] bg-background border-b border-outline-variant z-50
                 flex items-center justify-between px-margin"
    >
      {/* ── Left: Wordmark ─────────────────────────────── */}
      <Link
        to="/"
        className="font-inter text-[18px] font-bold text-white tracking-tight focus:outline-none"
        aria-label="pc-parts.store — home"
      >
        pc-parts<span className="text-primary-container">.</span>
      </Link>

      {/* ── Center: Nav links (hidden on mobile) ─────── */}
      <nav className="hidden md:flex items-center gap-[32px] h-full" aria-label="Primary navigation">
        <NavLink to="/"          end className={navClassFor()}>Home</NavLink>
        <NavLink to="/products"     className={navClassFor()}>Shop</NavLink>
        <NavLink to="/deals"        className={navClassFor()}>Deals</NavLink>
        <NavLink to="/builds"       className={navClassFor()}>Builds</NavLink>
        <NavLink to="/account"      className={navClassFor()}>Account</NavLink>
        {user?.role === 'admin' && (
          <NavLink to="/admin" className={navClassFor()}>Admin Dashboard</NavLink>
        )}
      </nav>

      {/* ── Right: Cart + Sign In ─────────────────────── */}
      <div className="flex items-center gap-[32px]">
        {user?.role !== 'admin' && (
          <button
            id="nav-cart-btn"
            onClick={() => navigate('/cart')}
            className={`font-inter text-[13px] transition-none ${
              onCart ? 'text-primary-container' : 'text-text-muted hover:text-white'
            }`}
            aria-label="View cart"
          >
            Cart ({cartCount})
          </button>
        )}

        {isAuthenticated ? (
          <button
            id="nav-logout-btn"
            onClick={() => { 
              logout(); 
              if (onClearCart) onClearCart();
              navigate('/'); 
            }}
            className="font-mono text-[13px] text-primary-container border border-primary-container
                       bg-transparent px-4 py-1 uppercase hover:bg-primary-container hover:text-background
                       transition-none"
            aria-label="Log out"
          >
            [ Log Out ]
          </button>
        ) : (
          <button
            id="nav-signin-btn"
            onClick={() => navigate('/admin/login')}
            className="font-mono text-[13px] text-primary-container border border-primary-container
                       bg-transparent px-4 py-1 uppercase hover:bg-primary-container hover:text-background
                       transition-none"
            aria-label="Sign in"
          >
            [ Sign In ]
          </button>
        )}
      </div>
    </header>
  );
}
