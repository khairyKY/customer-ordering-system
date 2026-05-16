// Shared axios instance for the Python backend (auth + orders + inventory).
// Member A/B's Node backend lives on port 3001; ours lives on port 8000.

import axios from 'axios';

export const PYTHON_API_BASE = import.meta.env.VITE_PYTHON_API_BASE || 'http://localhost:8000/api/v1';

export const client = axios.create({
    baseURL: PYTHON_API_BASE,
    headers: { 'Content-Type': 'application/json' },
});

// Inject JWT on every request when one exists in localStorage
client.interceptors.request.use((config) => {
    const token = localStorage.getItem('jwt');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// On 401, clear the bad token so the user is sent back to /login
client.interceptors.response.use(
    (r) => r,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('jwt');
            localStorage.removeItem('current_user');
        }
        return Promise.reject(err);
    },
);
