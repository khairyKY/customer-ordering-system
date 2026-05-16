import { useEffect, useState } from 'react';

import { inventoryApi } from '../api/ordersApi';

export default function InventoryPage() {
    const [products, setProducts] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null); // product object being edited
    const [stockInput, setStockInput] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [fieldError, setFieldError] = useState(null);

    async function load() {
        setLoading(true);
        try {
            const data = await inventoryApi.list();
            setProducts(data.products);
        } catch (err) {
            setError(err.response?.data?.detail?.error || 'Failed to load inventory');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    function beginEdit(product) {
        setEditing(product);
        setStockInput(String(product.stock));
        setFieldError(null);
    }

    function cancelEdit() {
        setEditing(null);
        setStockInput('');
        setFieldError(null);
    }

    async function saveStock() {
        // Client-side mirror of the server padlocks (Phase 3 §2.1).
        const value = Number(stockInput);
        if (!Number.isInteger(value)) {
            setFieldError('Must be a whole number');
            return;
        }
        if (value < 0) {
            setFieldError('Must be >= 0');
            return;
        }
        if (value > 100_000) {
            setFieldError('Must be <= 100,000');
            return;
        }

        setSubmitting(true);
        setFieldError(null);
        try {
            await inventoryApi.updateStock(editing.id, value);
            await load();
            cancelEdit();
        } catch (err) {
            const detail = err.response?.data?.detail || err.response?.data;
            setFieldError(detail?.error || 'Update failed');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="page">
            <header className="page__header">
                <h1>Inventory</h1>
                <p>Low-stock threshold: <strong>5 units</strong></p>
            </header>

            {error && <div className="error" data-testid="inventory-error">{error}</div>}

            {loading ? (
                <div data-testid="inventory-loading">Loading…</div>
            ) : (
                <table className="inventory-table" data-testid="inventory-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>SKU</th>
                            <th>Stock</th>
                            <th>Status</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((p) => (
                            <tr
                                key={p.id}
                                data-testid="product-row"
                                data-low-stock={p.low_stock ? 'true' : 'false'}
                            >
                                <td>{p.name}</td>
                                <td><code>{p.sku}</code></td>
                                <td data-testid={`stock-${p.id}`}>{p.stock}</td>
                                <td>
                                    {p.low_stock ? (
                                        <span className="status-badge" style={{ background: '#fee2e2', color: '#7f1d1d' }} data-testid={`low-stock-${p.id}`}>
                                            LOW STOCK
                                        </span>
                                    ) : (
                                        <span className="status-badge" style={{ background: '#dcfce7', color: '#14532d' }}>
                                            OK
                                        </span>
                                    )}
                                </td>
                                <td>
                                    <button onClick={() => beginEdit(p)} data-testid={`edit-${p.id}`}>
                                        Update stock
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {editing && (
                <div className="modal-backdrop" onClick={cancelEdit}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} data-testid="stock-modal">
                        <h2>Update stock — {editing.name}</h2>
                        <label>
                            New stock quantity (0 – 100,000)
                            <input
                                type="number"
                                value={stockInput}
                                min={0}
                                max={100_000}
                                step={1}
                                onChange={(e) => setStockInput(e.target.value)}
                                autoFocus
                                data-testid="stock-input"
                            />
                        </label>
                        {fieldError && <div className="error" data-testid="stock-error">{fieldError}</div>}
                        <div className="modal__actions">
                            <button onClick={cancelEdit} disabled={submitting}>Cancel</button>
                            <button onClick={saveStock} disabled={submitting} data-testid="stock-save">
                                {submitting ? 'Saving…' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
