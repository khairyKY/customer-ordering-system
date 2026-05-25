// ============================================================
// TopNavBar — Dev-Cosmic Global Navigation (react-router edition)
// Extracted from stitch_terminal_hardware_store Stitch export
// ============================================================
//
// Migration note (2026-05-18):
// Previously took an `onNavigate(view)` callback. Now consumes
// react-router-dom <NavLink>/<Link> so the URL is the source of
// truth instead of App.jsx state.
//
// Mobile note (C2 pass):
// Below the `md` breakpoint the center nav is hidden; a hamburger
// toggle drops down a full-width slide-down drawer listing the
// same routes. Drawer auto-closes on navigation.

import { useEffect, useRef, useState } from 'react';
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

  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = () => setMobileOpen(false);
  const headerRef   = useRef(null);

  // Close on Escape + on click outside the header.
  useEffect(() => {
    if (!mobileOpen) return undefined;

    function onKey(e) {
      if (e.key === 'Escape') setMobileOpen(false);
    }
    function onPointerDown(e) {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setMobileOpen(false);
      }
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [mobileOpen]);

  // Auto-close on route change (covers programmatic nav, e.g. Sign-In)
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // We're "on" cart whenever the URL begins with /cart or /checkout
  const onCart = location.pathname.startsWith('/cart') || location.pathname.startsWith('/checkout');

  const linkBase   = 'font-inter text-[14px] flex items-center h-[56px] transition-none';
  const linkActive = `${linkBase} text-white border-b-2 border-primary-container`;
  const linkMuted  = `${linkBase} text-text-muted hover:text-white`;

  // Active = matched OR (for /products) when on a product detail too
  const navClassFor = (matchExact = true) => ({ isActive }) =>
    isActive ? linkActive : linkMuted;

  // Mobile drawer link styling — full-width rows, larger tap target
  const drawerLinkBase   = 'font-inter text-[14px] px-margin py-4 border-b border-outline-variant transition-none';
  const drawerLinkActive = `${drawerLinkBase} text-white bg-surface-container-highest border-l-2 border-primary-container`;
  const drawerLinkMuted  = `${drawerLinkBase} text-text-muted hover:text-white hover:bg-surface-container`;
  const drawerClassFor   = () => ({ isActive }) => isActive ? drawerLinkActive : drawerLinkMuted;

  const DESKTOP_LINKS = [
    { to: '/',         label: 'Home',  end: true },
    { to: '/products', label: 'Shop' },
    { to: '/deals',    label: 'Deals' },
    { to: '/builds',   label: 'Builds' },
    { to: '/about',    label: 'About' },
    { to: '/account',  label: 'Account' },
  ];
  if (user?.role === 'admin') {
    DESKTOP_LINKS.push({ to: '/admin', label: 'Admin Dashboard' });
  }

  function handleAuthAction() {
    closeMobile();
    if (isAuthenticated) {
      logout();
      if (onClearCart) onClearCart();
      navigate('/');
    } else {
      navigate('/admin/login');
    }
  }

  return (
    <header
      id="topnav"
      ref={headerRef}
      className="fixed top-0 left-0 w-full h-[56px] bg-background border-b border-outline-variant z-50
                 flex items-center justify-between px-margin"
    >
      {/* ── Left: Wordmark ─────────────────────────────── */}
      <Link
        to="/"
        onClick={closeMobile}
        className="font-inter text-[18px] font-bold text-white tracking-tight focus:outline-none"
        aria-label="pc-parts.store — home"
      >
        pc-parts<span className="text-primary-container">.</span>
      </Link>

      {/* ── Center: Desktop nav (hidden on mobile) ─────── */}
      <nav className="hidden md:flex items-center gap-[32px] h-full" aria-label="Primary navigation">
        {DESKTOP_LINKS.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.end} className={navClassFor()}>
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* ── Right: Cart + Auth + (mobile) Hamburger ────── */}
      <div className="flex items-center gap-[16px] md:gap-[32px]">
        {user?.role !== 'admin' && (
          <button
            id="nav-cart-btn"
            onClick={() => { closeMobile(); navigate('/cart'); }}
            className={`font-inter text-[13px] transition-none ${
              onCart ? 'text-primary-container' : 'text-text-muted hover:text-white'
            }`}
            aria-label="View cart"
          >
            Cart ({cartCount})
          </button>
        )}

        {/* Sign-in / Log-out — hidden on mobile to reduce nav crowding;
            available inside the drawer instead. */}
        {isAuthenticated ? (
          <button
            id="nav-logout-btn"
            onClick={handleAuthAction}
            className="hidden md:inline-flex font-mono text-[13px] text-primary-container border border-primary-container
                       bg-transparent px-4 py-1 uppercase hover:bg-primary-container hover:text-background
                       transition-none"
            aria-label="Log out"
          >
            [ Log Out ]
          </button>
        ) : (
          <button
            id="nav-signin-btn"
            onClick={handleAuthAction}
            className="hidden md:inline-flex font-mono text-[13px] text-primary-container border border-primary-container
                       bg-transparent px-4 py-1 uppercase hover:bg-primary-container hover:text-background
                       transition-none"
            aria-label="Sign in"
          >
            [ Sign In ]
          </button>
        )}

        {/* Hamburger — mobile only */}
        <button
          type="button"
          id="nav-mobile-toggle"
          data-testid="nav-mobile-toggle"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav-drawer"
          className="md:hidden text-on-surface hover:bg-surface-container-highest transition-none p-1
                     flex items-center justify-center"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            {mobileOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* ── Mobile Drawer ──────────────────────────────────
          Anchored to the bottom edge of the fixed header. Closes on
          any nav action or on the hamburger toggle. */}
      {mobileOpen && (
        <div
          id="mobile-nav-drawer"
          data-testid="mobile-nav-drawer"
          role="dialog"
          aria-modal="false"
          aria-label="Mobile navigation"
          className="md:hidden absolute top-[56px] left-0 right-0 bg-background
                     border-b border-outline-variant z-40 flex flex-col"
        >
          {DESKTOP_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={closeMobile}
              className={drawerClassFor()}
            >
              {link.label}
            </NavLink>
          ))}

          {/* Auth action — last row in the drawer */}
          <button
            type="button"
            onClick={handleAuthAction}
            className={`${drawerLinkBase} text-left font-mono uppercase
                        text-primary-container hover:bg-surface-container`}
          >
            {isAuthenticated ? '[ Log Out ]' : '[ Sign In ]'}
          </button>
        </div>
      )}
    </header>
  );
}
