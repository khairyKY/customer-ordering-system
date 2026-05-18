import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { ordersApi } from '../api/ordersApi';
import StatusBadge from '../components/StatusBadge';
import NeonButton from '../../../components/ui/NeonButton';

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
        <div className="flex flex-col gap-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-mono text-[32px] font-bold text-[#e5e2e1] mb-2">RECENT ORDERS</h1>
                    <p className="font-mono text-[13px] text-[#87929b]">// ADMIN_VIEW | PAGINATED</p>
                </div>
                <label className="flex items-center gap-2 font-mono text-[12px] text-[#87929b] uppercase">
                    Filter:
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="bg-[#131313] border border-[#3d4850] text-[#e5e2e1] font-mono text-[13px] px-3 py-2 focus:border-[#00bfff] focus:ring-0 outline-none"
                        data-testid="status-filter"
                    >
                        {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s || 'ALL'}</option>
                        ))}
                    </select>
                </label>
            </div>

            {error && (
                <div className="font-mono text-[13px] text-[#ffb4ab] bg-[#93000a]/20 border border-[#ffb4ab]/30 px-3 py-2" data-testid="orders-error">
                    {error}
                </div>
            )}

            {/* Orders Table */}
            <div className="border border-[#3d4850] bg-[#201f1f] overflow-x-auto">
                {loading ? (
                    <div className="p-8 text-center font-mono text-[13px] text-[#87929b]" data-testid="orders-loading">Loading…</div>
                ) : (
                    <table className="w-full text-left border-collapse" data-testid="orders-table">
                        <thead>
                            <tr className="border-b border-[#3d4850] bg-[#2a2a2a]">
                                <th className="p-3 font-mono text-[12px] text-[#87929b] uppercase">ID</th>
                                <th className="p-3 font-mono text-[12px] text-[#87929b] uppercase">Status</th>
                                <th className="p-3 font-mono text-[12px] text-[#87929b] uppercase text-right">Subtotal</th>
                                <th className="p-3 font-mono text-[12px] text-[#87929b] uppercase text-right">Tax</th>
                                <th className="p-3 font-mono text-[12px] text-[#87929b] uppercase text-right">Total</th>
                                <th className="p-3 font-mono text-[12px] text-[#87929b] uppercase">Placed At</th>
                                <th className="p-3 font-mono text-[12px] text-[#87929b] uppercase text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="font-mono text-[13px]">
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-[#87929b]">
                                        No orders found.
                                    </td>
                                </tr>
                            )}
                            {orders.map((o) => (
                                <tr
                                    key={o.id}
                                    className="border-b border-[#3d4850] hover:bg-[#353534]"
                                    data-testid="order-row"
                                    data-status={o.status}
                                >
                                    <td className="p-3 text-[#8fd6ff]">
                                        <code className="text-[11px] bg-[#131313] border border-[#3d4850] px-2 py-1">{o.id}</code>
                                    </td>
                                    <td className="p-3"><StatusBadge status={o.status} /></td>
                                    <td className="p-3 text-right text-[#e5e2e1]">${o.subtotal.toFixed(2)}</td>
                                    <td className="p-3 text-right text-[#e5e2e1]">${o.tax.toFixed(2)}</td>
                                    <td className="p-3 text-right font-semibold text-[#00bfff]">${o.total.toFixed(2)}</td>
                                    <td className="p-3 text-[#87929b]">
                                        {new Date(o.placed_at).toLocaleString()}
                                    </td>
                                    <td className="p-3 text-right">
                                        <Link
                                            to={`/admin/orders/${o.id}`}
                                            className="text-[#00bfff] hover:text-[#8fd6ff] font-mono text-[10px] uppercase tracking-wider border border-[#3d4850] px-2 py-1 hover:border-[#00bfff] inline-block"
                                        >
                                            [ VIEW ]
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between font-mono text-[13px]" data-testid="pagination-info">
                <NeonButton
                    variant="secondary"
                    disabled={pagination.page <= 1}
                    onClick={() => load(pagination.page - 1, status)}
                >
                    <span data-testid="page-prev">[ ← PREV ]</span>
                </NeonButton>
                <span className="text-[#87929b]">
                    Page <strong className="text-[#e5e2e1]">{pagination.page}</strong> of <strong className="text-[#e5e2e1]">{pagination.total_pages}</strong>
                    {' '}· {pagination.total_count} orders
                </span>
                <NeonButton
                    variant="secondary"
                    disabled={pagination.page >= pagination.total_pages}
                    onClick={() => load(pagination.page + 1, status)}
                >
                    <span data-testid="page-next">[ NEXT → ]</span>
                </NeonButton>
            </div>
        </div>
    );
}
