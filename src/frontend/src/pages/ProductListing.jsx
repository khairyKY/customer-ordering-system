// ============================================================
// ProductListing — Dev-Cosmic Components Catalog (Zone 1)
// Stitch source: lines 566..876 / 1133..1486 of all_of_the_frontend.txt
//
// Layout:
//   [ Sidebar filter panel ─ TerminalInput search + checkbox filters ]
//   [ Sort bar  | Product grid (LiquidCard × N) ─────────────────────]
//
// API:  fetchProducts() from productApi.js   (Member A's backend)
//       addToCart()     from cartApi.js
// ============================================================

import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import LiquidCard      from '../components/ui/LiquidCard';
import TerminalInput   from '../components/ui/TerminalInput';
import NeonButton      from '../components/ui/NeonButton';

import { fetchProducts } from '../api/productApi';
import { addToCart }     from '../api/cartApi';

const SORT_OPTIONS = [
  { value: 'name',       label: 'NAME_ASC' },
  { value: 'price-asc',  label: 'PRICE_ASC' },
  { value: 'price-desc', label: 'PRICE_DESC' },
  { value: 'stock',      label: 'STOCK_DESC' },
];

const STOCK_FILTERS = [
  { key: 'in_stock',  label: 'IN STOCK' },
  { key: 'low_stock', label: 'LOW STOCK' },
  { key: 'out_stock', label: 'OUT OF STOCK' },
];

const stockBucket = (qty) => {
  if (qty <= 0) return 'out_stock';
  if (qty < 5)  return 'low_stock';
  return 'in_stock';
};

export default function ProductListing({ onCartUpdate }) {
  const navigate = useNavigate();
  const [products, setProducts]       = useState([]);
  const [loading,  setLoading]        = useState(true);
  const [error,    setError]          = useState(null);
  const [search,   setSearch]         = useState('');
  const [enabledStock, setEnabledStock] = useState(['in_stock', 'low_stock', 'out_stock']);
  const [sort,     setSort]           = useState('name');

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

  const visible = useMemo(() => {
    let result = products.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (!enabledStock.includes(stockBucket(p.stock))) return false;
      return true;
    });
    switch (sort) {
      case 'price-asc':  result = [...result].sort((a, b) => a.price - b.price); break;
      case 'price-desc': result = [...result].sort((a, b) => b.price - a.price); break;
      case 'stock':      result = [...result].sort((a, b) => b.stock - a.stock); break;
      default:           result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }, [products, search, enabledStock, sort]);

  function toggleStock(key) {
    setEnabledStock((cur) =>
      cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key],
    );
  }

  async function handleAdd(product) {
    try {
      const updated = await addToCart(product.id, 1);
      onCartUpdate?.(updated);
    } catch (err) {
      console.error('[ProductListing] addToCart failed', err);
    }
  }

  return (
    <div className="grid grid-cols-[260px_1fr] gap-8 p-8" data-testid="product-listing">
      {/* ── Sidebar filter panel ─────────────────────────────── */}
      <aside className="border border-outline-variant bg-surface-container-low p-4 flex flex-col gap-6 h-fit sticky top-[72px]">
        <div>
          <h2 className="font-mono text-[12px] text-text-muted uppercase tracking-wider mb-3">
            // SEARCH
          </h2>
          <TerminalInput
            type="search"
            placeholder="grep -i ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            ariaLabel="Search products"
          />
        </div>

        <div>
          <h2 className="font-mono text-[12px] text-text-muted uppercase tracking-wider mb-3">
            // STOCK_FILTER
          </h2>
          <ul className="flex flex-col gap-2">
            {STOCK_FILTERS.map((f) => (
              <li key={f.key}>
                <label className="flex items-center gap-2 font-mono text-[13px] text-on-background cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabledStock.includes(f.key)}
                    onChange={() => toggleStock(f.key)}
                    className="accent-primary-container"
                  />
                  {f.label}
                </label>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        {/* Sort bar */}
        <div className="flex items-center justify-between border border-outline-variant bg-surface-container-low px-4 py-2">
          <span className="font-mono text-[13px] text-text-muted">
            // {visible.length} ITEM(S) FOUND
          </span>
          <label className="flex items-center gap-2 font-mono text-[13px] text-text-muted">
            SORT:
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-surface-container border border-outline-variant text-on-background font-mono text-[13px] px-2 py-1"
              data-testid="product-sort"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
        </div>

        {/* Product grid */}
        {loading && (
          <div className="font-mono text-[13px] text-text-muted py-12 text-center" data-testid="product-listing-loading">
            // Loading catalog...
          </div>
        )}
        {error && (
          <div className="font-mono text-[13px] text-error bg-error-container/20 border border-error/30 px-3 py-2">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {visible.length === 0 && (
              <div className="col-span-full text-center font-mono text-[13px] text-text-muted py-12">
                // NO RESULTS
              </div>
            )}
            {visible.map((p) => (
              <div key={p.id} data-testid="product-card" data-product-id={p.id}>
                <LiquidCard
                  category={p.category || '// COMPONENT'}
                  title={p.name}
                  subtitle={p.description}
                  price={`$${Number(p.price).toFixed(2)}`}
                  imageSrc={p.image_url}
                  stock={stockBucket(p.stock)}
                  onAdd={() => handleAdd(p)}
                />
                <div className="mt-2">
                  <NeonButton variant="secondary" fullWidth onClick={() => navigate(`/products/${p.id}`)}>
                    [ DETAILS ]
                  </NeonButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
