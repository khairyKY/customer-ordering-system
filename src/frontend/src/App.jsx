// ============================================================
// App — Dev-Cosmic Root Layout (react-router edition)
// pc-parts.store  |  CSE323 Customer Ordering System
// ============================================================
//
// Routing architecture — 4 Zones:
//
//   ZONE 1 · Public Storefront
//     /                    → StorefrontPage (Home)
//     /products            → ProductListing
//     /products/:id        → ProductDetail
//     /deals               → DealsPage
//     /builds              → BuildsPage
//
//   ZONE 2 · Checkout Funnel
//     /cart                → CartPage (legacy entry point)
//     /checkout            → CheckoutFlow (7-step wizard)
//
//   ZONE 3 · User Account
//     /account                 → AccountDashboard
//     /account/orders          → OrderHistory
//     /account/addresses       → Addresses
//     /account/payment-methods → PaymentMethods
//     /account/security        → SecuritySettings
//
//   ZONE 4 · Admin Panel (role-protected)
//     /admin               → AdminDashboard
//     /admin/login         → LoginPage              (public)
//     /admin/register      → RegisterPage           (public)
//     /admin/orders        → OrderListPage          (admin)
//     /admin/orders/:id    → OrderDetailPage        (admin)
//     /admin/inventory     → InventoryPage          (admin)
//     /admin/catalog       → CatalogManagement      (admin)
//
//   IMMERSIVE · Presentation
//     /presentation        → PresentationDeck (fullscreen, chrome hidden)
//
// Global chrome:
//   - <CosmicCanvas variant="canvas" />  → starfield (always-on, mounted
//       once at the root — never re-renders on navigation)
//   - <TopNavBar />                       → fixed top   (hidden on /presentation)
//   - <StatusBar />                       → fixed bottom (hidden on /presentation)
// ============================================================

import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';

import CosmicCanvas    from './components/CosmicCanvas';
import TopNavBar       from './components/TopNavBar';
import StatusBar       from './components/StatusBar';
import StorefrontPage  from './components/StorefrontPage';
import CartPage        from './components/CartPage';

// Zone 1 — Public Storefront
import ProductListing  from './pages/ProductListing';
import ProductDetail   from './pages/ProductDetail';
import DealsPage       from './pages/DealsPage';
import BuildsPage      from './pages/BuildsPage';
import AboutPage       from './pages/AboutPage';

// Zone 2 — Checkout Funnel
import CheckoutFlow    from './pages/CheckoutFlow';

// Zone 3 — User Account
import AccountDashboard from './pages/AccountDashboard';
import OrderHistory     from './pages/OrderHistory';
import Addresses        from './pages/Addresses';
import PaymentMethods   from './pages/PaymentMethods';
import SecuritySettings from './pages/SecuritySettings';

// Zone 4 — Admin Panel
import AdminDashboard   from './pages/AdminDashboard';
import CatalogManagement from './pages/CatalogManagement';
import LoginPage       from './features/auth/pages/LoginPage';
import RegisterPage    from './features/auth/pages/RegisterPage';
import OrderListPage   from './features/orders/pages/OrderListPage';
import OrderDetailPage from './features/orders/pages/OrderDetailPage';
import InventoryPage   from './features/orders/pages/InventoryPage';
import ProtectedRoute  from './features/auth/components/ProtectedRoute';

// Tickets — customer ticket creation + agent triage
import TicketForm from './features/tickets/components/TicketForm';
import TriagePage from './features/tickets/components/TicketList';

// Payment — single-form view at /payment (E2E POM target; the 7-step
// wizard at /checkout remains the canonical purchase flow)
import QuickPaymentPage from './pages/QuickPaymentPage';

// Immersive — Presentation
import PresentationDeck from './pages/PresentationDeck';

