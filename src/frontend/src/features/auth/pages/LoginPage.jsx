import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { authApi } from '../api/authApi';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
    const navigate = useNavigate();
    const setSession = useAuthStore((s) => s.setSession);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    async function onSubmit(e) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            const { token, user } = await authApi.login({ email, password });
            setSession({ token, user });
            navigate(user.role === 'admin' ? '/orders' : '/');
        } catch (err) {
            // Backend returns the same generic body for wrong email AND wrong password (NFR-AU7).
            // Lockout returns 423.
            const detail = err.response?.data?.detail || err.response?.data;
            if (err.response?.status === 423) {
                setError(detail?.error || 'Account locked. Try again later.');
            } else {
                setError(detail?.error || 'Invalid credentials');
            }
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="auth-card">
            <h1>Sign In</h1>
            <form onSubmit={onSubmit} data-testid="login-form">
                <label>
                    Email
                    <input
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        data-testid="login-email"
                    />
                </label>
                <label>
                    Password
                    <input
                        type="password"
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        data-testid="login-password"
                    />
                </label>

                {error && (
                    <div className="error" data-testid="login-error">
                        {error}
                    </div>
                )}

                <button type="submit" disabled={submitting} data-testid="login-submit">
                    {submitting ? 'Signing in…' : 'Sign in'}
                </button>
            </form>

            <p className="auth-card__link">
                No account? <Link to="/register">Register</Link>
            </p>
        </div>
    );
}
