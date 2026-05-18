// ============================================================
// AdminDashboard — Dev-Cosmic Admin Home (Zone 4)
// pc-parts.store  |  CSE323 Customer Ordering System
//
// Surface:
//   - System status block (uvicorn / sweep / DB)
//   - Tile grid: ORDERS, INVENTORY, CATALOG, USERS (audit)
// ============================================================

import { Link } from 'react-router-dom';

import NeonButton from '../components/ui/NeonButton';
import { useAuthStore } from '../features/auth/store/authStore';

function Tile({ to, label, sub, testid }) {
  return (
    <Link
      to={to}
      className="border border-outline-variant bg-surface-container-low p-4 hover:border-primary-container transition-none flex flex-col gap-1"
      data-testid={testid}
    >
      <span className="font-mono text-[12px] text-text-muted uppercase tracking-wider">{label}</span>
      <span className="font-inter text-[14px] text-on-background">{sub}</span>
    </Link>
  );
}

export default function AdminDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="p-8 max-w-7xl mx-auto px-4 flex flex-col gap-6 w-full" data-testid="admin-dashboard">
      <header>
        <h1 className="font-mono text-[28px] font-bold text-on-background mb-1">// ADMIN_PANEL</h1>
        <p className="font-mono text-[13px] text-text-muted">
          OPERATOR: <span className="text-on-background">{user?.email}</span>
          {' · '}AUTH_ROLE: <span className="text-primary-container">{user?.role}</span>
        </p>
      </header>

      {/* System status panel */}
      <section
        aria-label="System status"
        className="border border-outline-variant bg-surface-container-low p-4 font-mono text-[13px] grid grid-cols-2 md:grid-cols-4 gap-y-2"
      >
        <span className="text-text-muted">// FASTAPI</span>     <span className="text-tertiary-container">UP · :8000</span>
        <span className="text-text-muted">// SWEEP_INTERVAL</span> <span className="text-on-background">5m</span>
        <span className="text-text-muted">// STALE_WINDOW</span>  <span className="text-on-background">15m</span>
        <span className="text-text-muted">// JWT</span>           <span className="text-tertiary-container">HS256 / 24h</span>
      </section>

      {/* Admin tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Tile to="/admin/orders"    label="// ORDERS"     sub="List · filter · status transitions" testid="tile-admin-orders" />
        <Tile to="/admin/inventory" label="// INVENTORY"  sub="Stock + low-stock flags"            testid="tile-admin-inventory" />
        <Tile to="/admin/catalog"   label="// CATALOG"    sub="Products + categories"              testid="tile-admin-catalog" />
        <Tile to="/"                label="// AUDIT_LOG"  sub="Status changes (read-only)"         testid="tile-admin-audit" />
      </div>

      <div className="flex justify-end mt-2">
        <NeonButton variant="secondary"
          onClick={() => window.open('http://localhost:8000/docs', '_blank', 'noopener,noreferrer')}
        >
          [ OPEN SWAGGER ]
        </NeonButton>
      </div>
    </div>
  );
}
