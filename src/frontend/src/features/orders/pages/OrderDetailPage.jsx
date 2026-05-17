import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';

import { ordersApi } from '../api/ordersApi';
import StatusBadge from '../components/StatusBadge';

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
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2 max-w-lg" data-testid="order-error">
                {error}
            </div>
        );
    }
    if (!order) {
        return <div className="text-gray-500" data-testid="order-loading">Loading…</div>;
    }

    const transitions = LEGAL_NEXT[order.status] || [];

    return (
        <div className="flex flex-col gap-4" data-testid="order-detail">
            <Link to="/admin/orders" className="text-sm text-blue-600 hover:underline">
                ← Back to orders
            </Link>

            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">
                    Order <code className="text-base bg-gray-100 px-2 py-1 rounded">{order.id}</code>
                </h1>
                <StatusBadge status={order.status} />
            </div>

            {error && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
                    {error}
                </div>
            )}

            <Card>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">Summary</h2>
                <dl className="grid grid-cols-[200px_1fr] gap-y-2 text-sm">
                    <dt className="text-gray-600">Subtotal</dt>
                    <dd>${order.subtotal.toFixed(2)}</dd>
                    <dt className="text-gray-600">Discount</dt>
                    <dd>${order.discount.toFixed(2)}</dd>
                    <dt className="text-gray-600">Tax (10%)</dt>
                    <dd>${order.tax.toFixed(2)}</dd>
                    <dt className="text-gray-600">Shipping</dt>
                    <dd>${order.shipping_cost.toFixed(2)}</dd>
                    <dt className="text-gray-600 font-semibold">Total</dt>
                    <dd className="font-semibold" data-testid="order-total">${order.total.toFixed(2)}</dd>
                    <dt className="text-gray-600">Placed</dt>
                    <dd>{new Date(order.placed_at).toLocaleString()}</dd>
                    <dt className="text-gray-600">Last updated</dt>
                    <dd>{new Date(order.updated_at).toLocaleString()}</dd>
                </dl>
            </Card>

            <Card>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">Customer Contact</h2>
                <dl className="grid grid-cols-[200px_1fr] gap-y-2 text-sm">
                    <dt className="text-gray-600">Customer ID</dt>
                    <dd><code className="text-xs bg-gray-100 px-2 py-1 rounded">{order.customer_id}</code></dd>
                    <dt className="text-gray-600">Email</dt>
                    <dd data-testid="customer-email">{order.customer_email || '—'}</dd>
                    <dt className="text-gray-600">Phone</dt>
                    <dd data-testid="customer-phone">{order.customer_phone || '—'}</dd>
                </dl>
            </Card>

            <Card>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">Shipping Address</h2>
                <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto" data-testid="shipping-address">
                    {JSON.stringify(order.shipping_address, null, 2)}
                </pre>
            </Card>

            <Card>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">
                    Items ({order.items.length})
                </h2>
                <table className="w-full text-sm">
                    <thead className="text-xs uppercase tracking-wider text-gray-500">
                        <tr>
                            <th className="px-2 py-2 text-left">Product</th>
                            <th className="px-2 py-2 text-right">Qty</th>
                            <th className="px-2 py-2 text-right">Unit Price</th>
                            <th className="px-2 py-2 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items.map((i) => (
                            <tr key={i.id} className="border-t border-gray-100" data-testid="order-item">
                                <td className="px-2 py-2">{i.product_name}</td>
                                <td className="px-2 py-2 text-right">{i.quantity}</td>
                                <td className="px-2 py-2 text-right">${i.unit_price.toFixed(2)}</td>
                                <td className="px-2 py-2 text-right font-semibold">${i.total_price.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>

            <Card>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">Change Status</h2>
                {transitions.length === 0 ? (
                    <p className="text-sm text-gray-600" data-testid="terminal-state">
                        No further transitions allowed from <strong>{order.status}</strong>.
                    </p>
                ) : (
                    <div className="flex gap-2 flex-wrap">
                        {transitions.map((next) => (
                            <Button
                                key={next}
                                variant={variantFor(next)}
                                disabled={updating}
                                onClick={() => changeStatus(next)}
                                className="text-sm"
                            >
                                <span data-testid={`transition-to-${next}`}>
                                    {updating ? 'Updating…' : `→ ${next}`}
                                </span>
                            </Button>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}
