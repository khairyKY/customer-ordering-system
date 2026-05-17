import React, { useState, useEffect } from 'react';
import { fetchProducts } from '../api/productApi';
import { addToCart } from '../api/cartApi';
import LiquidCard from './ui/LiquidCard';

const ProductGrid = ({ onCartUpdate }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts();
        if (data) setProducts(data);
      } catch (error) {
        console.error('Catalog fetch error', error);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  if (loading) return <div className="p-12 text-center text-cyan-700 animate-pulse font-mono">INIT_PRODUCT_LINK...</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {products.map(p => (
        <LiquidCard
          key={p.id}
          category="// HARDWARE"
          title={p.name}
          price={`$${p.price.toFixed(2)}`}
          imageSrc={p.image_url}
          onAdd={async () => {
            try {
              const updated = await addToCart(p.id);
              onCartUpdate(updated);
            } catch (err) { alert('Stock limit reached'); }
          }}
        />
      ))}
    </div>
  );
};

export default ProductGrid;
