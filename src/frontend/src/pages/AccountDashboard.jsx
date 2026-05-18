// ============================================================
// AccountDashboard — Dev-Cosmic User Account Home (Zone 3)
// pc-parts.store  |  CSE323 Customer Ordering System
//
// Surface:
//   - Profile summary (email + role)
//   - Tile grid: ORDER_HISTORY, ADDRESSES, PAYMENT_METHODS, SECURITY
//
// Auth: uses useAuthStore() from features/auth — admin role grants
//       extra "ADMIN_PANEL" tile.
// ============================================================

import { Link, useNavigate } from 'react-router-dom';

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

export default function AccountDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <div className="p-8 max-w-md mx-auto flex flex-col items-center gap-4" data-testid="account-dashboard">
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

  return (
    <div className="p-8 max-w-4xl mx-auto flex flex-col gap-6" data-testid="account-dashboard">
      <header>
        <h1 className="font-mono text-[28px] font-bold text-on-background mb-1">// MY_ACCOUNT</h1>
        <p className="font-mono text-[13px] text-text-muted">
          SIGNED_IN_AS: <span className="text-on-background" data-testid="account-email">{user?.email}</span>
          {' · '}ROLE: <span className="text-primary-container">{user?.role}</span>
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Tile to="/account/orders"          label="// ORDER_HISTORY"   sub="Past purchases + status"   testid="tile-orders" />
        <Tile to="/account/addresses"       label="// ADDRESSES"       sub="Shipping destinations"     testid="tile-addresses" />
        <Tile to="/account/payment-methods" label="// PAYMENT_METHODS" sub="Stored card tokens"        testid="tile-payment-methods" />
        <Tile to="/account/security"        label="// SECURITY"        sub="Password & sessions"       testid="tile-security" />
        {user?.role === 'admin' && (
          <Tile to="/admin"              label="// ADMIN_PANEL"     sub="Orders + Inventory"        testid="tile-admin" />
        )}
        {user?.role === 'agent' && (
          <Tile to="/admin"              label="// AGENT_QUEUE"     sub="Ticket triage"             testid="tile-agent" />
        )}
      </div>

      <div className="flex justify-end mt-4">
        <NeonButton variant="secondary" onClick={handleLogout}>
          <span data-testid="account-logout">[ SIGN OUT ]</span>
        </NeonButton>
      </div>
    </div>
  );
}
