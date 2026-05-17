import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';

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
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                    Filter by status:
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        data-testid="status-filter"
                    >
                        {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s || 'All'}</option>
                        ))}
                    </select>
                </label>
            </div>

            {error && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2" data-testid="orders-error">
                    {error}
                </div>
            )}

            <Card className="p-0 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500" data-testid="orders-loading">Loading…</div>
                ) : (
                    <table className="w-full" data-testid="orders-table">
                        <thead className="bg-gray-50">
                            <tr className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                <th className="px-4 py-3 text-left">Order ID</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-right">Subtotal</th>
                                <th className="px-4 py-3 text-right">Tax</th>
                                <th className="px-4 py-3 text-right">Total</th>
                                <th className="px-4 py-3 text-left">Placed At</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                        No orders
                                    </td>
                                </tr>
                            )}
                            {orders.map((o) => (
                                <tr
                                    key={o.id}
                                    className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                                    data-testid="order-row"
                                    data-status={o.status}
                                >
                                    <td className="px-4 py-3">
                                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{o.id}</code>
                                    </td>
                                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                                    <td className="px-4 py-3 text-right">${o.subtotal.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-right">${o.tax.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-right font-semibold">${o.total.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {new Date(o.placed_at).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link
                                            to={`/admin/orders/${o.id}`}
                                            className="text-blue-600 hover:underline text-sm font-medium"
                                        >
                                            View →
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Card>

            <div className="flex items-center justify-between text-sm" data-testid="pagination-info">
                <Button
                    variant="secondary"
                    disabled={pagination.page <= 1}
                    onClick={() => load(pagination.page - 1, status)}
                    className="text-sm"
                >
                    <span data-testid="page-prev">← Prev</span>
                </Button>
                <span className="text-gray-600">
                    Page <strong>{pagination.page}</strong> of <strong>{pagination.total_pages}</strong>
                    {' '}· {pagination.total_count} orders
                </span>
                <Button
                    variant="secondary"
                    disabled={pagination.page >= pagination.total_pages}
                    onClick={() => load(pagination.page + 1, status)}
                    className="text-sm"
                >
                    <span data-testid="page-next">Next →</span>
                </Button>
            </div>
        </div>
    );
}
