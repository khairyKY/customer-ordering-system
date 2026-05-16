import { client } from '../../../api/client';

export const authApi = {
    async register({ email, password }) {
        const res = await client.post('/auth/register', { email, password });
        return res.data; // { user_id, email, role }
    },

    async login({ email, password }) {
        const res = await client.post('/auth/login', { email, password });
        return res.data; // { token, expires_at, user: { id, email, role } }
    },
};
