// Tickets HTTP client — uses the shared axios client (which attaches the
// JWT from localStorage on every request and points at the FastAPI core).

import { client } from '../../../api/client';

export const ticketApi = {
    async create({ subject, body }) {
        const res = await client.post('/tickets', { subject, body });
        return res.data;
    },

    async listTriage() {
        const res = await client.get('/tickets/triage');
        return res.data; // array of Ticket
    },

    async updateStatus(id, status) {
        const res = await client.patch(`/tickets/${id}/status`, { status });
        return res.data;
    },
};