// ── Routed shell ──────────────────────────────────────────────
// Lives inside <BrowserRouter> so it can read the active route and
// drop the global chrome on the immersive /presentation route.
function Shell({ cart, cartCount, handleCartUpdate, onClearCart }) {
  const { pathname } = useLocation();
  const immersive = pathname === '/presentation';
  // AdminDashboard + CatalogManagement render their own full-screen shell
  // (admin TopNavBar, SideNavBar, admin footer). Suppress the global chrome
  // on those exact routes only — /admin/login, /admin/register, and the
  // not-yet-reworked /admin/orders + /admin/inventory still keep the global
  // TopNavBar + StatusBar.
  const adminShellRoutes = new Set(['/admin', '/admin/catalog']);
  const adminShell = adminShellRoutes.has(pathname);
  // Checkout funnel suppresses the storefront chrome to reduce visual noise
  // during the transactional flow — CheckoutFlow renders its own minimal
  // branded header inline (per spec: "TopNavBar nav hidden due to
  // transactional intent"). /cart still keeps the global nav.
  const checkoutShell = pathname === '/checkout';
  // AccountDashboard renders its own sidebar-first shell (cyan SideNavBar
  // on desktop, hamburger drawer on mobile, account footer). Only suppress
  // on the dashboard index — /account/orders, /addresses etc. still use
  // the global chrome until they each get their own rework.
  const accountShell = pathname === '/account';
  const chromeSuppressed = immersive || adminShell || checkoutShell || accountShell;

  return (
    <>
      {!chromeSuppressed && (
        <TopNavBar cartCount={cartCount} onClearCart={onClearCart} />
      )}

      {/* Page area — clears fixed TopNavBar (56px) + StatusBar (24px),
          except on routes that render their own full-screen shell. */}
      <div className={chromeSuppressed ? 'flex-grow' : 'flex-grow pt-[56px] pb-[24px]'}>
        <Routes>
          {/* ── Zone 1 · Public Storefront ─────────────── */}
          <Route path="/"             element={<StorefrontPage onCartUpdate={handleCartUpdate} />} />
          <Route path="/products"     element={<ProductListing  onCartUpdate={handleCartUpdate} />} />
          <Route path="/products/:id" element={<ProductDetail   onCartUpdate={handleCartUpdate} />} />
          <Route path="/deals"        element={<DealsPage />} />
          <Route path="/builds"       element={<BuildsPage    onCartUpdate={handleCartUpdate} />} />
          <Route path="/about"        element={<AboutPage />} />

          {/* ── Zone 2 · Checkout Funnel ───────────────── */}
          <Route path="/cart"     element={<CartPage     cart={cart} onCartUpdate={handleCartUpdate} onNavigate={() => {}} />} />
          <Route path="/checkout" element={<CheckoutFlow cart={cart} onCartUpdate={handleCartUpdate} />} />

          {/* ── Zone 3 · User Account ──────────────────── */}
          <Route path="/account"                 element={<AccountDashboard />} />
          <Route path="/account/orders"          element={<OrderHistory />} />
          <Route path="/account/addresses"       element={<Addresses />} />
          <Route path="/account/payment-methods" element={<PaymentMethods />} />
          <Route path="/account/security"        element={<SecuritySettings />} />

          {/* ── Zone 4 · Admin Panel ───────────────────── */}
          {/* Public sub-routes (login / register stay outside the role guard) */}
          <Route path="/admin/login"    element={<LoginPage />} />
          <Route path="/admin/register" element={<RegisterPage />} />

          {/* Role-protected admin sub-tree */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute role="admin">
                <OrderListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders/:id"
            element={
              <ProtectedRoute role="admin">
                <OrderDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/inventory"
            element={
              <ProtectedRoute role="admin">
                <InventoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/catalog"
            element={
              <ProtectedRoute role="admin">
                <CatalogManagement />
              </ProtectedRoute>
            }
          />

          {/* ── Tickets / Support ─────────────────────────── */}
          <Route path="/tickets/new"    element={<TicketForm />} />
          <Route path="/tickets/triage" element={<TriagePage />} />

          {/* ── Payment (single-form alternative to /checkout) ── */}
          <Route path="/payment"        element={<QuickPaymentPage />} />

          {/* ── Immersive · Presentation ─────────────────── */}
          <Route path="/presentation" element={<PresentationDeck />} />

          {/* ── Fallback ─────────────────────────────────── */}
          <Route
            path="/forbidden"
            element={
              <div className="p-8 max-w-md mx-auto font-mono">
                <h1 className="text-[24px] text-error mb-2">// 403 FORBIDDEN</h1>
                <p className="text-[13px] text-text-muted">Admin role required.</p>
              </div>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {!chromeSuppressed && <StatusBar />}
    </>
  );
}

function App() {
  // Cart state stays lifted at the root so TopNavBar's counter and the
  // checkout funnel see the same snapshot.
  const [cart, setCart] = useState({ items: [], subtotal: 0, tax: 0, total: 0 });
  const handleCartUpdate = (updated) => { if (updated) setCart(updated); };
  const handleClearCart = () => setCart({ items: [], subtotal: 0, tax: 0, total: 0 });
  const cartCount = cart?.items?.reduce((acc, i) => acc + i.quantity, 0) ?? 0;

  return (
    <div className="relative min-h-screen flex flex-col font-inter text-on-background selection:bg-primary-container selection:text-background">
      {/* ── Layer 0 · Animated star-field background ───────
          Mounted once, outside the router — never re-renders on
          navigation or on presentation slide changes. */}
      <CosmicCanvas variant="canvas" />

      {/* ── Layer 1 · Routed foreground ───────────────────── */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <BrowserRouter>
          <Shell
            cart={cart}
            cartCount={cartCount}
            handleCartUpdate={handleCartUpdate}
            onClearCart={handleClearCart}
          />
        </BrowserRouter>
      </div>
    </div>
  );
}

export default App;
