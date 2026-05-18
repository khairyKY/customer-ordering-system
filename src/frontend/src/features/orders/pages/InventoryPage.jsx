import { useEffect, useState } from 'react';

import { inventoryApi } from '../api/ordersApi';
import NeonButton from '../../../components/ui/NeonButton';
import TerminalInput from '../../../components/ui/TerminalInput';

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
        <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 w-full p-8">
            {/* Page Header */}
            <div>
                <h1 className="font-mono text-[32px] font-bold text-[#e5e2e1] mb-2">INVENTORY MANAGEMENT</h1>
                <p className="font-mono text-[13px] text-[#87929b]">
                    // LOW_STOCK_THRESHOLD: 5 | SYS_STATUS: OPTIMAL
                </p>
            </div>

            {error && (
                <div className="font-mono text-[13px] text-[#ffb4ab] bg-[#93000a]/20 border border-[#ffb4ab]/30 px-3 py-2" data-testid="inventory-error">
                    {error}
                </div>
            )}

            {/* Inventory Table */}
            <div className="border border-[#3d4850] bg-[#201f1f] overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center font-mono text-[13px] text-[#87929b]" data-testid="inventory-loading">
                        Loading inventory data...
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse" data-testid="inventory-table">
                        <thead>
                            <tr className="border-b border-[#3d4850] bg-[#2a2a2a]">
                                <th className="p-3 font-mono text-[12px] text-[#87929b] uppercase">Product</th>
                                <th className="p-3 font-mono text-[12px] text-[#87929b] uppercase">SKU</th>
                                <th className="p-3 font-mono text-[12px] text-[#87929b] uppercase text-right">Stock</th>
                                <th className="p-3 font-mono text-[12px] text-[#87929b] uppercase">Status</th>
                                <th className="p-3 font-mono text-[12px] text-[#87929b] uppercase text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="font-mono text-[13px]">
                            {products.map((p) => (
                                <tr
                                    key={p.id}
                                    className="border-b border-[#3d4850] hover:bg-[#353534]"
                                    data-testid="product-row"
                                    data-low-stock={p.low_stock ? 'true' : 'false'}
                                >
                                    <td className="p-3 text-[#e5e2e1]">{p.name}</td>
                                    <td className="p-3">
                                        <code className="text-[11px] text-[#8fd6ff] bg-[#131313] border border-[#3d4850] px-2 py-1">{p.sku}</code>
                                    </td>
                                    <td className="p-3 text-right text-[#e5e2e1]" data-testid={`stock-${p.id}`}>{p.stock}</td>
                                    <td className="p-3">
                                        {p.low_stock ? (
                                            <span
                                                className="text-[#ffb4ab] px-2 py-1 bg-[#ffb4ab]/10 border border-[#ffb4ab]/30 text-[10px] uppercase tracking-wider"
                                                data-testid={`low-stock-${p.id}`}
                                            >
                                                LOW_STOCK
                                            </span>
                                        ) : (
                                            <span className="text-[#2ecc64] px-2 py-1 bg-[#2ecc64]/10 border border-[#2ecc64]/30 text-[10px] uppercase tracking-wider">
                                                IN_STOCK
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-3 text-right">
                                        <NeonButton
                                            variant="secondary"
                                            onClick={() => beginEdit(p)}
                                        >
                                            <span data-testid={`edit-${p.id}`}>[ UPDATE ]</span>
                                        </NeonButton>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Edit Modal */}
            {editing && (
                <div
                    className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                    onClick={cancelEdit}
                >
                    <div
                        className="bg-[#131313] border border-[#3d4850] w-full max-w-md p-6 flex flex-col gap-4"
                        onClick={(e) => e.stopPropagation()}
                        data-testid="stock-modal"
                    >
                        <h2 className="font-mono text-[18px] font-semibold text-[#e5e2e1]">
                            Update stock — <span className="text-[#00bfff]">{editing.name}</span>
                        </h2>

                        <div className="flex flex-col gap-2">
                            <label className="font-mono text-[13px] text-[#87929b]">New stock quantity (0 – 100,000)</label>
                            <TerminalInput
                                type="number"
                                value={stockInput}
                                onChange={(e) => setStockInput(e.target.value)}
                                placeholder="0"
                                ariaLabel="Stock quantity"
                                data-testid="stock-input"
                            />
                        </div>

                        {fieldError && (
                            <p className="font-mono text-[13px] text-[#ffb4ab]" data-testid="stock-error">{fieldError}</p>
                        )}

                        <div className="flex justify-end gap-2">
                            <NeonButton variant="secondary" disabled={submitting} onClick={cancelEdit}>
                                [ CANCEL ]
                            </NeonButton>
                            <NeonButton variant="primary" disabled={submitting} onClick={saveStock}>
                                <span data-testid="stock-save">
                                    {submitting ? '[ SAVING... ]' : '[ SAVE ]'}
                                </span>
                            </NeonButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
