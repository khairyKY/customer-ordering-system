import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { ordersApi } from '../api/ordersApi';
import StatusBadge from '../components/StatusBadge';
import NeonButton from '../../../components/ui/NeonButton';

// Phase 2 §3.2.2 — show only transitions legal FROM the current status.
const LEGAL_NEXT = {
    PENDING:    ['CONFIRMED', 'CANCELLED'],
    CONFIRMED:  ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['SHIPPED', 'CANCELLED'],
    SHIPPED:    ['DELIVERED'],
    DELIVERED:  ['REFUNDED'],
    CANCELLED:  [],
    REFUNDED:   [],
};

// Cancellation should look destructive; everything else is forward progress.
const variantFor = (next) => (next === 'CANCELLED' ? 'danger' : 'primary');

export default function OrderDetailPage() {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [error, setError] = useState(null);
    const [updating, setUpdating] = useState(false);

    async function load() {
        try {
            const data = await ordersApi.getById(id);
            setOrder(data);
        } catch (err) {
            setError(err.response?.status === 404 ? 'Order not found' : 'Failed to load order');
        }
    }

    useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

    async function changeStatus(newStatus) {
        setUpdating(true);
        setError(null);
        try {
            await ordersApi.updateStatus(id, newStatus);
            await load();
        } catch (err) {
            const detail = err.response?.data?.detail || err.response?.data;
            setError(detail?.error || 'Status update failed');
        } finally {
            setUpdating(false);
        }
    }

    if (error && !order) {
        return (
            <div className="font-mono text-[13px] text-[#ffb4ab] bg-[#93000a]/20 border border-[#ffb4ab]/30 px-3 py-2 max-w-lg" data-testid="order-error">
                {error}
            </div>
        );
    }
    if (!order) {
        return <div className="font-mono text-[13px] text-[#87929b]" data-testid="order-loading">Loading…</div>;
    }

    const currentStatus = (order.status || '').toUpperCase();
    const transitions = LEGAL_NEXT[currentStatus] || [];

    return (
        <div className="flex flex-col gap-6" data-testid="order-detail">
            <Link to="/admin/orders" className="font-mono text-[13px] text-[#00bfff] hover:underline">
                ← Back to orders
            </Link>

            <div className="flex items-center justify-between">
                <h1 className="font-mono text-[24px] font-bold text-[#e5e2e1]">
                    Order <code className="text-[14px] text-[#8fd6ff] bg-[#131313] border border-[#3d4850] px-2 py-1">{order.id}</code>
                </h1>
                <StatusBadge status={order.status} />
            </div>

            {error && (
                <div className="font-mono text-[13px] text-[#ffb4ab] bg-[#93000a]/20 border border-[#ffb4ab]/30 px-3 py-2">
                    {error}
                </div>
            )}

            {/* Summary */}
            <div className="border border-[#3d4850] bg-[#1c1b1b] p-6">
                <h2 className="font-mono text-[12px] text-[#87929b] uppercase tracking-wider mb-4">// ORDER_SUMMARY</h2>
                <div className="grid grid-cols-[200px_1fr] gap-y-2 font-mono text-[13px]">
                    <dt className="text-[#87929b]">SUBTOTAL</dt>
                    <dd className="text-[#e5e2e1]">${order.subtotal.toFixed(2)}</dd>
                    <dt className="text-[#87929b]">DISCOUNT</dt>
                    <dd className="text-[#e5e2e1]">${order.discount.toFixed(2)}</dd>
                    <dt className="text-[#87929b]">TAX (10%)</dt>
                    <dd className="text-[#e5e2e1]">${order.tax.toFixed(2)}</dd>
                    <dt className="text-[#87929b]">SHIPPING</dt>
                    <dd className="text-[#e5e2e1]">${order.shipping_cost.toFixed(2)}</dd>
                    <dt className="text-[#87929b] font-semibold border-t border-[#3d4850] pt-2 mt-2">TOTAL</dt>
                    <dd className="font-semibold text-[#00bfff] border-t border-[#3d4850] pt-2 mt-2" data-testid="order-total">${order.total.toFixed(2)}</dd>
                    <dt className="text-[#87929b]">PLACED_AT</dt>
                    <dd className="text-[#e5e2e1]">{new Date(order.placed_at).toLocaleString()}</dd>
                    <dt className="text-[#87929b]">UPDATED_AT</dt>
                    <dd className="text-[#e5e2e1]">{new Date(order.updated_at).toLocaleString()}</dd>
                </div>
            </div>

            {/* Customer Contact */}
            <div className="border border-[#3d4850] bg-[#1c1b1b] p-6">
                <h2 className="font-mono text-[12px] text-[#87929b] uppercase tracking-wider mb-4">// CUSTOMER_CONTACT</h2>
                <div className="grid grid-cols-[200px_1fr] gap-y-2 font-mono text-[13px]">
                    <dt className="text-[#87929b]">CUSTOMER_ID</dt>
                    <dd><code className="text-[11px] text-[#8fd6ff] bg-[#131313] border border-[#3d4850] px-2 py-1">{order.customer_id}</code></dd>
                    <dt className="text-[#87929b]">EMAIL</dt>
                    <dd className="text-[#e5e2e1]" data-testid="customer-email">{order.customer_email || '—'}</dd>
                    <dt className="text-[#87929b]">PHONE</dt>
                    <dd className="text-[#e5e2e1]" data-testid="customer-phone">{order.customer_phone || '—'}</dd>
                </div>
            </div>

            {/* Shipping Address */}
            <div className="border border-[#3d4850] bg-[#1c1b1b] p-6">
                <h2 className="font-mono text-[12px] text-[#87929b] uppercase tracking-wider mb-4">// SHIPPING_ADDRESS</h2>
                <pre className="bg-[#0e0e0e] border border-[#3d4850] p-3 font-mono text-[13px] text-[#e5e2e1] overflow-auto" data-testid="shipping-address">
                    {JSON.stringify(order.shipping_address, null, 2)}
                </pre>
            </div>

            {/* Items */}
            <div className="border border-[#3d4850] bg-[#1c1b1b] p-6">
                <h2 className="font-mono text-[12px] text-[#87929b] uppercase tracking-wider mb-4">
                    // ITEMS_DISPATCHED ({order.items.length})
                </h2>
                <table className="w-full font-mono text-[13px]">
                    <thead>
                        <tr className="border-b border-[#3d4850]">
                            <th className="px-2 py-2 text-left text-[12px] text-[#87929b] uppercase">Product</th>
                            <th className="px-2 py-2 text-right text-[12px] text-[#87929b] uppercase">Qty</th>
                            <th className="px-2 py-2 text-right text-[12px] text-[#87929b] uppercase">Unit Price</th>
                            <th className="px-2 py-2 text-right text-[12px] text-[#87929b] uppercase">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items.map((i) => (
                            <tr key={i.id} className="border-t border-[#3d4850]" data-testid="order-item">
                                <td className="px-2 py-2 text-[#e5e2e1]">{i.product_name}</td>
                                <td className="px-2 py-2 text-right text-[#87929b]">{i.quantity}</td>
                                <td className="px-2 py-2 text-right text-[#e5e2e1]">${i.unit_price.toFixed(2)}</td>
                                <td className="px-2 py-2 text-right font-semibold text-[#00bfff]">${i.total_price.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Status Transitions */}
            <div className="border border-[#3d4850] bg-[#1c1b1b] p-6">
                <h2 className="font-mono text-[12px] text-[#87929b] uppercase tracking-wider mb-4">// STATUS_TRANSITIONS</h2>
                {transitions.length === 0 ? (
                    <p className="font-mono text-[13px] text-[#87929b]" data-testid="terminal-state">
                        No further transitions allowed from <strong className="text-[#e5e2e1]">{order.status}</strong>.
                    </p>
                ) : (
                    <div className="flex gap-2 flex-wrap">
                        {transitions.map((next) => (
                            <NeonButton
                                key={next}
                                variant={variantFor(next)}
                                disabled={updating}
                                onClick={() => changeStatus(next)}
                            >
                                <span data-testid={`transition-to-${next}`}>
                                    {updating ? '[ UPDATING... ]' : `[ → ${next} ]`}
                                </span>
                            </NeonButton>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
