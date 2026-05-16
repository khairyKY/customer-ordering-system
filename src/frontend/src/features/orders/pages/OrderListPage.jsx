import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { ordersApi } from '../api/ordersApi';
import StatusBadge from '../components/StatusBadge';

const STATUS_OPTIONS = [
    '', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED',
];

export default function OrderListPage() {
    const [orders, setOrders] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total_count: 0, total_pages: 1 });
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    async function load(page = pagination.page, statusFilter = status) {
        setLoading(true);
        setError(null);
        try {
            const data = await ordersApi.list({
                page,
                limit: pagination.limit,
                status: statusFilter || undefined,
            });
            setOrders(data.orders);
            setPagination(data.pagination);
        } catch (err) {
            setError(err.response?.data?.detail?.error || 'Failed to load orders');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load(1, status);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    return (
        <div className="page">
            <header className="page__header">
                <h1>Orders</h1>
                <div className="filters">
                    <label>
                        Filter by status:
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            data-testid="status-filter"
                        >
                            {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>{s || 'All'}</option>
                            ))}
                        </select>
                    </label>
                </div>
            </header>

            {error && <div className="error" data-testid="orders-error">{error}</div>}

            {loading ? (
                <div data-testid="orders-loading">Loading…</div>
            ) : (
                <>
                    <table className="orders-table" data-testid="orders-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Status</th>
                                <th>Subtotal</th>
                                <th>Tax</th>
                                <th>Total</th>
                                <th>Placed At</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length === 0 && (
                                <tr><td colSpan={7} className="empty">No orders</td></tr>
                            )}
                            {orders.map((o) => (
                                <tr key={o.id} data-testid="order-row" data-status={o.status}>
                                    <td><code>{o.id}</code></td>
                                    <td><StatusBadge status={o.status} /></td>
                                    <td>${o.subtotal.toFixed(2)}</td>
                                    <td>${o.tax.toFixed(2)}</td>
                                    <td>${o.total.toFixed(2)}</td>
                                    <td>{new Date(o.placed_at).toLocaleString()}</td>
                                    <td><Link to={`/orders/${o.id}`}>View</Link></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="pagination" data-testid="pagination-info">
                        <button
                            disabled={pagination.page <= 1}
                            onClick={() => load(pagination.page - 1, status)}
                            data-testid="page-prev"
                        >
                            ← Prev
                        </button>
                        <span>
                            Page {pagination.page} of {pagination.total_pages} ({pagination.total_count} orders)
                        </span>
                        <button
                            disabled={pagination.page >= pagination.total_pages}
                            onClick={() => load(pagination.page + 1, status)}
                            data-testid="page-next"
                        >
                            Next →
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
