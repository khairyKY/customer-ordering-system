// ============================================================
// StorefrontPage — Dev-Cosmic Catalog / Home View
// pc-parts.store  |  CSE323 Customer Ordering System
//
// Layout:
//   Hero Banner  →  Featured Category Grid  →  Terminal Search
//   └── Product Grid (API-driven via fetchProducts + LiquidCard)
//
// Business logic preserved:
//   - fetchProducts() from productApi.js
//   - addToCart()     from cartApi.js
//   - onCartUpdate()  lifted to App.jsx
// ============================================================

import { useState, useEffect } from 'react';
import { fetchProducts } from '../api/productApi';
import { addToCart }     from '../api/cartApi';
import LiquidCard        from './ui/LiquidCard';
import TerminalInput     from './ui/TerminalInput';

// ── Static hero / category images (from Stitch export) ──────
const HERO_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDML7p9nW0mJ3ORasdokAAIsCrXonSA0mM7rByk7UPxin9OJKTWCNssG-yRw5AfCN-y51euUgaVfQh0--yWiS7wbwSkwLFcv1Ad4T_8nPe-tVRKr1l8Y1-oITYaPmDN33cpwOJg-hgi7pq1L7lsVZfzJyty2UsD-zhUnF8RdVhvxI2nJLM7FoZroXzgt8YSpb8qK3BRuwhJ_b1XcBIOp9dwq6ao623C3Ahum0xlnPe1Zd6S4y7mkFAFX1lBxjLvwaosXrxy-OvSAbzh';

const FEATURED_CATEGORIES = [
  {
    slug: '// PROCESSORS',
    label: 'Compute Cores',
    stock: 'in_stock',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCLjxaImGuwFu8-dK_PuVTOe4PGRUu0UgjfRG9A14W9CkiEySVu22iBsiYpQf7IEwqHtIO8QDlDhX7h_fzxNv_m_Ear_yQZcFeEx7A6gVUJcJa4JDkc4CikuQKVksvTv77J_lBNqy06jqvGfm0isubh_rzfNUls2eLhjn7GBiq5bfLxnueJWUkK7FemkUDHW8VtMtEC6n_G7b7cOOjJucGcUTdDpG6_u9BC8diqYuM9MF0XsWjTk0uo_g5aJvbFvgFEu9rEM7SLXy_a',
    alt: 'CPU processor',
  },
  {
    slug: '// MEMORY',
    label: 'Volatile Storage',
    stock: 'in_stock',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDAN-maxqKnTb1vDKyIMhGqI7NphGix5bsCmb1MtnhN7rBm8RXwcQFSuuyXdgxc93d231PGRlk7iqHhGh6iEEP41vPPNvQrQaN0LT0_B6OToG_Tgj7L2_OMaI6pPKSZKm_DHg4bLckB0pEYmW_itkz7RZdgtv4fYc4zihT58rvgQRNC1Of-lwoAZukO49ECbfJ0WwGDXqKLdQEE-3-Nf0ynbYwseN9VPh9ubispMXLruXri3M4gG5B444hLUjHZucrWhM-y2TxfRBCM',
    alt: 'DDR5 RAM',
  },
  {
    slug: '// MAINBOARDS',
    label: 'System Logic',
    stock: 'low_stock',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA9TM_Tx0SuwZClbfOOtKv7Xa1iisLP1YKEzd1b1Nm_108pX6E7-FK7XNQEOUzxYyKNrDdzCz2RcllcEc9GWYtTEt4ewmJDCJ8adlE4Qh-ToQyEfFD8UmMEmoK-LfSqF1G4WW2fkw0ZDR6vHtTKc9QM-p4hFrMvzTSJH3ajOdTWEISGD9f3YQyB4ACGLYFw2_yuXZ8YYZ9pLo76tPWCT2oRYgn5YhXmh7WSpc8pXKgDwP2WMhc-MMP_DwC2AyWMKAhIG9hnC0omTCxe',
    alt: 'ATX Motherboard',
  },
];

const STOCK_DOT = {
  in_stock:  { cls: 'bg-accent-green', color: 'text-accent-green', label: 'IN_STOCK' },
  low_stock: { cls: 'bg-accent-amber', color: 'text-accent-amber', label: 'LOW_STOCK' },
};

/**
 * @param {object}   props
 * @param {function} props.onCartUpdate - Lifted cart state setter
 */
