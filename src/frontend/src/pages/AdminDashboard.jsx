// ============================================================
// AdminDashboard — Dev-Cosmic Admin Overview (Zone 4)
// pc-parts.store  |  CSE323 Customer Ordering System
//
// Full-screen admin shell: replaces the global TopNavBar +
// StatusBar with an admin-themed top bar (amber-dot brand),
// a vertical SideNavBar (amber accent), and an admin footer.
//
// Layout:
//   ┌───────────────────────────── admin top nav ─────────────┐
//   │  ● // admin panel       COMPONENTS / SYSTEMS / …    🛒 ▮│
//   ├───────────┬─────────────────────────────────────────────┤
//   │           │  OVERVIEW DASHBOARD                         │
//   │  SideNav  │  [4× stat cards]                            │
//   │  (amber)  │  ┌─ RECENT ORDERS ──┬─ LOW STOCK ALERTS ──┐ │
//   │           │  │ table             │ list + [GENERATE PO]│ │
//   ├───────────┴───────────────────────────────────────────────┤
//   │  v2.4.0-stable // SYSTEM_STATUS: ONLINE   GITHUB / SPEC… │
//   └─────────────────────────────────────────────────────────┘
//
// Spec source: stitch_terminal_hardware_store/frontend_update.txt
//   Admin Overview Dashboard  (lines 1379–1719)
//
// Data note: All stats / orders / low-stock rows are HARDCODED
// MOCKS that match the spec values. Real Laravel/FastAPI wiring
// is a separate task (deferred per execution plan).
// ============================================================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import SideNavBar      from '../components/SideNavBar';
import AdminTopNavBar  from '../components/AdminTopNavBar';
import { useAuthStore } from '../features/auth/store/authStore';

// ── Sidebar nav items ──────────────────────────────────────────
// Mapped from the spec's labels to the actual /admin/* routes
// that already exist in App.jsx. SETTINGS routes to the user's
// security settings page as a sensible default until a dedicated
// admin settings route exists.
const ADMIN_NAV_ITEMS = [
  { to: '/admin',           icon: 'dashboard',    label: 'DASHBOARD', end: true },
  { to: '/admin/orders',    icon: 'inventory_2',  label: 'ORDERS' },
  { to: '/admin/inventory', icon: 'monitoring',   label: 'INVENTORY' },
  { to: '/admin/catalog',   icon: 'inventory',    label: 'CATALOG' },
  { to: '/account/security',icon: 'settings',     label: 'SETTINGS' },
];

// ── Hardcoded mock data (spec-matching) ────────────────────────
const STAT_CARDS = [
  {
    label: '// REVENUE_MTH',
    value: '$42,084',
    delta: '+12.4% vs prev',
    deltaTone: 'text-tertiary-container',
    icon: 'payments',
    iconTone: 'text-accent-amber',
    valueTone: 'text-primary',
  },
  {
    label: '// ORDERS_ACTIVE',
    value: '1,204',
    delta: '+5.2% vs prev',
    deltaTone: 'text-tertiary-container',
    icon: 'inventory',
    iconTone: 'text-accent-amber',
    valueTone: 'text-primary',
  },
  {
    label: '// CARTS_ABANDONED',
    value: '84',
    delta: '-2.1% vs prev',
    deltaTone: 'text-error',
    icon: 'shopping_cart',
    iconTone: 'text-accent-amber',
    valueTone: 'text-primary',
  },
  {
    label: '// SYS_ALERTS',
    value: '3',
    delta: 'Requires attention',
    deltaTone: 'text-on-surface-variant',
    icon: 'warning',
    iconTone: 'text-error',
    valueTone: 'text-error',
  },
];

const RECENT_ORDERS = [
  { id: '#ORD-9921', customer: 'j.doe@example.com',  amount: '$1,299.00', status: 'PENDING',   tone: 'amber' },
  { id: '#ORD-9920', customer: 's.smith@corp.net',   amount: '$3,450.50', status: 'SHIPPED',   tone: 'green' },
  { id: '#ORD-9919', customer: 'a.turing@sys.org',   amount: '$89.99',    status: 'DELIVERED', tone: 'green' },
];

