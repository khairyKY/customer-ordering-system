// ============================================================
// BuildsPage — Dev-Cosmic "Build Your Next Rig" (Zone 1)
// pc-parts.store  |  CSE323 Customer Ordering System
//
// Spec source: stitch_terminal_hardware_store/frontend_update.txt
//   "Build Your Next Rig"  (lines 2310–2704)
//
// Layout (top → bottom):
//   ┌── HERO ─────────────────────────────────────────────────┐
//   │  NEW ARRIVALS // 2025                                   │
//   │  Build Your Next Rig.            [ GPU image, GS→color ]│
//   │  …paragraph…                                            │
//   │  [ SHOP NOW ]  [ VIEW DEALS ]                           │
//   ├── BROWSE BY CATEGORY ───────────────────────────────────┤
//   │  [ __CPUS ] [ __GPUS ] [ __MOTHERBOARDS ] …  (h-scroll) │
//   ├── FEATURED HARDWARE ────────────────────────────────────┤
//   │  [card][card][card][card]                  [ VIEW ALL ] │
//   ├── PROMO BANNER ─────────────────────────────────────────┤
//   │  🚚 GLOBAL FREE SHIPPING — $500+      [ SHOP THE DEAL ] │
//   └─────────────────────────────────────────────────────────┘
//
// Uses the global TopNavBar + StatusBar (no chrome suppression).
//
// Data: Real catalog via fetchProducts; the first 4 results render
// in the Featured grid. ADD wires through onCartUpdate. Categories
// are static (5 spec-defined buckets), each linking back to
// /products?category=<slug> for the storefront filter to pick up.
// ============================================================

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { fetchProducts } from '../api/productApi';
import { addToCart }     from '../api/cartApi';

// ── Spec category strip ─────────────────────────────────────────
const CATEGORIES = [
  { slug: 'cpu',         label: '__CPUS',         icon: 'memory' },
  { slug: 'gpu',         label: '__GPUS',         icon: 'developer_board' },
  { slug: 'motherboard', label: '__MOTHERBOARDS', icon: 'grid_4x4' },
  { slug: 'memory',      label: '__MEMORY',       icon: 'sd_card' },
  { slug: 'storage',     label: '__STORAGE',      icon: 'hard_drive' },
];

// Stock-dot helper (matches the spec's absolute top-left dot pattern)
function stockDotClass(stock) {
  if (!stock || stock <= 0) return 'bg-error';
  if (stock < 5)            return 'bg-accent-amber';
  return 'bg-tertiary-container';
}

// Category short-tag rendered top-right of each featured card
function categoryTag(category) {
  const c = (category || 'HW').toUpperCase();
  if (c.includes('GPU') || c.includes('GRAPHIC'))  return '// GPU';
  if (c.includes('CPU') || c.includes('PROCESS'))  return '// CPU';
  if (c.includes('MOTHERBOARD') || c.includes('MB')) return '// MB';
  if (c.includes('MEM') || c.includes('RAM'))      return '// RAM';
  if (c.includes('STORAGE') || c.includes('SSD'))  return '// SSD';
  return '// HW';
}

