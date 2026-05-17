import React, { useState, useEffect } from 'react';
import { fetchCart, updateCartItem, removeCartItem } from '../api/cartApi';
import NeonButton from './ui/NeonButton';

const CartWidget = ({ cart, onCartUpdate }) => {
  const [loading, setLoading] = useState(!cart);

  const loadCart = async () => {
    try {
      const data = await fetchCart();
      if (data) onCartUpdate(data);
    } catch (error) {
      console.error('Cart sync failure', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const handleUpdate = async (id, qty) => {
    try {
      const updated = await updateCartItem(id, qty);
      onCartUpdate(updated);
    } catch (err) { alert('Stock limit reached or sync error'); }
  };

  const handleRemove = async (id) => {
    const updated = await removeCartItem(id);
    onCartUpdate(updated);
  };

  if (loading) return <div className="p-4 border border-cyan-900 animate-pulse text-xs">RETR_CART_DATA...</div>;

  return (
    <div className="border-l-2 border-cyan-600 bg-black/40 p-6 flex flex-col gap-6">
      <h2 className="text-lg font-bold tracking-widest text-white border-b border-gray-800 pb-2">> _CART</h2>
      
      {cart.items.length === 0 ? (
        <div className="py-8 text-center text-gray-600 text-xs">EMPTY_BUFFER</div>
      ) : (
        <ul className="flex flex-col gap-4">
          {cart.items.map(item => (
            <li key={item.id} className="border-b border-gray-900 pb-2">
              <div className="text-xs font-bold">{item.product_name}</div>
              <div className="flex justify-between items-center mt-1">
                <div className="flex gap-2 items-center bg-gray-900 px-2 py-0.5">
                  <button onClick={() => handleUpdate(item.product_id, item.quantity - 1)} className="hover:text-cyan-400">-</button>
                  <span className="text-cyan-400 font-bold">{item.quantity}</span>
                  <button onClick={() => handleUpdate(item.product_id, item.quantity + 1)} className="hover:text-cyan-400">+</button>
                </div>
                <div className="flex gap-4 items-center">
                  <span className="text-xs">${item.total_price.toFixed(2)}</span>
                  <button onClick={() => handleRemove(item.product_id)} className="text-red-500 hover:bg-red-950 p-1 text-[10px]">REMOVE</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 pt-4 border-t border-gray-800 text-xs space-y-1">
        <div className="flex justify-between"><span>SUBTOTAL</span><span>${cart.subtotal.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>TAX_10%</span><span>${cart.tax.toFixed(2)}</span></div>
        <div className="flex justify-between text-cyan-400 font-bold text-base mt-2"><span>TOTAL</span><span>${cart.total.toFixed(2)}</span></div>
      </div>

      <NeonButton onClick={() => alert('Routing to Payment...')} disabled={cart.items.length === 0} fullWidth className="mt-4">
        EXECUTE_CHECKOUT
      </NeonButton>
    </div>
  );
};

export default CartWidget;
