// ============================================================
// AdminTopNavBar — Dev-Cosmic Admin Zone Top Nav (Zone 4)
// pc-parts.store  |  CSE323 Customer Ordering System
//
// Shared across AdminDashboard, CatalogManagement (and any future
// admin page that joins the amber shell). Uses NavLink so the
// active section is automatically highlighted from the URL.
//
// Layout:
//   [● // admin panel]   [COMPONENTS][SYSTEMS][PERIPHERALS][DOCS]   [🛒][🖥]
//
// Spec source: stitch_terminal_hardware_store/frontend_update.txt
//   Admin Overview Dashboard top bar  (lines 1502–1521)
// ============================================================

import { Link, NavLink } from 'react-router-dom';

// Mapping the spec's labels (COMPONENTS/SYSTEMS/PERIPHERALS/DOCS) to
// the real admin sub-routes that exist in App.jsx.
const SECTION_LINKS = [
  { to: '/admin/catalog',   label: 'COMPONENTS' },
  { to: '/admin/inventory', label: 'SYSTEMS' },
  { to: '/admin/orders',    label: 'PERIPHERALS' },
];

export default function AdminTopNavBar() {
  const linkBase   = 'pb-1 font-mono text-label-md uppercase transition-none';
  const linkIdle   = `${linkBase} text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest`;
  const linkActive = `${linkBase} text-on-surface bg-surface-container-highest border-b-2 border-accent-amber`;

  return (
    <header
      className="h-[56px] w-full bg-background border-b border-outline-variant
                 flex justify-between items-center px-gutter sticky top-0 z-50 flex-shrink-0"
      aria-label="Admin top navigation"
      data-testid="admin-top-nav"
    >
      {/* Left: brand */}
      <Link
        to="/admin"
        className="flex items-center gap-unit-2 focus:outline-none"
        aria-label="Admin panel home"
      >
        <span
          className="w-2 h-2 bg-accent-amber rounded-full"
          aria-hidden="true"
        />
        <span className="font-mono text-headline-sm text-on-surface tracking-tighter">
          // admin panel
        </span>
      </Link>

      {/* Center: section nav (desktop only) */}
      <nav className="hidden md:flex gap-unit-6" aria-label="Admin section nav">
        {SECTION_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => (isActive ? linkActive : linkIdle)}
          >
            {link.label}
          </NavLink>
        ))}
        {/* DOCS opens the FastAPI swagger UI — external anchor */}
        <a
          href="http://localhost:8000/docs"
          target="_blank"
          rel="noopener noreferrer"
          className={linkIdle}
        >
          DOCS
        </a>
      </nav>

      {/* Right: utility icons */}
      <div className="flex items-center gap-unit-4">
        <Link
          to="/cart"
          className="text-primary hover:bg-surface-container-highest transition-none p-1"
          aria-label="Cart"
          title="Cart (storefront view)"
        >
          <span className="material-symbols-outlined">shopping_cart</span>
        </Link>
        <Link
          to="/"
          className="text-primary hover:bg-surface-container-highest transition-none p-1"
          aria-label="Return to storefront"
          title="Return to storefront"
        >
          <span className="material-symbols-outlined">terminal</span>
        </Link>
      </div>
    </header>
  );
}
