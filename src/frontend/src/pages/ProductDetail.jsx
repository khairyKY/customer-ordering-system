import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import NeonButton    from '../components/ui/NeonButton';
import TerminalInput from '../components/ui/TerminalInput';
import CosmicCanvas  from '../components/CosmicCanvas';
import LiquidCard    from '../components/ui/LiquidCard';

import { fetchProducts } from '../api/productApi';
import { addToCart }     from '../api/cartApi';

export default function ProductDetail({ onCartUpdate }) {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [product, setProduct] = useState(null);
  const [error,   setError]   = useState(null);
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
      setError(err.response?.data?.error || 'Could not add to cart');
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
          
          {/* Left: High-Res Image Showcase */}
          <div className="lg:col-span-7 border border-outline-variant bg-surface-dark/80 backdrop-blur-xl aspect-[4/3] flex items-center justify-center relative overflow-hidden group">
            {product.image_url ? (
              <img 
                src={product.image_url} 
                alt={product.name} 
                className="w-full h-full object-contain p-6 grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 ease-in-out group-hover:scale-105" 
              />
            ) : (
              <span className="font-mono text-[13px] text-text-muted">// ASSET_MISSING</span>
            )}
            
            {/* Overlay Grid lines for aesthetic */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
            
            {/* Status Badge */}
            <div className={`absolute top-4 left-4 border ${inStock ? 'border-[#22C55E] text-[#22C55E]' : 'border-error text-error'} bg-background/90 backdrop-blur-md px-3 py-1 font-mono text-[12px] uppercase`}>
               {inStock ? `[ IN_STOCK: ${product.stock} ]` : '[ DEPLETED ]'}
            </div>
          </div>

          {/* Right: Info Panel */}
          <div className="lg:col-span-5 flex flex-col gap-6 p-6 border border-outline-variant bg-surface-container-low/60 backdrop-blur-xl h-full">
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

            {/* Hardware Specs Block */}
            <div className="bg-background/50 border border-outline-variant p-4">
              <div className="font-mono text-[11px] text-text-muted uppercase mb-3 border-b border-outline-variant pb-2">
                &gt;_ DIAGNOSTIC_READOUT
              </div>
              <table className="w-full font-mono text-[13px]">
                <tbody>
                  <tr className="group">
                    <td className="py-1 text-text-muted w-1/3">SKU_ID</td>
                    <td className="py-1 text-white text-right truncate">{product.sku || product.id.split('-')[0]}</td>
                  </tr>
                  {product.spec_snippet && (
                    <tr className="group mt-2">
                      <td className="py-1 text-text-muted w-1/3">CORE_SPEC</td>
                      <td className="py-1 text-white text-right">{product.spec_snippet}</td>
                    </tr>
                  )}
                  {product.specs && typeof product.specs === 'object' && Object.entries(product.specs).map(([key, val]) => {
                    if (key === 'brand' || key === 'model') return null;
                    return (
                      <tr key={key} className="group mt-2">
                        <td className="py-1 text-text-muted w-1/3 uppercase">{key.replace('_', ' ')}</td>
                        <td className="py-1 text-white text-right">{val}</td>
                      </tr>
                    );
                  })}
                  <tr className="group mt-2">
                    <td className="py-1 text-text-muted w-1/3">COMPATIBILITY</td>
                    <td className="py-1 text-primary-container text-right">UNIVERSAL</td>
                  </tr>
                </tbody>
              </table>
            </div>

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
                  href={`/products/${r.id}`}
                  expandData={r}
                  category={`// ${(r.category || 'HARDWARE').toUpperCase()}`}
                  title={r.name}
                  price={`$${Number(r.price).toFixed(2)}`}
                  imageSrc={r.image_url}
                  imageAlt={r.name}
                  stock={r.stock > 0 ? (r.stock < 5 ? 'low_stock' : 'in_stock') : 'out_stock'}
                  onAdd={async (qty = 1) => {
                     try {
                        const updated = await addToCart(r.id, qty);
                        onCartUpdate?.(updated);
                        navigate('/cart');
                     } catch(e) {
                        alert('Could not add to cart');
                     }
                  }}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
