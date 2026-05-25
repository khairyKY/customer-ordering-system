// ============================================================
// AccountDashboard — Dev-Cosmic User Account (Zone 3)
// pc-parts.store  |  CSE323 Customer Ordering System
//
// Full-screen account shell (mirrors Admin pattern but cyan-themed):
//   ┌──────── mobile-only top bar ────────┐
//   │  // pc-parts.store     🛒    ☰ menu │
//   ├───────────┬─────────────────────────┤
//   │           │  DASHBOARD              │
//   │  SideNav  │  // RECENT ACTIVITY     │
//   │  (cyan,   │  [3× stat cards]        │
//   │   220px,  │  // RECENT ORDERS table │
//   │   avatar) │                         │
//   ├───────────┴─────────────────────────┤
//   │  v2.4.0-stable // …  GITHUB / …     │
//   └─────────────────────────────────────┘
//
// Spec source: stitch_terminal_hardware_store/frontend_update.txt
//   User Dashboard  (lines 335–589)
//
// Data note: Stats + recent-orders rows are HARDCODED MOCKS that
// match the spec values verbatim. Backend wiring (orders count,
// pending, saved items, real order rows) is a separate task.
// ============================================================

import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

import NeonButton    from '../components/ui/NeonButton';
import SideNavBar    from '../components/SideNavBar';
import { useAuthStore } from '../features/auth/store/authStore';

// Sidebar nav — mapped to real account sub-routes that already exist
// in App.jsx. Labels read like the spec's terminal aesthetic.
const ACCOUNT_NAV_ITEMS = [
  { to: '/account',                 icon: 'dashboard',      label: 'DASHBOARD', end: true },
  { to: '/account/orders',          icon: 'inventory_2',    label: 'ORDERS' },
  { to: '/account/addresses',       icon: 'location_on',    label: 'ADDRESSES' },
  { to: '/account/payment-methods', icon: 'credit_card',    label: 'PAYMENT' },
  { to: '/account/security',        icon: 'settings',       label: 'SETTINGS' },
];

// ── Hardcoded mock data (spec-matching) ─────────────────────────
const STAT_CARDS = [
  { label: '// TOTAL ORDERS', value: '0042', tone: 'text-primary' },
  { label: '// PENDING',      value: '0003', tone: 'text-tertiary-container' },
  { label: '// SAVED ITEMS',  value: '0128', tone: 'text-on-surface' },
];

const RECENT_ORDERS = [
  { id: 'ORD-9921', date: '2023-10-27', items: 3, total: '$1,249.99', status: 'DELIVERED', statusTone: 'text-tertiary-container' },
  { id: 'ORD-9884', date: '2023-10-24', items: 1, total: '$499.00',   status: 'DELIVERED', statusTone: 'text-tertiary-container' },
  { id: 'ORD-9750', date: '2023-10-15', items: 5, total: '$2,100.50', status: 'CANCELLED', statusTone: 'text-outline' },
];

