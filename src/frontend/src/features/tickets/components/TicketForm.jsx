// ============================================================
// TicketForm — customer-side ticket creation (/tickets/new)
// Selectors match src/backend_python/tests/playwright/pages/ticket_page.py:
//   input[name="subject"], textarea[name="body"],
//   button[type="submit"], .alert-success, .alert-error
// Auth: the shared axios client attaches localStorage('jwt'). For E2E the
// test fixture seeds an authed_customer JWT; for real users the page
// would be reached after /admin/login.
// ============================================================

import { useState } from 'react';

import { ticketApi } from '../api/ticketApi';

export default function TicketForm() {
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);

    async function handleSubmit(e) {
        if (e && e.preventDefault) e.preventDefault();
        if (submitting) return;
        setSuccess(null);
        setError(null);
        setSubmitting(true);
        try {
            await ticketApi.create({ subject, body });
            setSuccess('Ticket created successfully');
            setSubject('');
            setBody('');
        } catch (err) {
            const status = err.response?.status;
            const detail = err.response?.data?.detail || err.response?.data?.error;
            if (status === 409) {
                setError('Duplicate ticket — a matching submission was received recently');
            } else if (status === 422 && Array.isArray(detail)) {
                setError(detail.map((d) => d.msg).join(' · '));
            } else if (status === 401 || status === 403) {
                setError('You must be signed in to submit a ticket');
            } else {
                setError(detail || 'Failed to create ticket');
            }
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0D0D0D] px-4 py-8">
            <h2 className="font-mono text-[24px] font-semibold text-center text-[#e5e2e1] mb-6">
                Create Support Ticket
            </h2>

            <form
                onSubmit={handleSubmit}
                className="w-full max-w-[520px] border border-[#3d4850] bg-[#131313] p-6 flex flex-col gap-4"
                data-testid="ticket-form"
            >
                <label className="flex flex-col gap-2 font-mono text-[13px] text-[#e5e2e1]">
                    Subject
                    <input
                        name="subject"
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        minLength={5}
                        maxLength={120}
                        required
                        className="bg-[#0e0e0e] border border-[#3d4850] px-3 py-2 text-[#e5e2e1]"
                    />
                </label>

                <label className="flex flex-col gap-2 font-mono text-[13px] text-[#e5e2e1]">
                    Body
                    <textarea
                        name="body"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        minLength={10}
                        maxLength={2000}
                        rows={6}
                        required
                        className="bg-[#0e0e0e] border border-[#3d4850] px-3 py-2 text-[#e5e2e1]"
                    />
                </label>

                {success && (
                    <div
                        className="alert-success font-mono text-[13px] text-[#9be0a8] bg-[#1b3320] border border-[#9be0a8]/40 px-3 py-2"
                        role="status"
                    >
                        {success}
                    </div>
                )}

                {error && (
                    <div
                        className="alert-error font-mono text-[13px] text-[#ffb4ab] bg-[#3a1414] border border-[#ffb4ab]/40 px-3 py-2"
                        role="alert"
                    >
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    className="bg-[#00bfff] text-[#0D0D0D] font-mono text-[14px] uppercase tracking-wider px-4 py-2 disabled:opacity-50"
                >
                    {submitting ? 'Submitting…' : 'Submit Ticket'}
                </button>
            </form>
        </div>
    );
}
