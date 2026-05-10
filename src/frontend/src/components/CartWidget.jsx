import React, { useState, useEffect } from 'react';
import { fetchCart, addToCart } from '../api/cartApi';

const CartWidget = () => {
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadCart = async () => {
        try {
            const data = await fetchCart();
            setCart(data);
        } catch (error) {
            console.error("Failed to load cart", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCart();
    }, []);

    const handleAddTestItem = async () => {
        const testProduct = {
            product_id: "prod-001",
            product_name: "Master Engineering Pencil",
            unit_price: 15.00,
            quantity: 1
        };

        try {
            const updatedCart = await addToCart(testProduct);
            setCart(updatedCart);
        } catch (error) {
            console.error("Failed to add item", error);
        }
    };

    if (loading) return <div>Loading Cart...</div>;
    if (!cart) return <div>Error loading cart state.</div>;

    return (
        <div style={{ border: '2px solid #333', padding: '1rem', borderRadius: '8px', maxWidth: '400px' }}>
            <h2>Shopping Cart (Sprint 1 Slice)</h2>
            {cart.items.length === 0 ? (
                <p>Your cart is empty.</p>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {cart.items.map(item => (
                        <li key={item.id} style={{ marginBottom: '0.5rem', borderBottom: '1px solid #eee' }}>
                            {item.product_name} x {item.quantity} - ${item.total_price.toFixed(2)}
                        </li>
                    ))}
                </ul>
            )}
            
            <div style={{ marginTop: '1rem', fontWeight: 'bold' }}>
                <div>Subtotal: ${cart.subtotal.toFixed(2)}</div>
                <div>Tax (8%): ${cart.tax.toFixed(2)}</div>
                <div style={{ fontSize: '1.2rem', color: '#d32f2f' }}>Total: ${cart.total.toFixed(2)}</div>
            </div>

            <button 
                onClick={handleAddTestItem}
                style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px' }}
            >
                Add Test Item ($15.00)
            </button>
        </div>
    );
};

export default CartWidget;