export default function AccountDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  // ── Auth gate ─────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div
        className="p-8 max-w-md mx-auto flex flex-col items-center gap-4 py-16"
        data-testid="account-dashboard"
      >
        <p className="font-mono text-[13px] text-text-muted">// AUTHENTICATION_REQUIRED</p>
        <NeonButton onClick={() => navigate('/admin/login', { state: { returnTo: '/account' } })}>
          [ SIGN IN ]
        </NeonButton>
      </div>
    );
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  // Initials for the sidebar avatar chip — first 2 letters of the
  // local-part of the user's email, uppercased.
  const initials = (user?.email?.split('@')[0] || '??').slice(0, 2).toUpperCase();

  const closeMobile = () => setMobileOpen(false);

  // Mobile drawer link classes (mirrors TopNavBar pattern)
  const drawerLinkBase   = 'font-mono text-label-md uppercase px-margin py-4 border-b border-outline-variant transition-none flex items-center gap-2';
  const drawerLinkActive = `${drawerLinkBase} text-primary-container bg-surface-container-highest border-l-2 border-primary-container`;
  const drawerLinkMuted  = `${drawerLinkBase} text-on-surface-variant hover:text-on-surface hover:bg-surface-container`;

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row bg-background text-on-surface"
      data-testid="account-dashboard"
    >
      {/* ─── Mobile-only header (md:hidden) ────────────────────── */}
      <header
        className="md:hidden h-[56px] w-full bg-background border-b border-outline-variant
                   flex justify-between items-center px-margin sticky top-0 z-50 flex-shrink-0"
        aria-label="Account mobile header"
      >
        <Link
          to="/"
          onClick={closeMobile}
          className="font-mono text-headline-sm text-on-surface tracking-tighter"
        >
          // pc-parts.store
        </Link>
        <div className="flex items-center gap-unit-4">
          <Link
            to="/cart"
            onClick={closeMobile}
            className="text-primary hover:bg-surface-container-highest transition-none p-1"
            aria-label="View cart"
          >
            <span className="material-symbols-outlined">shopping_cart</span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="account-mobile-drawer"
            className="text-primary hover:bg-surface-container-highest transition-none p-1"
            data-testid="account-mobile-toggle"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              {mobileOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </header>

      {/* ─── Mobile drawer (md:hidden) ─────────────────────────── */}
      {mobileOpen && (
        <div
          id="account-mobile-drawer"
          role="dialog"
          aria-label="Account navigation"
          className="md:hidden absolute top-[56px] left-0 right-0 bg-background
                     border-b border-outline-variant z-40 flex flex-col"
        >
          {ACCOUNT_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={closeMobile}
              className={({ isActive }) => (isActive ? drawerLinkActive : drawerLinkMuted)}
            >
              <span className="material-symbols-outlined" aria-hidden="true">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => { closeMobile(); handleLogout(); }}
            className={`${drawerLinkBase} text-left text-primary-container hover:bg-surface-container`}
          >
            <span className="material-symbols-outlined" aria-hidden="true">logout</span>
            [ SIGN OUT ]
          </button>
        </div>
      )}

      {/* ─── Desktop sidebar ───────────────────────────────────── */}
      <SideNavBar
        items={ACCOUNT_NAV_ITEMS}
        accent="cyan"
        width="w-[220px]"
        sessionLabel="USER_SESSION"
        sessionSub={user?.email ?? 'session_active'}
        avatar={initials}
        testId="account-side-nav"
      />

      {/* ─── Main + Footer column ──────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-gutter md:p-margin flex flex-col gap-unit-8 pb-unit-12">
          {/* Page header */}
          <header>
            <h1 className="font-mono text-headline-lg text-on-surface mb-unit-2">DASHBOARD</h1>
            <p className="font-mono text-code-snippet text-on-surface-variant">
              // RECENT ACTIVITY SUMMARY
            </p>
          </header>

          {/* Stat cards */}
          <section
            className="grid grid-cols-1 md:grid-cols-3 gap-unit-4"
            aria-label="Account summary"
          >
            {STAT_CARDS.map((card) => (
              <div
                key={card.label}
                className="bg-surface-dim border border-outline-variant p-unit-6
                           flex flex-col justify-between"
              >
                <div className="font-mono text-label-md text-on-surface-variant uppercase mb-unit-4">
                  {card.label}
                </div>
                <div className={`font-mono text-headline-lg ${card.tone}`}>
                  {card.value}
                </div>
              </div>
            ))}
          </section>

          {/* Recent Orders table */}
          <section className="flex flex-col gap-unit-4" aria-label="Recent orders">
            <h2 className="font-mono text-headline-md text-on-surface border-b border-outline-variant pb-unit-2">
              // RECENT ORDERS
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left" data-testid="account-orders-table">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low">
                    <th className="p-unit-4 font-mono text-label-md text-on-surface-variant uppercase">ORDER #</th>
                    <th className="p-unit-4 font-mono text-label-md text-on-surface-variant uppercase">DATE</th>
                    <th className="p-unit-4 font-mono text-label-md text-on-surface-variant uppercase">ITEMS</th>
                    <th className="p-unit-4 font-mono text-label-md text-on-surface-variant uppercase">TOTAL</th>
                    <th className="p-unit-4 font-mono text-label-md text-on-surface-variant uppercase">STATUS</th>
                    <th className="p-unit-4 font-mono text-label-md text-on-surface-variant uppercase text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {RECENT_ORDERS.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-outline-variant hover:bg-surface-container-highest transition-none"
                    >
                      <td className="p-unit-4 font-mono text-code-snippet text-on-surface">{row.id}</td>
                      <td className="p-unit-4 font-mono text-code-snippet text-on-surface-variant">{row.date}</td>
                      <td className="p-unit-4 font-mono text-code-snippet text-on-surface">{row.items}</td>
                      <td className="p-unit-4 font-mono text-code-snippet text-on-surface">{row.total}</td>
                      <td className={`p-unit-4 font-mono text-code-snippet ${row.statusTone}`}>{row.status}</td>
                      <td className="p-unit-4 text-right">
                        <Link
                          to="/account/orders"
                          className="border border-outline-variant text-on-surface-variant
                                     px-unit-4 py-unit-2 font-mono text-label-md uppercase
                                     hover:bg-surface-container-highest hover:text-on-surface
                                     transition-none bg-transparent inline-block"
                        >
                          [ VIEW ]
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>

        {/* ─── Account footer (mirrors AdminDashboard) ─────────── */}
        <footer
          className="h-8 w-full border-t border-outline-variant bg-surface-container-lowest
                     flex justify-between items-center px-gutter flex-shrink-0 z-40"
          role="contentinfo"
        >
          <span className="font-mono text-label-md text-on-surface-variant">
            v2.4.0-stable // SYSTEM_STATUS: ONLINE
          </span>
          <div className="hidden sm:flex gap-4">
            {['GITHUB', 'SPEC_SHEETS', 'WARRANTY', 'SUPPORT'].map((label) => (
              <a
                key={label}
                href="#"
                className="font-mono text-code-snippet text-on-surface-variant hover:text-primary transition-none"
              >
                {label}
              </a>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}
