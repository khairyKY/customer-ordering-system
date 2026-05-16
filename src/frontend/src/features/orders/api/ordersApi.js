import { client } from '../../../api/client';

export const ordersApi = {
    async list({ page = 1, limit = 20, status } = {}) {
        const params = { page, limit };
        if (status) params.status = status;
        const res = await client.get('/orders', { params });
        return res.data; // { orders[], pagination{} }
    },

    async getById(id) {
        const res = await client.get(`/orders/${id}`);
        return res.data;
    },

    async updateStatus(id, status) {
        const res = await client.patch(`/orders/${id}/status`, { status });
        return res.data;
    },
};

export const inventoryApi = {
    async list() {
        const res = await client.get('/inventory');
        return res.data; // { products[] }
    },

    async updateStock(id, stock) {
        const res = await client.patch(`/inventory/${id}`, { stock });
        return res.data;
    },
};
