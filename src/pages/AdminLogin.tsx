import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { adminLogin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);

  // Restore remembered email on mount
  useEffect(() => {
    const saved = localStorage.getItem('admin_remembered_email');
    if (saved) { setEmail(saved); setRememberMe(true); }

    if (sessionStorage.getItem('si_session_expired_notice')) {
      setSessionExpiredNotice(true);
      sessionStorage.removeItem('si_session_expired_notice');
    }
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (!email.trim()) { setError('Email is required.'); return; }
    if (!password) { setError('Password is required.'); return; }

    try {
      setSaving(true);
      const user = await adminLogin({ email, password, rememberMe });
      if (user.role !== 'admin') {
        throw new Error('This account does not have admin access.');
      }
      if (rememberMe) {
        localStorage.setItem('admin_remembered_email', email);
      } else {
        localStorage.removeItem('admin_remembered_email');
      }
      navigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in as admin');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#121212] text-[#f5f4f0] flex items-center justify-center px-6 py-24">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#ef8f2f]/20 border border-[#ef8f2f]/30 mb-4">
            <svg className="w-8 h-8 text-[#ef8f2f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="font-bebas text-4xl uppercase tracking-[4px] text-[#f5f4f0]">Admin Portal</h1>
          <p className="text-white/50 text-sm mt-1">Shawarma Inn — Restricted Access</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-[#181818] border border-white/10 rounded-[24px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
        >

          {sessionExpiredNotice && (
            <div className="mb-6 p-3 rounded-xl bg-blue-900/20 border border-blue-500/20">
              <p className="text-blue-300/90 text-xs leading-relaxed text-center">
                Your session expired. Please sign in again.
              </p>
            </div>
          )}

          <div className="space-y-5">
            {/* Email field */}
            <div>
              <label className="block text-[10px] uppercase tracking-[3px] text-white/60 mb-2 font-bold">
                Admin Email
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@shawarmainn.local"
                  autoComplete="username"
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-4 text-sm outline-none focus:border-[#ef8f2f] transition-colors"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="block text-[10px] uppercase tracking-[3px] text-white/60 mb-2 font-bold">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secure password"
                  autoComplete="current-password"
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-12 py-4 text-sm outline-none focus:border-[#ef8f2f] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setRememberMe((v) => !v)}
                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                  rememberMe ? 'bg-[#ef8f2f] border-[#ef8f2f]' : 'bg-transparent border-white/20'
                }`}
                aria-checked={rememberMe}
                role="checkbox"
              >
                {rememberMe && (
                  <svg className="w-3 h-3 text-[#121212]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <span
                className="text-sm text-white/60 cursor-pointer select-none"
                onClick={() => setRememberMe((v) => !v)}
              >
                Remember my email on this device
              </span>
            </div>

            {/* Error display */}
            {error && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-red-900/20 border border-red-500/20">
                <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#ef8f2f] text-[#121212] font-bebas text-2xl tracking-[3px] uppercase rounded-full py-4 disabled:opacity-50 hover:bg-[#e07f20] transition-colors mt-2"
            >
              {saving ? 'Signing in…' : 'Enter Admin Dashboard'}
            </button>
          </div>
        </form>

        {/* Back to site */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Shawarma Inn
          </Link>
        </div>
      </div>
    </main>
  );
}
