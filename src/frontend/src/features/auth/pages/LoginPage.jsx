import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';

import { authApi } from '../api/authApi';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
    const navigate = useNavigate();
    const setSession = useAuthStore((s) => s.setSession);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    async function submit(e) {
        if (e && e.preventDefault) e.preventDefault();
        if (submitting) return;            // double-submit guard
        setError(null);
        setSubmitting(true);
        try {
            const { token, user } = await authApi.login({ email, password });
            setSession({ token, user });
            navigate(user.role === 'admin' ? '/admin/orders' : '/');
        } catch (err) {
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Sign In</h1>

                <form onSubmit={submit} className="flex flex-col gap-4" data-testid="login-form">
                    <Input
                        label="Email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        data-testid="login-email"
                    />
                    <Input
                        label="Password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        data-testid="login-password"
                    />

                    {error && (
                        <div
                            className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2"
                            data-testid="login-error"
                        >
                            {error}
                        </div>
                    )}

                    <Button
                        variant="primary"
                        disabled={submitting}
                        onClick={submit}
                        className="mt-2 w-full"
                    >
                        <span data-testid="login-submit">
                            {submitting ? 'Signing in…' : 'Sign in'}
                        </span>
                    </Button>
                </form>

                <p className="text-center mt-6 text-sm text-gray-600">
                    No account?{' '}
                    <Link to="/admin/register" className="text-blue-600 hover:underline font-medium">
                        Register
                    </Link>
                </p>
            </Card>
        </div>
    );
}
