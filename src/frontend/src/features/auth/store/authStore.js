// Zustand store — JWT + current user. Mirrors Member B's usePaymentStore pattern.

import { create } from 'zustand';

const storedToken = localStorage.getItem('jwt');
const storedUser = JSON.parse(localStorage.getItem('current_user') || 'null');

export const useAuthStore = create((set, get) => ({
    token: storedToken,
    user: storedUser,
    isAuthenticated: !!storedToken,

    setSession({ token, user }) {
        localStorage.setItem('jwt', token);
        localStorage.setItem('current_user', JSON.stringify(user));
        set({ token, user, isAuthenticated: true });
    },

    logout() {
        localStorage.removeItem('jwt');
        localStorage.removeItem('current_user');
        set({ token: null, user: null, isAuthenticated: false });
    },

    isAdmin() {
        return get().user?.role === 'admin';
    },
}));
