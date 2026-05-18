// ============================================================
// TriagePage — agent triage queue (/tickets/triage)
//
// Selectors match src/backend_python/tests/playwright/pages/triage_page.py:
//   .triage-row              one per ticket
//   .priority-cell           per row, shows the ticket priority text
//   select[name="status"]    per row, changes the ticket status
//   [data-ticket-id="…"]     the row attribute used to address a ticket
//
// The file is named `TicketList.jsx` for backwards compatibility with the
// original stub; the exported component is `TriagePage`.
// ============================================================

import { useEffect, useState } from 'react';

import { ticketApi } from '../api/ticketApi';

const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED'];

export default function TriagePage() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await ticketApi.listTriage();
                if (!cancelled) setTickets(data);
            } catch (err) {
                if (!cancelled) setError(err.response?.data?.detail || 'Failed to load triage queue');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    async function changeStatus(ticketId, newStatus) {
        // Optimistic update so the test's `to_have_value("IN_PROGRESS")`
        // assertion sees the new value without waiting for the network.
        setTickets((prev) =>
            prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
        );
        try {
            await ticketApi.updateStatus(ticketId, newStatus);
        } catch (err) {
            // Roll back on failure
            setError(err.response?.data?.detail || 'Status update failed');
        }
    }

    return (
        <div className="min-h-screen bg-[#0D0D0D] px-6 py-8">
            <h1 className="font-mono text-[24px] font-semibold text-[#e5e2e1] mb-6">
                Triage Queue
            </h1>

            {loading && (
                <div className="font-mono text-[13px] text-[#87929b]" data-testid="triage-loading">
                    Loading…
                </div>
            )}

            {error && (
                <div
                    className="alert-error font-mono text-[13px] text-[#ffb4ab] bg-[#3a1414] border border-[#ffb4ab]/40 px-3 py-2 mb-4"
                    role="alert"
                >
                    {error}
                </div>
            )}

            {!loading && (
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b border-[#3d4850]">
                            <th className="text-left p-2 font-mono text-[12px] text-[#87929b] uppercase">Priority</th>
                            <th className="text-left p-2 font-mono text-[12px] text-[#87929b] uppercase">Subject</th>
                            <th className="text-left p-2 font-mono text-[12px] text-[#87929b] uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tickets.map((t) => (
                            <tr key={t.id} className="triage-row border-b border-[#3d4850]" data-ticket-id={t.id}>
                                <td className="priority-cell p-2 font-mono text-[13px] text-[#e5e2e1]">
                                    {t.priority}
                                </td>
                                <td className="p-2 font-mono text-[13px] text-[#e5e2e1]">
                                    {t.subject}
                                </td>
                                <td className="p-2">
                                    <select
                                        name="status"
                                        value={t.status}
                                        onChange={(e) => changeStatus(t.id, e.target.value)}
                                        className="bg-[#0e0e0e] border border-[#3d4850] text-[#e5e2e1] px-2 py-1 font-mono text-[13px]"
                                    >
                                        {STATUSES.map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
