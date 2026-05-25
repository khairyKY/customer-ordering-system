import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import NeonButton    from '../components/ui/NeonButton';
import TerminalInput from '../components/ui/TerminalInput';
import CosmicCanvas  from '../components/CosmicCanvas';
import LiquidCard    from '../components/ui/LiquidCard';

import { fetchProducts } from '../api/productApi';
import { addToCart }     from '../api/cartApi';

// ── Per-category diagnostic readout schema ────────────────────────
// Spec source: stitch_terminal_hardware_store/all_of_the_frontend.txt
// (RTX 4080 SUPER detail page, lines 1076–1102) shows a multi-row
// spec table (VRAM / MEMORY_BUS / BOOST_CLOCK / TDP / PCIE_SLOT /
// DISPLAY_OUT). Each category maps to the field set it actually
// publishes; the renderer skips any missing field gracefully.
const SPEC_FIELDS = {
  gpu: [
    { key: 'vram',            label: 'VRAM' },
    { key: 'memory_bus',      label: 'MEMORY_BUS' },
    { key: 'boost_clock',     label: 'BOOST_CLOCK' },
    { key: 'tdp',             label: 'TDP' },
    { key: 'pcie_slot',       label: 'PCIE_SLOT' },
    { key: 'display_outputs', label: 'DISPLAY_OUT' },
  ],
  cpu: [
    { key: 'cores',       label: 'CORES' },
    { key: 'threads',     label: 'THREADS' },
    { key: 'base_clock',  label: 'BASE_CLOCK' },
    { key: 'boost_clock', label: 'BOOST_CLOCK' },
    { key: 'tdp',         label: 'TDP' },
    { key: 'socket',      label: 'SOCKET' },
  ],
  motherboard: [
    { key: 'chipset',     label: 'CHIPSET' },
    { key: 'socket',      label: 'SOCKET' },
    { key: 'form_factor', label: 'FORM_FACTOR' },
    { key: 'ram_slots',   label: 'RAM_SLOTS' },
    { key: 'pcie_slots',  label: 'PCIE_SLOTS' },
  ],
  memory: [
    { key: 'capacity', label: 'CAPACITY' },
    { key: 'speed',    label: 'SPEED' },
    { key: 'latency',  label: 'CL' },
    { key: 'modules',  label: 'MODULES' },
    { key: 'voltage',  label: 'VOLTAGE' },
  ],
  storage: [
    { key: 'capacity',    label: 'CAPACITY' },
    { key: 'interface',   label: 'INTERFACE' },
    { key: 'read_speed',  label: 'READ_MB/S' },
    { key: 'write_speed', label: 'WRITE_MB/S' },
    { key: 'form_factor', label: 'FORM_FACTOR' },
  ],
};

// Compatibility / install notes shown below the spec table.
// Lifted from the spec's "info" callout on the GPU detail page.
const COMPAT_NOTES = {
  gpu:         'Requires PCIe 4.0 x16 slot and 750W+ PSU. Ensure case clearance for 3-slot width.',
  cpu:         'Verify socket compatibility with motherboard and confirm adequate CPU cooling.',
  motherboard: 'Confirm CPU socket compatibility and case form-factor support before purchase.',
  memory:      'Check motherboard QVL list for guaranteed stability at the rated speed.',
  storage:     'Confirm motherboard M.2 slot generation matches the drive interface.',
};

