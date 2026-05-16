import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { authApi } from '../api/authApi';

export default function RegisterPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    async function onSubmit(e) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await authApi.register({ email, password });
            navigate('/login', { state: { justRegistered: true } });
        } catch (err) {
            const detail = err.response?.data?.detail || err.response?.data;
            // Pydantic validation errors come back as 422 with a `detail` array
            if (err.response?.status === 422 && Array.isArray(detail)) {
                setError(detail.map((d) => `${d.loc.slice(-1)[0]}: ${d.msg}`).join(' · '));
            } else if (err.response?.status === 409) {
                setError(detail?.error || 'Email already registered');
            } else {
                setError(detail?.error || 'Registration failed');
            }
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="auth-card">
            <h1>Create Account</h1>
            <form onSubmit={onSubmit} data-testid="register-form">
                <label>
                    Email
                    <input
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        data-testid="register-email"
                    />
                </label>
                <label>
                    Password <span className="hint">(min 8 chars)</span>
                    <input
                        type="password"
                        required
                        minLength={8}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        data-testid="register-password"
                    />
                </label>

                {error && (
                    <div className="error" data-testid="register-error">
                        {error}
                    </div>
                )}

                <button type="submit" disabled={submitting} data-testid="register-submit">
                    {submitting ? 'Creating…' : 'Create account'}
                </button>
            </form>

            <p className="auth-card__link">
                Already registered? <Link to="/login">Sign in</Link>
            </p>
        </div>
    );
}