export default function StorefrontPage({ onCartUpdate }) {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [addingId, setAddingId] = useState(null); // product id currently being added
  const [sortMode, setSortMode] = useState('newest'); // 'price_asc' | 'price_desc' | 'newest'
  const [categoryFilter, setCategoryFilter] = useState(''); // '' = all

  // ── Fetch catalog on mount ─────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchProducts();
        if (data) setProducts(data);
      } catch (err) {
        console.error('[StorefrontPage] catalog fetch error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Add to cart handler ────────────────────────────────────
  const handleAdd = async (product) => {
    setAddingId(product.id);
    try {
      const updated = await addToCart(product.id);
      onCartUpdate(updated);
    } catch (err) {
      console.error('[StorefrontPage] addToCart error:', err);
      alert('Could not add item — stock limit reached or backend unavailable.');
    } finally {
      setAddingId(null);
    }
  };

  // ── Client-side search + category filter ───────────────────
  const query    = search.toLowerCase();
  const catLower = categoryFilter.toLowerCase();
  const filtered = products.filter(p => {
    if (query && !p.name.toLowerCase().includes(query) && !(p.category ?? '').toLowerCase().includes(query)) return false;
    if (catLower && (p.category ?? '').toLowerCase() !== catLower) return false;
    return true;
  });

  // ── Sorting ────────────────────────────────────────────────
  const sorted = [...filtered].sort((a, b) => {
    if (sortMode === 'price_asc')  return a.price - b.price;
    if (sortMode === 'price_desc') return b.price - a.price;
    return 0; // 'newest' = default API order
  });

  // ── Derive stock status from API field ─────────────────────
  const getStockStatus = (p) => {
    if (p.stock === 0)        return 'out_stock';
    if (p.stock !== undefined && p.stock < 5) return 'low_stock';
    return 'in_stock';
  };

  return (
    <main
      id="storefront-page"
      className="flex-grow px-margin flex flex-col gap-unit-8 w-full max-w-[1280px] mx-auto
                 pt-unit-8 pb-unit-12"
    >
      {/* ── Hero Banner ──────────────────────────────────────── */}
      <section
        className="w-full border border-border-dark bg-surface-dark p-unit-6
                   flex flex-col md:flex-row gap-unit-8 py-[48px]"
        aria-labelledby="hero-heading"
      >
        <div className="flex-1 flex flex-col justify-center gap-unit-4">
          <div className="font-mono text-[13px] text-accent-green uppercase tracking-wider">
            &gt;_ NEW ARRIVAL
          </div>
          <h1
            id="hero-heading"
            className="font-inter text-headline-lg text-on-background uppercase"
          >
            NVIDIA RTX 5090 FOUNDERS EDITION
          </h1>
          <p className="font-inter text-body-lg text-text-muted">
            The ultimate GPU for the most demanding workloads. Architected for
            uncompromised performance in rendering, AI, and raw computational
            throughput.
          </p>
          <div className="flex gap-unit-4 mt-unit-2">
            <button
              id="hero-add-btn"
              className="font-mono border border-accent-blue text-accent-blue
                         px-[24px] py-[11px] text-label-md hover:bg-accent-blue
                         hover:text-background transition-none uppercase"
              onClick={() => handleAdd({ id: 'e1a9c2f0-7b3b-4e1e-9a9a-9a9a9a9a9a9a', name: 'NVIDIA GeForce RTX 5090 Founders Edition', price: 1999.99 })}
            >
              { addingId === 'e1a9c2f0-7b3b-4e1e-9a9a-9a9a9a9a9a9a' ? '[ ADDING... ]' : '[ ADD TO CART ]' }
            </button>
            <button
              className="font-mono border border-border-dark text-text-muted
                         px-[24px] py-[11px] text-label-md hover:bg-on-background
                         hover:text-background transition-none uppercase"
              onClick={() => setSearch('RTX 5090')}
            >
              [ VIEW SPECS ]
            </button>
          </div>
        </div>

        <div className="flex-1 border border-border-dark bg-background h-80 relative overflow-hidden">
          <img
            src={HERO_IMG}
            alt="NVIDIA RTX 5090 Founders Edition GPU"
            className="w-full h-full object-cover grayscale opacity-70"
          />
        </div>
      </section>

      {/* ── Featured Categories ───────────────────────────────── */}
      <section
        className="grid grid-cols-1 md:grid-cols-3 gap-gutter py-unit-4"
        aria-label="Featured hardware categories"
      >
        {FEATURED_CATEGORIES.map((cat) => {
          const s = STOCK_DOT[cat.stock] ?? STOCK_DOT.in_stock;
          return (
            <div
              key={cat.slug}
              className="border border-border-dark bg-surface-dark flex flex-col
                         group cursor-pointer"
              style={{ borderTop: '2px solid transparent' }}
              onMouseEnter={e => e.currentTarget.style.borderTopColor = '#00BFFF'}
              onMouseLeave={e => e.currentTarget.style.borderTopColor = 'transparent'}
            >
              <div className="h-40 border-b border-border-dark bg-background overflow-hidden">
                <img
                  src={cat.img}
                  alt={cat.alt}
                  className="w-full h-full object-cover grayscale opacity-60 mix-blend-screen
                             group-hover:opacity-80 transition-opacity duration-200"
                />
              </div>
              <div className="p-unit-4 flex flex-col gap-unit-2">
                <div className="font-mono text-label-md text-text-muted">{cat.slug}</div>
                <h3 className="font-inter text-[14px] text-on-background uppercase font-bold">
                  {cat.label}
                </h3>
                <div className="flex justify-between items-center mt-auto pt-unit-2">
                  <span className={`font-mono text-label-md ${s.color} flex items-center gap-1`}>
                    <span className={`inline-block w-2 h-2 ${s.cls}`} />
                    {s.label}
                  </span>
                  <span
                    className="font-mono text-label-md text-accent-blue hover:bg-accent-blue hover:text-background px-1 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      const catMap = { '// PROCESSORS': 'cpu', '// MEMORY': 'memory', '// MAINBOARDS': 'motherboard' };
                      setCategoryFilter(catMap[cat.slug] || '');
                    }}
                  >
                    &gt; BROWSE
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* ── Terminal Search ────────────────────────────────────── */}
      <section aria-label="Inventory search">
        <p className="font-mono text-label-md text-text-muted mb-unit-2 uppercase tracking-wider">
          Terminal Search
        </p>
        <TerminalInput
          id="inventory-search"
          prefix=">_"
          placeholder="search_inventory --query='DDR5 64GB'"
          value={search}
          onChange={e => setSearch(e.target.value)}
          type="search"
          ariaLabel="Search inventory"
        />
      </section>

      {/* ── Product Grid (Sort Bar + Cards) ──────────────────── */}
      <section aria-label="Product catalog">
        {/* Sort bar */}
        <div className="flex flex-wrap gap-unit-2 border-b border-outline-variant pb-unit-4 mb-unit-6">
          <span className="font-mono text-label-md text-outline self-center mr-unit-2">SORT BY:</span>
          <button className={`border bg-transparent font-mono text-label-md
                             uppercase px-unit-2 py-1 transition-none ${
                               sortMode === 'price_asc' ? 'border-primary-container text-primary-container' : 'border-outline-variant text-text-muted hover:bg-on-background hover:text-background'
                             }`}
                  onClick={() => setSortMode('price_asc')}>
            [ PRICE ↑ ]
          </button>
          <button className={`border bg-transparent font-mono text-label-md
                             uppercase px-unit-2 py-1 transition-none ${
                               sortMode === 'price_desc' ? 'border-primary-container text-primary-container' : 'border-outline-variant text-text-muted hover:bg-on-background hover:text-background'
                             }`}
                  onClick={() => setSortMode('price_desc')}>
            [ PRICE ↓ ]
          </button>
          <button className={`border bg-transparent font-mono text-label-md
                             uppercase px-unit-2 py-1 transition-none ${
                               sortMode === 'newest' ? 'border-primary-container text-primary-container' : 'border-outline-variant text-text-muted hover:bg-on-background hover:text-background'
                             }`}
                  onClick={() => setSortMode('newest')}>
            [ NEWEST ]
          </button>
          {categoryFilter && (
            <button className="border border-error text-error bg-transparent font-mono text-label-md
                               uppercase px-unit-2 py-1 transition-none ml-auto"
                    onClick={() => setCategoryFilter('')}>
              [ CLEAR FILTER: {categoryFilter.toUpperCase()} ]
            </button>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="py-16 text-center font-mono text-label-md text-outline animate-pulse">
            INIT_PRODUCT_LINK...
          </div>
        )}

        {/* Empty state (after search) */}
        {!loading && sorted.length === 0 && (
          <div className="py-16 text-center font-mono text-label-md text-outline">
            NO_RESULTS — try a different query.
          </div>
        )}

        {/* Cards */}
        {!loading && sorted.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-unit-4">
            {sorted.map(p => (
              <LiquidCard
                key={p.id}
                category={`// ${(p.category ?? 'HARDWARE').toUpperCase()}`}
                title={p.name}
                subtitle={p.spec_snippet ?? undefined}
                price={`$${Number(p.price).toFixed(2)}`}
                imageSrc={p.image_url ?? undefined}
                imageAlt={p.name}
                stock={getStockStatus(p)}
                onAdd={() => handleAdd(p)}
                className={addingId === p.id ? 'opacity-60 pointer-events-none' : ''}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