export default function BuildsPage({ onCartUpdate }) {
  const navigate = useNavigate();
  const [products, setProducts]   = useState([]);
  const [loading,  setLoading]    = useState(true);
  const [addError, setAddError]   = useState(null);
  const [addingId, setAddingId]   = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchProducts();
        setProducts(data || []);
      } catch (err) {
        console.error('[BuildsPage] fetchProducts error:', err);
        setAddError('CATALOG_SYNC_FAILURE — featured items unavailable.');
        setTimeout(() => setAddError(null), 4000);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleAdd(product) {
    setAddingId(product.id);
    try {
      const updated = await addToCart(product.id, 1);
      onCartUpdate?.(updated);
    } catch (err) {
      console.error('[BuildsPage] addToCart error:', err);
      setAddError(
        err.response?.data?.error ||
        'CART_SYNC_FAILURE: stock limit reached or backend unavailable.'
      );
      setTimeout(() => setAddError(null), 4000);
    } finally {
      setAddingId(null);
    }
  }

  // Pick the first product with an image as hero, fallback to first overall
  const heroProduct =
    products.find((p) => p.image_url && (p.category || '').toLowerCase() === 'gpu') ||
    products.find((p) => p.image_url) ||
    products[0];

  const featured = products.slice(0, 4);

  return (
    <main
      data-testid="builds-page"
      className="flex-grow flex flex-col w-full"
    >
      {/* ── HERO ────────────────────────────────────────────────── */}
      <section
        className="relative w-full min-h-[600px] lg:min-h-[760px] flex items-center
                   border-b border-outline-variant bg-surface-container-lowest overflow-hidden"
        aria-labelledby="builds-hero-heading"
      >
        <div className="container mx-auto px-margin max-w-7xl relative z-10
                        grid grid-cols-1 md:grid-cols-2 gap-unit-8 items-center py-unit-12">
          {/* Left: copy + CTAs */}
          <div className="flex flex-col gap-unit-6 max-w-xl">
            <span className="font-mono text-label-md text-primary-container uppercase tracking-widest block">
              NEW ARRIVALS // 2025
            </span>
            <h1
              id="builds-hero-heading"
              className="font-inter font-bold text-[44px] md:text-[52px] leading-[1.1]
                         text-on-surface tracking-tight"
            >
              Build Your Next Rig.
            </h1>
            <p className="font-inter text-body-lg text-text-muted">
              High-performance components for uncompromising builds. Engineered
              for precision, optimized for speed. Secure your hardware stack
              today.
            </p>
            <div className="flex flex-wrap gap-unit-4 pt-unit-2">
              <button
                type="button"
                onClick={() => navigate('/products')}
                className="border border-primary-container bg-transparent text-primary-container
                           font-mono text-label-md uppercase px-unit-6 py-unit-2
                           hover:bg-primary-container hover:text-background transition-none"
              >
                [ SHOP NOW ]
              </button>
              <button
                type="button"
                onClick={() => navigate('/deals')}
                className="border border-outline-variant bg-transparent text-text-muted
                           font-mono text-label-md uppercase px-unit-6 py-unit-2
                           hover:bg-on-background hover:text-background transition-none"
              >
                [ VIEW DEALS ]
              </button>
            </div>
          </div>

          {/* Right: hero image with grayscale→color hover */}
          <div className="relative h-[300px] md:h-[400px] w-full flex justify-center items-center">
            {heroProduct?.image_url ? (
              <img
                src={heroProduct.image_url}
                alt={heroProduct.name}
                className="w-full h-full object-cover border border-outline-variant
                           filter grayscale hover:grayscale-0 transition-all duration-500"
              />
            ) : (
              <div className="w-full h-full border border-outline-variant bg-surface-container-low
                              flex items-center justify-center font-mono text-code-snippet text-text-muted">
                // ASSET_PIPELINE_BOOTING
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── BROWSE BY CATEGORY ────────────────────────────────── */}
      <section
        className="w-full py-unit-12 border-b border-outline-variant bg-surface-container"
        aria-label="Browse hardware by category"
      >
        <div className="container mx-auto px-margin max-w-7xl flex flex-col gap-unit-6">
          <span className="font-mono text-label-md text-on-surface-variant uppercase tracking-widest block">
            // BROWSE BY CATEGORY
          </span>
          <div className="flex flex-row overflow-x-auto gap-unit-4 pb-unit-4 snap-x">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.slug}
                type="button"
                onClick={() => navigate(`/products?category=${cat.slug}`)}
                className="min-w-[160px] h-[120px] bg-surface-container-low border border-outline-variant
                           flex flex-col hover:border-primary-container transition-none cursor-pointer
                           snap-start group text-left"
                data-testid={`builds-category-${cat.slug}`}
              >
                <div className="h-2/3 border-b border-outline-variant p-unit-2
                                flex justify-center items-center relative overflow-hidden
                                group-hover:border-primary-container">
                  <span
                    className="material-symbols-outlined text-4xl text-on-surface-variant
                               group-hover:text-primary-container"
                    aria-hidden="true"
                  >
                    {cat.icon}
                  </span>
                </div>
                <div className="h-1/3 flex items-center px-unit-2">
                  <span className="font-mono text-code-snippet text-on-surface">{cat.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED HARDWARE ─────────────────────────────────── */}
      <section
        className="w-full py-unit-12 border-b border-outline-variant bg-background"
        aria-label="Featured hardware"
      >
        <div className="container mx-auto px-margin max-w-7xl flex flex-col gap-unit-6">
          <div className="flex justify-between items-end">
            <span className="font-mono text-label-md text-on-surface-variant uppercase tracking-widest">
              // FEATURED HARDWARE
            </span>
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="hidden md:block border border-outline-variant bg-transparent text-text-muted
                         font-mono text-label-md uppercase px-unit-4 py-unit-1
                         hover:bg-on-background hover:text-background transition-none"
            >
              [ VIEW ALL ]
            </button>
          </div>

          {addError && (
            <div
              role="alert"
              data-testid="builds-add-error"
              className="font-mono text-code-snippet text-error
                         bg-error-container/20 border border-error/30 px-3 py-2"
            >
              {addError}
            </div>
          )}

          {loading && (
            <div className="py-12 text-center font-mono text-code-snippet text-on-surface-variant animate-pulse">
              // INIT_PRODUCT_LINK...
            </div>
          )}

          {!loading && featured.length === 0 && (
            <div className="py-12 text-center font-mono text-code-snippet text-on-surface-variant">
              // NO_FEATURED_HARDWARE — catalog is empty.
            </div>
          )}

          {!loading && featured.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-unit-4">
              {featured.map((p) => (
                <article
                  key={p.id}
                  className="bg-surface-container-low border border-outline-variant
                             flex flex-col group hover:border-primary-container transition-none"
                  data-testid="builds-featured-card"
                >
                  <Link
                    to={`/products/${p.id}`}
                    aria-label={`View ${p.name} details`}
                    className="h-[200px] border-b border-outline-variant relative
                               group-hover:border-primary-container p-unit-4
                               flex items-center justify-center"
                  >
                    {/* Stock indicator dot */}
                    <span
                      className={`absolute top-2 left-2 w-3 h-3 block ${stockDotClass(p.stock)}`}
                      title={p.stock > 0 ? `IN_STOCK: ${p.stock}` : 'OUT_OF_STOCK'}
                    />
                    {/* Category tag */}
                    <span className="absolute top-2 right-2 font-mono text-code-snippet text-on-surface-variant">
                      {categoryTag(p.category)}
                    </span>
                    {/* Product image */}
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="max-h-full max-w-full object-contain
                                   filter grayscale group-hover:grayscale-0 transition-all duration-300"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-5xl text-outline" aria-hidden="true">image</span>
                    )}
                  </Link>

                  <div className="p-unit-4 flex flex-col gap-unit-2">
                    <h3 className="font-mono text-headline-sm text-on-surface truncate" title={p.name}>
                      {p.sku || p.name}
                    </h3>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-mono text-code-snippet text-primary-container">
                        ${Number(p.price ?? 0).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAdd(p)}
                        disabled={addingId === p.id || p.stock === 0}
                        aria-label={`Add ${p.name} to cart`}
                        className="border border-outline-variant bg-transparent text-text-muted px-2 py-1
                                   hover:border-primary-container hover:text-primary-container
                                   transition-none disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined text-sm" aria-hidden="true">
                          {addingId === p.id ? 'hourglass_empty' : 'add'}
                        </span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Mobile-only VIEW ALL */}
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="md:hidden w-full border border-outline-variant bg-transparent text-text-muted
                       font-mono text-label-md uppercase px-unit-4 py-unit-4
                       hover:bg-on-background hover:text-background transition-none mt-unit-4"
          >
            [ VIEW ALL PRODUCTS ]
          </button>
        </div>
      </section>

      {/* ── PROMO BANNER ──────────────────────────────────────── */}
      <section className="w-full bg-surface py-unit-8" aria-label="Active promotion">
        <div className="container mx-auto px-margin max-w-7xl
                        flex flex-col md:flex-row items-center justify-between gap-unit-6
                        border border-outline-variant p-unit-6 bg-surface-container-low">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary-container" aria-hidden="true">local_shipping</span>
              <span className="font-mono text-code-snippet text-tertiary-container">
                STATUS: ACTIVE_PROMO
              </span>
            </div>
            <h2 className="font-mono text-headline-md text-on-surface uppercase tracking-tight">
              GLOBAL FREE SHIPPING
            </h2>
            <p className="font-inter text-body-md text-on-surface-variant">
              On all orders exceeding $500.00 USD. Terms apply.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="border border-primary-container bg-transparent text-primary-container
                       font-mono text-label-md uppercase px-unit-6 py-unit-3
                       hover:bg-primary-container hover:text-background transition-none whitespace-nowrap"
          >
            [ SHOP THE DEAL ]
          </button>
        </div>
      </section>
    </main>
  );
}
