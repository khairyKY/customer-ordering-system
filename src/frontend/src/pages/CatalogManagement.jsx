// ============================================================
// CatalogManagement — Dev-Cosmic Admin Catalog (Zone 4)
// pc-parts.store  |  CSE323 Customer Ordering System
//
// Full-screen admin shell mirroring AdminDashboard:
//   admin TopNavBar  →  SideNavBar (amber)  →  main canvas
//                                            →  admin footer
//
// Layout:
//   ┌─────────────────────── admin top nav ───────────────────┐
//   │  ● // admin panel  …                                    │
//   ├──────────┬──────────────────────────────────────────────┤
//   │          │  CATALOG_MANAGEMENT      [ + ADD NEW PRODUCT ]│
//   │ SideNav  │  >_ search by SKU or NAME ...                │
//   │ (amber)  │  ┌──────────────────────────────────────────┐│
//   │          │  │ IMG │ NAME │ SKU │ CAT │ PRICE │ … │ ACT ││
//   │          │  └──────────────────────────────────────────┘│
//   │          │  Showing 1-N of Z          [ PREV ]  [ NEXT ]│
//   ├──────────┴──────────────────────────────────────────────┤
//   │  v2.4.0-stable // SYSTEM_STATUS: ONLINE   GITHUB / …    │
//   └─────────────────────────────────────────────────────────┘
//
// Spec source: stitch_terminal_hardware_store/frontend_update.txt
//   Catalog Management  (lines 1–333)
//
// Data note: Product list is REAL (fetchProducts → Member A's
// catalog endpoint). The [ EDIT ] action links to /admin/inventory
// (existing stock-edit flow). [ DELETE ] is rendered per the spec
// but inert — backend DELETE wiring is a separate task (deferred
// per execution plan, same convention as B2 stat cards).
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import SideNavBar       from '../components/SideNavBar';
import AdminTopNavBar   from '../components/AdminTopNavBar';
import { fetchProducts } from '../api/productApi';
import { useAuthStore }  from '../features/auth/store/authStore';

// Sidebar nav — identical set to AdminDashboard so the active
// indicator highlights CATALOG when the user is on this route.
const ADMIN_NAV_ITEMS = [
  { to: '/admin',           icon: 'dashboard',    label: 'DASHBOARD', end: true },
  { to: '/admin/orders',    icon: 'inventory_2',  label: 'ORDERS' },
  { to: '/admin/inventory', icon: 'monitoring',   label: 'INVENTORY' },
  { to: '/admin/catalog',   icon: 'inventory',    label: 'CATALOG' },
  { to: '/account/security',icon: 'settings',     label: 'SETTINGS' },
];

const PAGE_SIZE = 10;

// ── Stock indicator derivation (matches spec dot+label pattern) ─
function getStockBadge(stockCount) {
  if (stockCount === 0) {
    return { tone: 'text-error',              dot: 'bg-error',              label: 'OUT_OF_STOCK' };
  }
  if (stockCount < 5) {
    return { tone: 'text-accent-amber',       dot: 'bg-accent-amber',       label: 'LOW_STOCK' };
  }
  return   { tone: 'text-tertiary-container', dot: 'bg-tertiary-container', label: 'IN_STOCK' };
}

