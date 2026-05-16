import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { ordersApi } from '../api/ordersApi';
import StatusBadge from '../components/StatusBadge';

// Phase 2 §3.2.2 — only show transitions that are legal from the current status.
const LEGAL_NEXT = {
    PENDING:    ['CONFIRMED', 'CANCELLED'],
    CONFIRMED:  ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['SHIPPED', 'CANCELLED'],
    SHIPPED:    ['DELIVERED'],
    DELIVERED:  ['REFUNDED'],
    CANCELLED:  [],
    REFUNDED:   [],
};

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

    if (error) return <div className="page error" data-testid="order-error">{error}</div>;
    if (!order) return <div className="page" data-testid="order-loading">Loading…</div>;

    const transitions = LEGAL_NEXT[order.status] || [];

    return (
        <div className="page" data-testid="order-detail">
            <Link to="/orders">← Back to orders</Link>

            <header className="page__header">
                <h1>Order <code>{order.id}</code></h1>
                <StatusBadge status={order.status} />
            </header>

            <section className="card">
                <h2>Summary</h2>
                <dl>
                    <dt>Subtotal</dt>     <dd>${order.subtotal.toFixed(2)}</dd>
                    <dt>Discount</dt>     <dd>${order.discount.toFixed(2)}</dd>
                    <dt>Tax (10%)</dt>    <dd>${order.tax.toFixed(2)}</dd>
                    <dt>Shipping</dt>     <dd>${order.shipping_cost.toFixed(2)}</dd>
                    <dt><strong>Total</strong></dt>
                    <dd><strong data-testid="order-total">${order.total.toFixed(2)}</strong></dd>
                    <dt>Placed</dt>       <dd>{new Date(order.placed_at).toLocaleString()}</dd>
                    <dt>Last updated</dt> <dd>{new Date(order.updated_at).toLocaleString()}</dd>
                </dl>
            </section>

            <section className="card">
                <h2>Customer Contact</h2>
                <dl>
                    <dt>Customer ID</dt>  <dd><code>{order.customer_id}</code></dd>
                    <dt>Email</dt>        <dd data-testid="customer-email">{order.customer_email || '—'}</dd>
                    <dt>Phone</dt>        <dd data-testid="customer-phone">{order.customer_phone || '—'}</dd>
                </dl>
            </section>

            <section className="card">
                <h2>Shipping Address</h2>
                <pre data-testid="shipping-address">{JSON.stringify(order.shipping_address, null, 2)}</pre>
            </section>

            <section className="card">
                <h2>Items ({order.items.length})</h2>
                <table className="items-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Qty</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items.map((i) => (
                            <tr key={i.id} data-testid="order-item">
                                <td>{i.product_name}</td>
                                <td>{i.quantity}</td>
                                <td>${i.unit_price.toFixed(2)}</td>
                                <td>${i.total_price.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            <section className="card">
                <h2>Change Status</h2>
                {transitions.length === 0 ? (
                    <p data-testid="terminal-state">No further transitions allowed from {order.status}.</p>
                ) : (
                    <div className="transition-buttons">
                        {transitions.map((next) => (
                            <button
                                key={next}
                                onClick={() => changeStatus(next)}
                                disabled={updating}
                                data-testid={`transition-to-${next}`}
                            >
                                {updating ? 'Updating…' : `→ ${next}`}
                            </button>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
