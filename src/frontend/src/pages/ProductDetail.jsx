// ============================================================
// ProductDetail — Dev-Cosmic Single Product View (Zone 1)
// Stitch source: lines 891..1131 / 2120..2369 of all_of_the_frontend.txt
//
// Layout:
//   [ Breadcrumb     ]
//   [ Image panel | Info panel ─ specs + QTY + ADD TO CART ]
//   [ Compatibility note                              ]
//
// API:  fetchProducts() then find by id (no GET /products/:id yet —
//       Member A's catalog only exposes the full list)
//       addToCart()
// ============================================================

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import NeonButton    from '../components/ui/NeonButton';
import TerminalInput from '../components/ui/TerminalInput';

import { fetchProducts } from '../api/productApi';
import { addToCart }     from '../api/cartApi';

export default function ProductDetail({ onCartUpdate }) {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [product, setProduct] = useState(null);
  const [error,   setError]   = useState(null);
  const [qty,     setQty]     = useState(1);
  const [adding,  setAdding]  = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const products = await fetchProducts();
        const found = products.find((p) => String(p.id) === String(id));
        if (!found) {
          setError('Product not found');
        } else {
          setProduct(found);
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
      <div className="p-8" data-testid="product-detail-error">
        <Link to="/products" className="font-mono text-[13px] text-primary-container hover:underline">
          ← Back to catalog
        </Link>
        <p className="font-mono text-[13px] text-error mt-4">{error}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-8 font-mono text-[13px] text-text-muted" data-testid="product-detail-loading">
        // Resolving product...
      </div>
    );
  }

  const inStock = product.stock > 0;

  return (
    <div className="max-w-6xl mx-auto p-8 flex flex-col gap-6" data-testid="product-detail">
      {/* Breadcrumb */}
      <nav className="font-mono text-[13px] text-text-muted">
        <Link to="/" className="hover:text-white">~</Link>
        <span className="mx-2">/</span>
        <Link to="/products" className="hover:text-white">products</Link>
        <span className="mx-2">/</span>
        <span className="text-on-background">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="border border-outline-variant bg-surface-container-low aspect-square flex items-center justify-center overflow-hidden">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <span className="font-mono text-[13px] text-text-muted">// NO_IMAGE</span>
          )}
        </div>

        {/* Info panel */}
        <div className="flex flex-col gap-4">
          <h1 className="font-mono text-[28px] font-bold text-on-background" data-testid="product-detail-name">
            {product.name}
          </h1>
          <p className="font-mono text-[13px] text-text-muted">{product.description || '// No description'}</p>

          <div className="font-mono text-[36px] font-bold text-primary-container" data-testid="product-detail-price">
            ${Number(product.price).toFixed(2)}
          </div>

          {/* Spec table */}
          <table className="w-full font-mono text-[13px] border border-outline-variant">
            <tbody>
              <tr className="border-b border-outline-variant">
                <td className="px-3 py-2 text-text-muted uppercase">SKU</td>
                <td className="px-3 py-2 text-on-background">{product.sku || product.id}</td>
              </tr>
              <tr className="border-b border-outline-variant">
                <td className="px-3 py-2 text-text-muted uppercase">Stock</td>
                <td className="px-3 py-2 text-on-background" data-testid="product-detail-stock">
                  {product.stock}
                </td>
              </tr>
              {product.category && (
                <tr>
                  <td className="px-3 py-2 text-text-muted uppercase">Category</td>
                  <td className="px-3 py-2 text-on-background">{product.category}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* QTY + Add to cart */}
          <div className="flex items-end gap-3">
            <div className="w-32">
              <label className="font-mono text-[12px] text-text-muted uppercase">QTY</label>
              <TerminalInput
                type="number"
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                min={1}
                max={product.stock}
                textAlign="right"
              />
            </div>
            <NeonButton
              variant="primary"
              disabled={!inStock || adding}
              onClick={handleAdd}
              className="flex-1"
            >
              <span data-testid="product-detail-add">
                {!inStock ? '[ OUT_OF_STOCK ]' : adding ? '[ ADDING... ]' : '[ ADD TO CART ]'}
              </span>
            </NeonButton>
          </div>

          {/* Compatibility note */}
          <p className="font-mono text-[12px] text-text-muted border-l-2 border-primary-container pl-3">
            // COMPATIBILITY: verify socket / form-factor before purchase.
          </p>
        </div>
      </div>
    </div>
  );
}