export default function CatalogManagement() {
  const { user } = useAuthStore();

  const [products, setProducts] = useState([]);
  const [search,   setSearch]   = useState('');
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [page,     setPage]     = useState(1);

  // ── Real catalog fetch ────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchProducts();
        setProducts(data ?? []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load catalog');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Reset to page 1 whenever the search filter changes
  useEffect(() => { setPage(1); }, [search]);

  // ── Filter + paginate ─────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.sku  || '').toLowerCase().includes(q)
    );
  }, [products, search]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const firstIdx = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const lastIdx  = Math.min(currentPage * PAGE_SIZE, totalItems);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div
      className="h-screen flex flex-col bg-background text-on-surface"
      data-testid="catalog-management"
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
          testId="catalog-side-nav"
        />

        <main className="flex-1 flex flex-col overflow-hidden bg-background">
          {/* Page header strip */}
          <header className="h-[72px] border-b border-outline-variant px-gutter flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="font-mono text-headline-md text-on-surface">CATALOG_MANAGEMENT</h2>
              <p className="font-mono text-code-snippet text-on-surface-variant mt-1">
                Manage product inventory and specifications.
              </p>
            </div>
            <button
              type="button"
              disabled
              title="ADD endpoint pending — backend wiring deferred"
              className="border border-primary-container text-primary-container bg-transparent
                         px-4 py-2 hover:bg-primary-container hover:text-background
                         font-mono text-label-md uppercase transition-none flex items-center gap-2
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-primary-container"
              data-testid="add-product-btn"
            >
              <span className="material-symbols-outlined" aria-hidden="true">add</span>
              [ ADD NEW PRODUCT ]
            </button>
          </header>

          {/* Scrollable content */}
          <div className="flex-1 overflow-auto p-gutter">
            {/* Terminal-style search bar (spec layout — not the reusable
                TerminalInput component because the spec puts the search
                icon on the *right* and the >_ prefix on the left). */}
            <div
              className="mb-unit-6 flex items-center border border-outline-variant
                         bg-surface-dim px-4 py-2 focus-within:border-secondary-container"
            >
              <span className="text-tertiary-container font-mono text-code-snippet mr-2" aria-hidden="true">&gt;_</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by SKU or NAME..."
                aria-label="Search catalog by SKU or name"
                className="bg-transparent border-none focus:ring-0 text-on-surface
                           font-mono text-code-snippet w-full outline-none placeholder-outline"
              />
              <span className="material-symbols-outlined text-outline-variant" aria-hidden="true">search</span>
            </div>

            {error && (
              <div className="mb-unit-4 font-mono text-code-snippet text-error
                              bg-error-container/20 border border-error/30 px-3 py-2">
                {error}
              </div>
            )}

            {/* Data table */}
            <div className="border border-outline-variant bg-surface-container">
              {loading ? (
                <div
                  className="p-8 text-center font-mono text-code-snippet text-on-surface-variant animate-pulse"
                  data-testid="catalog-loading"
                >
                  // Resolving catalog...
                </div>
              ) : (
                <table className="w-full text-left border-collapse" data-testid="catalog-table">
                  <thead className="border-b border-outline-variant bg-surface-container-high">
                    <tr>
                      <th className="py-3 px-4 font-mono text-label-md text-on-surface-variant uppercase w-16">IMAGE</th>
                      <th className="py-3 px-4 font-mono text-label-md text-on-surface-variant uppercase">NAME</th>
                      <th className="py-3 px-4 font-mono text-label-md text-on-surface-variant uppercase">SKU</th>
                      <th className="py-3 px-4 font-mono text-label-md text-on-surface-variant uppercase">CATEGORY</th>
                      <th className="py-3 px-4 font-mono text-label-md text-on-surface-variant uppercase text-right">PRICE</th>
                      <th className="py-3 px-4 font-mono text-label-md text-on-surface-variant uppercase text-center">STOCK</th>
                      <th className="py-3 px-4 font-mono text-label-md text-on-surface-variant uppercase text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-code-snippet text-on-surface divide-y divide-outline-variant">
                    {pageRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-on-surface-variant">
                          // NO_MATCHES
                        </td>
                      </tr>
                    ) : (
                      pageRows.map((p) => {
                        const badge = getStockBadge(p.stock ?? 0);
                        const sku   = p.sku ?? `SKU-${String(p.id).slice(0, 8).toUpperCase()}`;
                        const cat   = (p.category || 'UNCATEGORIZED').toUpperCase();
                        return (
                          <tr
                            key={p.id}
                            className="hover:bg-surface-container-highest transition-none group"
                            data-testid="catalog-row"
                          >
                            {/* Thumbnail */}
                            <td className="py-3 px-4">
                              <div className="w-10 h-10 border border-outline-variant bg-surface-dim overflow-hidden">
                                {p.image_url ? (
                                  <img
                                    src={p.image_url}
                                    alt={p.name}
                                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-none"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">image</span>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Name */}
                            <td className="py-3 px-4">{p.name}</td>

                            {/* SKU */}
                            <td className="py-3 px-4 text-on-surface-variant">{sku}</td>

                            {/* Category */}
                            <td className="py-3 px-4">
                              <span className="text-secondary-fixed-dim">// {cat}</span>
                            </td>

                            {/* Price */}
                            <td className="py-3 px-4 text-right">
                              ${Number(p.price ?? 0).toFixed(2)}
                            </td>

                            {/* Stock */}
                            <td className="py-3 px-4 text-center">
                              <div className={`inline-flex items-center gap-2 ${badge.tone}`}>
                                <span className={`w-2 h-2 ${badge.dot}`} aria-hidden="true" />
                                <span>{badge.label}</span>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Link
                                  to="/admin/inventory"
                                  className="border border-outline-variant text-on-surface-variant bg-transparent
                                             px-2 py-1 hover:bg-surface-bright hover:text-on-surface
                                             uppercase transition-none"
                                >
                                  [ EDIT ]
                                </Link>
                                <button
                                  type="button"
                                  disabled
                                  title="DELETE endpoint pending — backend wiring deferred"
                                  className="border border-error text-error bg-transparent
                                             px-2 py-1 hover:bg-error hover:text-background
                                             uppercase transition-none disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  [ DELETE ]
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {!loading && totalItems > 0 && (
              <div className="mt-unit-4 flex items-center justify-between text-on-surface-variant font-mono text-code-snippet">
                <span data-testid="catalog-page-count">
                  Showing {firstIdx}-{lastIdx} of {totalItems} items
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="border border-outline-variant px-3 py-1
                               hover:bg-surface-container hover:text-on-surface transition-none
                               disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="catalog-prev"
                  >
                    PREV
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="border border-outline-variant px-3 py-1
                               hover:bg-surface-container hover:text-on-surface transition-none
                               disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="catalog-next"
                  >
                    NEXT
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ─── Admin footer (matches AdminDashboard) ─────────────── */}
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
  );
}
