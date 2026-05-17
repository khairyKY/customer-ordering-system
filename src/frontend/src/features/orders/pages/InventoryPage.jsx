import { useEffect, useState } from 'react';

import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';

import { inventoryApi } from '../api/ordersApi';

export default function InventoryPage() {
    const [products, setProducts] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);     // product being edited
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
        // Client-side mirror of the Pydantic padlocks (Phase 3 §2.1).
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
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
                <p className="text-sm text-gray-600">
                    Low-stock threshold: <strong>5 units</strong>
                </p>
            </div>

            {error && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2" data-testid="inventory-error">
                    {error}
                </div>
            )}

            <Card className="p-0 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500" data-testid="inventory-loading">Loading…</div>
                ) : (
                    <table className="w-full" data-testid="inventory-table">
                        <thead className="bg-gray-50">
                            <tr className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                <th className="px-4 py-3 text-left">Product</th>
                                <th className="px-4 py-3 text-left">SKU</th>
                                <th className="px-4 py-3 text-right">Stock</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((p) => (
                                <tr
                                    key={p.id}
                                    className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                                    data-testid="product-row"
                                    data-low-stock={p.low_stock ? 'true' : 'false'}
                                >
                                    <td className="px-4 py-3">{p.name}</td>
                                    <td className="px-4 py-3">
                                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{p.sku}</code>
                                    </td>
                                    <td className="px-4 py-3 text-right" data-testid={`stock-${p.id}`}>{p.stock}</td>
                                    <td className="px-4 py-3">
                                        {p.low_stock ? (
                                            <span
                                                className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800"
                                                data-testid={`low-stock-${p.id}`}
                                            >
                                                LOW STOCK
                                            </span>
                                        ) : (
                                            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                                OK
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button
                                            variant="secondary"
                                            onClick={() => beginEdit(p)}
                                            className="text-sm"
                                        >
                                            <span data-testid={`edit-${p.id}`}>Update stock</span>
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Card>

            {editing && (
                <div
                    className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
                    onClick={cancelEdit}
                >
                    <div
                        className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 flex flex-col gap-4"
                        onClick={(e) => e.stopPropagation()}
                        data-testid="stock-modal"
                    >
                        <h2 className="text-lg font-bold text-gray-900">
                            Update stock — {editing.name}
                        </h2>
                        <Input
                            label="New stock quantity (0 – 100,000)"
                            type="number"
                            value={stockInput}
                            min={0}
                            max={100_000}
                            step={1}
                            autoFocus
                            onChange={(e) => setStockInput(e.target.value)}
                            error={fieldError}
                            data-testid="stock-input"
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="secondary" disabled={submitting} onClick={cancelEdit}>
                                Cancel
                            </Button>
                            <Button variant="primary" disabled={submitting} onClick={saveStock}>
                                <span data-testid="stock-save">
                                    {submitting ? 'Saving…' : 'Save'}
                                </span>
                            </Button>
                        </div>
                        {fieldError && (
                            <p className="text-xs text-red-500" data-testid="stock-error">{fieldError}</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