export default function ProductDetail({ onCartUpdate }) {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [product, setProduct] = useState(null);
  const [error,   setError]   = useState(null);           // fatal page error (early-return)
  const [addError, setAddError] = useState(null);          // soft inline error (cart actions)
  const [qty,     setQty]     = useState(1);
  const [adding,  setAdding]  = useState(false);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const products = await fetchProducts();
        const found = products.find((p) => String(p.id) === String(id));
        if (!found) {
          setError('Product not found');
        } else {
          setProduct(found);
          // Get 3 related products
          const rel = products.filter((p) => p.category === found.category && p.id !== found.id).slice(0, 3);
          setRelated(rel);
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load product');
      }
    })();
  }, [id]);

  async function handleAdd() {
    if (!product || qty < 1) return;
    setAdding(true);
    try {
      const updated = await addToCart(product.id, qty);
      onCartUpdate?.(updated);
      navigate('/cart');
    } catch (err) {
      // Soft error — don't trigger the fatal page-level early-return.
      setAddError(err.response?.data?.error || 'Could not add to cart');
      setTimeout(() => setAddError(null), 4000);
    } finally {
      setAdding(false);
    }
  }

  if (error) {
    return (
      <div className="p-8 relative min-h-[60vh] flex flex-col items-center justify-center">
        <p className="font-mono text-[16px] text-error mb-4">[ ERROR: {error} ]</p>
        <Link to="/products" className="font-mono text-[13px] text-primary-container hover:underline">
          &gt; RETURN TO CATALOG
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-8 min-h-[60vh] flex items-center justify-center">
        <div className="font-mono text-[14px] text-text-muted animate-pulse">
          // INITIALIZING_ASSET_PIPELINE...
        </div>
      </div>
    );
  }

  const inStock = product.stock > 0;

  return (
    <div className="relative w-full pb-24">
      {/* Dynamic background effect for this page */}
      <CosmicCanvas variant="ambient" />
      
      <div className="relative z-10 max-w-[1280px] mx-auto px-margin pt-8 flex flex-col gap-8">
        
        {/* Breadcrumb */}
        <nav className="font-mono text-[13px] text-text-muted uppercase tracking-wider mb-2">
          <Link to="/" className="hover:text-white transition-colors">TERMINAL</Link>
          <span className="mx-2 text-primary-container">/</span>
          <Link to="/products" className="hover:text-white transition-colors">CATALOG</Link>
          <span className="mx-2 text-primary-container">/</span>
          <span className="text-on-background">{product.name}</span>
        </nav>

        {/* Main Product Showcase - Glassmorphism Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: High-Res Image Showcase (spec ratio: 5/12) */}
          <div className="lg:col-span-5 flex flex-col gap-unit-2">
            <div className="border border-outline-variant bg-surface-dark/80 backdrop-blur-xl aspect-[4/3] flex items-center justify-center relative overflow-hidden group">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 ease-in-out"
                />
              ) : (
                <span className="font-mono text-[13px] text-text-muted">// ASSET_MISSING</span>
              )}

              {/* Overlay grid lines (aesthetic) */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

              {/* Stock status badge */}
              <div className={`absolute top-4 left-4 border ${inStock ? 'border-accent-green text-accent-green' : 'border-error text-error'} bg-background/90 backdrop-blur-md px-3 py-1 font-mono text-[12px] uppercase`}>
                {inStock ? `[ IN_STOCK: ${product.stock} ]` : '[ DEPLETED ]'}
              </div>
            </div>

            {/* Thumbnail row (spec: 4 slots — active main + 3 view-type
                placeholders). The placeholders are visual-only until
                multi-image catalog support lands. */}
            <div className="grid grid-cols-4 gap-unit-2" aria-label="Image gallery thumbnails">
              <button
                type="button"
                aria-label="Main product image"
                aria-pressed="true"
                className="border border-primary-container h-[80px] bg-surface-container-low overflow-hidden flex items-center justify-center"
              >
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="material-symbols-outlined text-outline" aria-hidden="true">image</span>
                )}
              </button>

              {[
                { icon: 'photo_camera', label: 'Alt photo' },
                { icon: '3d_rotation',  label: '3D rotation' },
                { icon: 'cable',        label: 'Connections diagram' },
              ].map((slot) => (
                <button
                  key={slot.icon}
                  type="button"
                  disabled
                  aria-label={`${slot.label} (coming soon)`}
                  title="Additional views coming soon"
                  className="border border-outline-variant h-[80px] bg-surface-container-low
                             flex items-center justify-center text-outline
                             hover:border-primary-container transition-none
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined" aria-hidden="true">{slot.icon}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Info Panel (spec ratio: 7/12) */}
          <div className="lg:col-span-7 flex flex-col gap-6 p-6 border border-outline-variant bg-surface-container-low/60 backdrop-blur-xl h-full">
            <div>
              <div className="font-mono text-[12px] text-primary-container uppercase tracking-widest mb-2">
                // {product.category || 'HARDWARE'}
              </div>
              <h1 className="font-inter text-[32px] md:text-[40px] font-bold text-white leading-tight uppercase tracking-tight">
                {product.name}
              </h1>
              <p className="font-mono text-[14px] text-text-muted mt-4 leading-relaxed">
                {product.description || 'Advanced hardware component built for next-generation compute tasks.'}
              </p>
            </div>

            <div className="h-px w-full bg-outline-variant" />

            {/* Price block */}
            <div className="flex items-end justify-between">
              <div className="font-mono text-[48px] font-bold text-primary-container leading-none">
                ${Number(product.price).toFixed(2)}
              </div>
              <div className="font-mono text-[12px] text-text-muted pb-2 uppercase">
                / UNIT
              </div>
            </div>

            {/* ── Hardware Specs Block ─────────────────────────
                Category-driven multi-row readout. Falls back to a
                generic single-row table when the product's category
                isn't in SPEC_FIELDS (or fields are missing). */}
            {(() => {
              const categoryKey = (product.category || '').toLowerCase();
              const fields      = SPEC_FIELDS[categoryKey] || [];
              const presentRows = fields.filter((f) => product[f.key] != null && product[f.key] !== '');
              const compatNote  = COMPAT_NOTES[categoryKey];

              return (
                <div>
                  <div className="bg-background/50 border border-outline-variant p-4">
                    <div className="font-mono text-[11px] text-text-muted uppercase mb-3 border-b border-outline-variant pb-2">
                      &gt;_ DIAGNOSTIC_READOUT
                    </div>
                    <table className="w-full font-mono text-[13px]" data-testid="spec-table">
                      <tbody>
                        <tr>
                          <td className="py-1 text-text-muted w-1/3">SKU_ID</td>
                          <td className="py-1 text-white text-right truncate">
                            {product.sku || String(product.id).split('-')[0]}
                          </td>
                        </tr>

                        {presentRows.length > 0 ? (
                          presentRows.map((field) => (
                            <tr key={field.key}>
                              <td className="py-1 text-text-muted w-1/3">{field.label}</td>
                              <td className="py-1 text-white text-right">{String(product[field.key])}</td>
                            </tr>
                          ))
                        ) : product.spec_snippet ? (
                          <tr>
                            <td className="py-1 text-text-muted w-1/3">CORE_SPEC</td>
                            <td className="py-1 text-white text-right">{product.spec_snippet}</td>
                          </tr>
                        ) : null}

                        <tr>
                          <td className="py-1 text-text-muted w-1/3">CATEGORY</td>
                          <td className="py-1 text-primary-container text-right uppercase">
                            {product.category || 'HARDWARE'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Compatibility / install note (per spec) */}
                  {compatNote && (
                    <div className="flex items-start gap-unit-2 mt-unit-2 px-1 text-outline font-mono text-code-snippet">
                      <span className="material-symbols-outlined text-[16px] mt-[2px]" aria-hidden="true">info</span>
                      <span>{compatNote}</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {addError && (
              <div
                role="alert"
                data-testid="product-add-error"
                className="font-mono text-code-snippet text-error
                           bg-error-container/20 border border-error/30 px-3 py-2"
              >
                {addError}
              </div>
            )}

            <div className="mt-auto pt-6 flex flex-col sm:flex-row gap-4 items-end">
              <div className="w-full sm:w-24">
                <label className="block font-mono text-[11px] text-text-muted mb-2 uppercase tracking-widest">
                  QTY
                </label>
                <TerminalInput
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                  min={1}
                  max={product.stock || 1}
                  textAlign="center"
                  className="!h-[48px] !text-[16px]"
                />
              </div>
              <NeonButton
                variant="primary"
                disabled={!inStock || adding}
                onClick={handleAdd}
                className="w-full h-[48px] !text-[14px]"
              >
                {!inStock ? '[ OUT_OF_STOCK ]' : adding ? '[ PROCESSING... ]' : '[ ADD TO CART ]'}
              </NeonButton>
            </div>
          </div>
        </div>

        {/* Related Products via LiquidCard */}
        {related.length > 0 && (
          <div className="mt-16 pt-8 border-t border-outline-variant">
            <h2 className="font-mono text-[18px] text-white mb-6 uppercase">
              // RELATED_CONFIGURATIONS
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map(r => (
                <LiquidCard
                  key={r.id}
                  category={`// ${(r.category || 'HARDWARE').toUpperCase()}`}
                  title={r.name}
                  price={`$${Number(r.price).toFixed(2)}`}
                  imageSrc={r.image_url}
                  imageAlt={r.name}
                  stock={r.stock > 0 ? (r.stock < 5 ? 'low_stock' : 'in_stock') : 'out_stock'}
                  onAdd={async () => {
                     try {
                        const updated = await addToCart(r.id, 1);
                        onCartUpdate?.(updated);
                        navigate('/cart');
                     } catch (e) {
                        setAddError(e.response?.data?.error || 'Could not add related item to cart');
                        setTimeout(() => setAddError(null), 4000);
                     }
                  }}
                  className="cursor-pointer"
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