const STATUS_PILL_CLS = {
  amber: 'text-accent-amber bg-accent-amber/10 border border-accent-amber/30',
  green: 'text-tertiary-container bg-tertiary-container/10 border border-tertiary-container/30',
};

const LOW_STOCK = [
  { name: 'RTX 4090 Founders', category: '// GPU', qty: '02', tone: 'text-error' },
  { name: 'Ryzen 9 7950X3D',   category: '// CPU', qty: '05', tone: 'text-accent-amber' },
  { name: '64GB DDR5-6000',    category: '// RAM', qty: '12', tone: 'text-accent-amber' },
];

// ── Component ──────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // [ GENERATE PO ] feedback — toggles after click, auto-clears 3s.
  // Replaces a previously-inert button. Real PO endpoint deferred to
  // the backend wiring pass.
  const [poFeedback, setPoFeedback] = useState(null);
  function handleGeneratePO() {
    setPoFeedback({
      tone: 'success',
      msg:  `// PO_DISPATCHED — ${LOW_STOCK.length} SKUs queued for reorder (mock).`,
    });
    setTimeout(() => setPoFeedback(null), 3000);
  }

  return (
    <div
      className="h-screen flex flex-col bg-background text-on-surface"
      data-testid="admin-dashboard"
    >
      <AdminTopNavBar />

      {/* ─── Body row: SideNav + Main canvas ───────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        <SideNavBar
          items={ADMIN_NAV_ITEMS}
          accent="amber"
          width="w-64"
          sessionLabel="USER_SESSION"
          sessionSub={user?.email ?? 'dev_admin_01'}
          testId="admin-side-nav"
        />

        <main className="flex-1 overflow-y-auto p-gutter bg-surface-dim">
          <div className="max-w-7xl mx-auto space-y-unit-8">
            {/* Page header */}
            <div>
              <h1 className="font-mono text-headline-lg text-on-surface mb-2">
                OVERVIEW DASHBOARD
              </h1>
              <p className="font-mono text-code-snippet text-on-surface-variant">
                // SYS_STATUS: OPTIMAL | LAST_SYNC: 0s AGO
              </p>
            </div>

            {/* Stat cards */}
            <section
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-unit-4"
              aria-label="Key metrics"
            >
              {STAT_CARDS.map((card) => (
                <div
                  key={card.label}
                  className="relative group bg-surface-container border border-outline-variant p-unit-4 h-full"
                >
                  <div className="absolute top-0 right-0 p-2">
                    <span
                      className={`material-symbols-outlined ${card.iconTone} opacity-50 group-hover:opacity-100 transition-none`}
                      aria-hidden="true"
                    >
                      {card.icon}
                    </span>
                  </div>
                  <div className="font-mono text-label-md text-on-surface-variant uppercase mb-4">
                    {card.label}
                  </div>
                  <div className={`font-mono text-headline-lg mb-1 ${card.valueTone}`}>
                    {card.value}
                  </div>
                  <div className={`font-mono text-code-snippet ${card.deltaTone}`}>
                    {card.delta}
                  </div>
                </div>
              ))}
            </section>

            {/* Main content: Recent Orders (2/3) + Low Stock (1/3) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-unit-6">
              {/* Recent Orders */}
              <section className="lg:col-span-2 space-y-unit-4" aria-label="Recent orders">
                <div className="flex justify-between items-end border-b border-outline-variant pb-2">
                  <h2 className="font-mono text-headline-md text-on-surface">RECENT ORDERS</h2>
                  <Link
                    to="/admin/orders"
                    className="font-mono text-code-snippet text-primary hover:text-accent-amber transition-none"
                  >
                    [ VIEW ALL ]
                  </Link>
                </div>

                <div className="bg-surface-container border border-outline-variant overflow-x-auto">
                  <table className="w-full text-left border-collapse" aria-label="Recent orders table">
                    <thead>
                      <tr className="border-b border-outline-variant bg-surface-container-high">
                        <th className="p-3 font-mono text-label-md text-on-surface-variant uppercase">ID</th>
                        <th className="p-3 font-mono text-label-md text-on-surface-variant uppercase">CUSTOMER</th>
                        <th className="p-3 font-mono text-label-md text-on-surface-variant uppercase">AMOUNT</th>
                        <th className="p-3 font-mono text-label-md text-on-surface-variant uppercase">STATUS</th>
                        <th className="p-3 font-mono text-label-md text-on-surface-variant uppercase text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono text-code-snippet">
                      {RECENT_ORDERS.map((row) => (
                        <tr
                          key={row.id}
                          className="border-b border-outline-variant hover:bg-surface-container-highest transition-none"
                        >
                          <td className="p-3 text-primary">{row.id}</td>
                          <td className="p-3 text-on-surface">{row.customer}</td>
                          <td className="p-3 text-on-surface">{row.amount}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 ${STATUS_PILL_CLS[row.tone]}`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/orders/${row.id.replace('#', '')}`)}
                              aria-label={`Open ${row.id} in order detail`}
                              className="border border-outline-variant text-on-surface-variant
                                         hover:bg-surface-bright hover:text-on-surface
                                         hover:border-accent-amber
                                         px-2 py-1 uppercase text-[10px] tracking-wider transition-none
                                         cursor-pointer"
                              data-testid={`admin-update-status-${row.id}`}
                            >
                              [ UPDATE STATUS ]
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Low Stock Alerts */}
              <section className="space-y-unit-4" aria-label="Low stock alerts">
                <div className="flex justify-between items-end border-b border-outline-variant pb-2">
                  <h2 className="font-mono text-headline-md text-on-surface">LOW STOCK ALERTS</h2>
                </div>

                <div className="bg-surface-container border border-outline-variant flex flex-col">
                  <div className="p-3 border-b border-outline-variant bg-surface-container-high flex justify-between">
                    <span className="font-mono text-label-md text-on-surface-variant uppercase">ITEM</span>
                    <span className="font-mono text-label-md text-on-surface-variant uppercase">QTY</span>
                  </div>

                  {LOW_STOCK.map((row, idx) => (
                    <div
                      key={row.name}
                      className={`p-3 flex justify-between items-center hover:bg-surface-container-highest transition-none ${
                        idx < LOW_STOCK.length - 1 ? 'border-b border-outline-variant' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-accent-amber font-mono" aria-hidden="true">&gt;</span>
                        <div>
                          <div className="font-mono text-body-md text-on-surface">{row.name}</div>
                          <div className="font-mono text-code-snippet text-on-surface-variant">{row.category}</div>
                        </div>
                      </div>
                      <div className={`font-mono text-headline-sm ${row.tone}`}>{row.qty}</div>
                    </div>
                  ))}

                  <div className="p-3 mt-auto border-t border-outline-variant bg-surface-container-lowest
                                  flex flex-col gap-2">
                    {poFeedback && (
                      <div
                        role="status"
                        data-testid="admin-po-feedback"
                        className="font-mono text-code-snippet text-tertiary-container
                                   bg-tertiary-container/10 border border-tertiary-container/30 px-2 py-1"
                      >
                        {poFeedback.msg}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleGeneratePO}
                      disabled={!!poFeedback}
                      className="w-full text-center text-primary border border-primary
                                 hover:bg-primary hover:text-background
                                 py-2 uppercase font-mono text-label-md tracking-wider transition-none
                                 disabled:opacity-60 disabled:cursor-not-allowed
                                 disabled:hover:bg-transparent disabled:hover:text-primary
                                 cursor-pointer"
                      data-testid="admin-generate-po"
                    >
                      {poFeedback ? '[ DISPATCHED ]' : '[ GENERATE PO ]'}
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>

      {/* ─── Admin footer (spec-matching) ─────────────────────── */}
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
              className="font-mono text-code-snippet text-tertiary hover:text-primary transition-none"
            >
              {label}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}
