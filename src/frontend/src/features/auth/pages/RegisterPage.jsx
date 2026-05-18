import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { authApi } from '../api/authApi';
import NeonButton from '../../../components/ui/NeonButton';
import TerminalInput from '../../../components/ui/TerminalInput';

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
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0D0D0D] px-4">
            <h2 className="font-mono text-[24px] font-semibold text-center text-[#e5e2e1] mb-8">
                Create Account
            </h2>

            <div className="w-full max-w-[480px] border border-[#3d4850] bg-[#131313] p-6 flex flex-col gap-6">
                <h3 className="font-mono text-[12px] text-[#87929b] uppercase tracking-wider">
                    // NEW_USER_REGISTRATION
                </h3>

                <form onSubmit={submit} className="flex flex-col gap-4" data-testid="register-form">
                    <div className="flex flex-col gap-2">
                        <label className="font-mono text-[13px] text-[#e5e2e1]">Email Address</label>
                        <TerminalInput
                            type="email"
                            placeholder="user@domain.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            ariaLabel="Email"
                            data-testid="register-email"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="font-mono text-[13px] text-[#e5e2e1]">Password (min 8 chars)</label>
                        <TerminalInput
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            ariaLabel="Password"
                            data-testid="register-password"
                        />
                    </div>

                    {error && (
                        <div
                            className="font-mono text-[13px] text-[#ffb4ab] bg-[#93000a]/20 border border-[#ffb4ab]/30 px-3 py-2"
                            data-testid="register-error"
                        >
                            {error}
                        </div>
                    )}

                    <NeonButton
                        variant="primary"
                        fullWidth
                        disabled={submitting}
                        onClick={submit}
                        type="submit"
                    >
                        <span data-testid="register-submit">
                            {submitting ? '[ PROVISIONING... ]' : '[ CREATE ACCOUNT ]'}
                        </span>
                    </NeonButton>
                </form>

                <p className="text-center font-mono text-[13px] text-[#87929b]">
                    Already registered?{' '}
                    <Link to="/admin/login" className="text-[#00bfff] hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
