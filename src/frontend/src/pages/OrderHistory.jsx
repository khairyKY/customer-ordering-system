// ============================================================
// OrderHistory — Dev-Cosmic Customer Order Log (Zone 3)
// pc-parts.store  |  CSE323 Customer Ordering System
//
// Reads from Member D's Python backend:  GET /api/v1/orders
// (Same endpoint the admin uses, server-side scoped by JWT role.)
//
// For non-admin customers the backend filters to their own orders.
// For now we hit the same endpoint and reuse the StatusBadge.
// ============================================================

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import StatusBadge from '../features/orders/components/StatusBadge';
import NeonButton  from '../components/ui/NeonButton';
import { ordersApi } from '../features/orders/api/ordersApi';
import { useAuthStore } from '../features/auth/store/authStore';

export default function OrderHistory() {
  const { isAuthenticated } = useAuthStore();
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const data = await ordersApi.list({ page: 1, limit: 20 });
        setOrders(data.orders);
      } catch (err) {
        setError(err.response?.data?.detail?.error || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="p-8 max-w-md mx-auto flex flex-col items-center gap-4" data-testid="order-history">
        <p className="font-mono text-[13px] text-text-muted">// SIGN_IN_TO_VIEW_HISTORY</p>
        <Link to="/admin/login" className="font-mono text-[13px] text-primary-container hover:underline">
          → /admin/login
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto px-4 flex flex-col gap-4 w-full" data-testid="order-history">
      <header className="flex items-center justify-between">
        <h1 className="font-mono text-[24px] font-bold text-on-background">// ORDER_HISTORY</h1>
        <Link to="/account" className="font-mono text-[13px] text-primary-container hover:underline">
          ← Account
        </Link>
      </header>

      {error && (
        <div className="font-mono text-[13px] text-error bg-error-container/20 border border-error/30 px-3 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <div className="font-mono text-[13px] text-text-muted py-8 text-center">
          // Resolving orders...
        </div>
      ) : (
        <div className="border border-outline-variant bg-surface-container-low overflow-hidden">
          <table className="w-full font-mono text-[13px]">
            <thead>
              <tr className="bg-surface-container border-b border-outline-variant text-text-muted text-[12px] uppercase tracking-wider">
                <th className="p-3 text-left">Order</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 text-left">Placed</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-text-muted">
                    // NO_ORDERS_YET — <Link to="/products" className="text-primary-container hover:underline">browse the catalog</Link>
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="border-b border-outline-variant hover:bg-surface-container" data-testid="order-history-row">
                    <td className="p-3">
                      <code className="text-[11px] bg-surface-container border border-outline-variant px-2 py-1 text-primary-fixed">{o.id}</code>
                    </td>
                    <td className="p-3"><StatusBadge status={o.status} /></td>
                    <td className="p-3 text-right text-on-background">${Number(o.total).toFixed(2)}</td>
                    <td className="p-3 text-text-muted">{new Date(o.placed_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-end">
        <NeonButton variant="secondary" onClick={() => window.location.reload()}>
          [ REFRESH ]
        </NeonButton>
      </div>
    </div>
  );
}
