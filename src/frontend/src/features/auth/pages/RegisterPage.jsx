import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';

import { authApi } from '../api/authApi';

export default function RegisterPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    async function submit(e) {
        if (e && e.preventDefault) e.preventDefault();
        if (submitting) return;
        setError(null);
        setSubmitting(true);
        try {
            await authApi.register({ email, password });
            navigate('/admin/login', { state: { justRegistered: true } });
        } catch (err) {
            const detail = err.response?.data?.detail || err.response?.data;
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Account</h1>

                <form onSubmit={submit} className="flex flex-col gap-4" data-testid="register-form">
                    <Input
                        label="Email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        data-testid="register-email"
                    />
                    <Input
                        label="Password (min 8 chars)"
                        type="password"
                        autoComplete="new-password"
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        data-testid="register-password"
                    />

                    {error && (
                        <div
                            className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2"
                            data-testid="register-error"
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
                        <span data-testid="register-submit">
                            {submitting ? 'Creating…' : 'Create account'}
                        </span>
                    </Button>
                </form>

                <p className="text-center mt-6 text-sm text-gray-600">
                    Already registered?{' '}
                    <Link to="/admin/login" className="text-blue-600 hover:underline font-medium">
                        Sign in
                    </Link>
                </p>
            </Card>
        </div>
    );
}
