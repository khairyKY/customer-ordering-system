import React, { useState, useEffect } from 'react';
import CosmicCanvas from './components/CosmicCanvas';
import TopNavBar    from './components/TopNavBar';
import StatusBar    from './components/StatusBar';
import StorefrontPage from './components/StorefrontPage';
import CartPage       from './components/CartPage';

// ============================================================
// App — Dev-Cosmic Root Layout
// pc-parts.store  |  CSE323 Customer Ordering System
// ============================================================
// View routing is intentionally stateful (no react-router) to
// keep the dependency surface minimal for the course project.
//
// Views:
//   "storefront" — Catalog (Hero + Featured Categories + Product Grid)
//   "cart"       — Cart Table + Order Summary + Checkout trigger
// ============================================================

function App() {
  const [cart, setCart]       = useState({ items: [], subtotal: 0, tax: 0, total: 0 });
  const [view, setView]       = useState('storefront'); // 'storefront' | 'cart'

  const handleCartUpdate = (updatedCart) => {
    if (updatedCart) setCart(updatedCart);
  };

  const cartCount = cart?.items?.reduce((acc, i) => acc + i.quantity, 0) ?? 0;

  return (
    <div className="relative min-h-screen flex flex-col font-inter text-on-background selection:bg-primary-container selection:text-background">
      {/* ── Layer 0: Animated Star-Field ─────────────────── */}
      <CosmicCanvas variant="canvas" />

      {/* ── Layer 1: Foreground UI ────────────────────────── */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <TopNavBar
          cartCount={cartCount}
          activeView={view}
          onNavigate={setView}
        />

        {/* Page area — padded to clear fixed TopNavBar (56px) + StatusBar (24px) */}
        <div className="flex-grow pt-[56px] pb-[24px]">
          {view === 'storefront' && (
            <StorefrontPage onCartUpdate={handleCartUpdate} />
          )}
          {view === 'cart' && (
            <CartPage
              cart={cart}
              onCartUpdate={handleCartUpdate}
              onNavigate={setView}
            />
          )}
        </div>

        <StatusBar />
      </div>
    </div>
  );
}

export default App;
