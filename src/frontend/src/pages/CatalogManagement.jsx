// ============================================================
// CatalogManagement — Dev-Cosmic Admin Catalog (Zone 4)
// pc-parts.store  |  CSE323 Customer Ordering System
//
// Catalog ownership moved to Member A on 2026-05-16. Until they
// publish dedicated CRUD endpoints, this page renders the product
// list read-only and offers a stock-update shortcut into
// /admin/inventory.
// ============================================================

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import NeonButton    from '../components/ui/NeonButton';
import TerminalInput from '../components/ui/TerminalInput';
import { fetchProducts } from '../api/productApi';

export default function CatalogManagement() {
  const [products, setProducts] = useState([]);
  const [search,   setSearch]   = useState('');
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchProducts();
        setProducts(data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load catalog');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const visible = products.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-8 max-w-7xl mx-auto px-4 flex flex-col gap-4 w-full" data-testid="catalog-management">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-[24px] font-bold text-on-background mb-1">// CATALOG_MANAGEMENT</h1>
          <p className="font-mono text-[12px] text-text-muted">
            Read-only mirror. Mutations land in <Link to="/admin/inventory" className="text-primary-container hover:underline">/admin/inventory</Link>.
            CRUD endpoints owned by Member A (catalog slice).
          </p>
        </div>
        <Link to="/admin" className="font-mono text-[13px] text-primary-container hover:underline">
          ← Admin
        </Link>
      </header>

      <div className="max-w-sm">
        <TerminalInput
          type="search"
          placeholder="grep -i product..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          ariaLabel="Search products"
        />
      </div>

      {error && (
        <div className="font-mono text-[13px] text-error bg-error-container/20 border border-error/30 px-3 py-2">
          {error}
        </div>
      )}

      <div className="border border-outline-variant bg-surface-container-low overflow-hidden">
        {loading ? (
          <div className="p-8 text-center font-mono text-[13px] text-text-muted" data-testid="catalog-loading">
            // Resolving catalog...
          </div>
        ) : (
          <table className="w-full font-mono text-[13px]" data-testid="catalog-table">
            <thead>
              <tr className="bg-surface-container border-b border-outline-variant text-text-muted text-[12px] uppercase tracking-wider">
                <th className="p-3 text-left">Product</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-right">Price</th>
                <th className="p-3 text-right">Stock</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-text-muted">// NO_MATCHES</td>
                </tr>
              ) : (
                visible.map((p) => (
                  <tr key={p.id} className="border-b border-outline-variant hover:bg-surface-container" data-testid="catalog-row">
                    <td className="p-3 text-on-background">{p.name}</td>
                    <td className="p-3 text-text-muted">{p.category || '—'}</td>
                    <td className="p-3 text-right text-on-background">${Number(p.price).toFixed(2)}</td>
                    <td className="p-3 text-right text-on-background">{p.stock}</td>
                    <td className="p-3 text-right">
                      <Link
                        to="/admin/inventory"
                        className="font-mono text-[12px] text-primary-container hover:underline"
                      >
                        edit stock →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex justify-end">
        <NeonButton variant="secondary" onClick={() => window.location.reload()}>
          [ REFRESH ]
        </NeonButton>
      </div>
    </div>
  );
}
