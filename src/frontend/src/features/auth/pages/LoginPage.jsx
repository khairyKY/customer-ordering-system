import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { authApi } from '../api/authApi';
import { useAuthStore } from '../store/authStore';
import NeonButton from '../../../components/ui/NeonButton';
import TerminalInput from '../../../components/ui/TerminalInput';

export default function LoginPage() {
    const navigate = useNavigate();
    const setSession = useAuthStore((s) => s.setSession);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [showForgot, setShowForgot] = useState(false);
    const [forgotMsg, setForgotMsg] = useState('');
    const [forgotEmail, setForgotEmail] = useState('');

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

    async function handleForgot(e) {
        e.preventDefault();
        setSubmitting(true);
        try {
            // Previous implementation used `require('axios')` — a CommonJS
            // import in an ESM Vite app, which throws ReferenceError the
            // instant this handler runs. Route through authApi so the
            // shared axios client (with env-configurable base URL and JWT
            // interceptor) is reused consistently with login/register.
            const data = await authApi.forgotPassword({ email: forgotEmail || email });
            setForgotMsg(data.message);
        } catch (err) {
            setForgotMsg(err.response?.data?.detail?.error || 'An error occurred.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0D0D0D] px-4 relative">
            {/* Breadcrumb */}
            <nav className="w-full max-w-[480px] font-mono text-[11px] text-[#87929b] flex justify-center tracking-widest mb-8">
                <span>CART</span>
                <span className="mx-2">-&gt;</span>
                <span className="text-[#00bfff]">IDENTITY</span>
                <span className="mx-2">-&gt;</span>
                <span>SHIPPING</span>
                <span className="mx-2">-&gt;</span>
                <span>PAYMENT</span>
                <span className="mx-2">-&gt;</span>
                <span>REVIEW</span>
            </nav>

            <h2 className="font-mono text-[24px] font-semibold text-center text-[#e5e2e1] mb-8">
                Sign In or Continue
            </h2>

            <div className="w-full max-w-[480px] border border-[#3d4850] bg-[#131313] p-6 flex flex-col gap-8">
                {/* Returning Customer */}
                <form onSubmit={submit} className="flex flex-col gap-4" data-testid="login-form">
                    <h3 className="font-mono text-[12px] text-[#87929b] uppercase tracking-wider">
                        // RETURNING CUSTOMER
                    </h3>

                    <div className="flex flex-col gap-2">
                        <label className="font-mono text-[13px] text-[#e5e2e1]">Email Address</label>
                        <TerminalInput
                            type="email"
                            placeholder="user@domain.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            ariaLabel="Email address"
                            data-testid="login-email"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="font-mono text-[13px] text-[#e5e2e1] flex justify-between">
                            Password
                            <button type="button" className="text-[#00bfff] hover:underline text-[12px]" onClick={() => setShowForgot(true)}>Forgot?</button>
                        </label>
                        <TerminalInput
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            ariaLabel="Password"
                            data-testid="login-password"
                        />
                    </div>

                    {error && (
                        <div
                            className="font-mono text-[13px] text-[#ffb4ab] bg-[#93000a]/20 border border-[#ffb4ab]/30 px-3 py-2"
                            data-testid="login-error"
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
                        <span data-testid="login-submit">
                            {submitting ? '[ AUTHENTICATING... ]' : '[ SIGN IN ]'}
                        </span>
                    </NeonButton>
                </form>

                {/* Divider */}
                <div className="w-full h-px bg-[#3d4850] relative flex justify-center items-center">
                    <span className="absolute bg-[#131313] px-2 font-mono text-[13px] text-[#87929b]">OR</span>
                </div>

                {/* Guest Checkout */}
                <div className="flex flex-col gap-4">
                    <h3 className="font-mono text-[12px] text-[#87929b] uppercase tracking-wider">
                        // GUEST CHECKOUT
                    </h3>
                    <p className="font-mono text-[14px] text-[#87929b]">
                        Proceed without an account. You can save your details later to track your order.
                    </p>
                    <NeonButton variant="secondary" fullWidth>
                        [ CONTINUE AS GUEST ]
                    </NeonButton>
                </div>

                <p className="text-center font-mono text-[13px] text-[#87929b]">
                    No account?{' '}
                    <Link to="/admin/register" className="text-[#00bfff] hover:underline">
                        Register
                    </Link>
                </p>
            </div>

            {showForgot && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#131313] border border-[#3d4850] p-6 max-w-sm w-full flex flex-col gap-4">
                        <h3 className="font-mono text-[18px] text-[#e5e2e1]">// RESET_PASSWORD</h3>
                        <p className="font-mono text-[13px] text-[#87929b]">Enter your email to receive a reset link.</p>
                        <TerminalInput 
                            type="email" 
                            placeholder="user@domain.com" 
                            value={forgotEmail || email} 
                            onChange={e => setForgotEmail(e.target.value)} 
                        />
                        {forgotMsg && <p className="font-mono text-[13px] text-primary-container">{forgotMsg}</p>}
                        <div className="flex justify-end gap-2 mt-2">
                            <NeonButton variant="secondary" onClick={() => { setShowForgot(false); setForgotMsg(''); }}>[ CANCEL ]</NeonButton>
                            <NeonButton onClick={handleForgot} disabled={submitting}>[ SEND LINK ]</NeonButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
