import { useEffect, useState } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../hooks/useAuth';
import { useSupabaseAuth } from '../lib/runtime';
import { isValidIndianPhone } from '../utils/phone';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login, signup, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const submit = async () => {
    setError('');

    // Validate email format
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setError('Password is required.');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (!name?.trim()) {
        setError('Please enter your name.');
        return;
      }
      if (!phone?.trim() || !isValidIndianPhone(phone)) {
        setError('Please enter a valid 10-digit phone number.');
        return;
      }
    }

    try {
      setSaving(true);
      if (mode === 'signup') {
        await signup({ email, password, name: name?.trim(), phone: phone?.trim() });
        // Clear form and close on success
        setName('');
        setPhone('');
        setEmail('');
        setPassword('');
        onClose();
      } else {
        await login({ email, password });
        setEmail('');
        setPassword('');
        onClose();
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Authentication failed';
      // Provide helpful error messages
      if (errorMsg.toLowerCase().includes('invalid') || errorMsg.toLowerCase().includes('not found')) {
        setError('Email or password is incorrect.');
      } else if (errorMsg.toLowerCase().includes('already')) {
        setError('This email is already registered. Please sign in.');
      } else {
        setError(errorMsg);
      }
    } finally {
      setSaving(false);
    }
  };

  const submitGoogle = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setError('Google sign-in did not return a credential.');
      return;
    }

    setError('');
    try {
      setSaving(true);
      await signInWithGoogle(credentialResponse.credential);
      onClose();
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Google authentication failed';
      if (raw.toLowerCase().includes('supabase auth mode')) {
        setError('Google sign-in requires Supabase mode. Set VITE_AUTH_MODE=supabase and restart.');
      } else
      if (raw.toLowerCase().includes('provider') && raw.toLowerCase().includes('not enabled')) {
        setError('Google sign-in is temporarily unavailable. Please use Email Login/Sign Up below.');
      } else {
        setError(raw);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-3 sm:p-6 bg-black/98 backdrop-blur-md transition-all duration-300 overflow-y-auto overscroll-contain" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="relative w-full max-w-md bg-[#111111] rounded-[28px] sm:rounded-[32px] overflow-y-auto max-h-[calc(100vh-24px)] sm:max-h-[calc(100vh-48px)] shadow-[0_40px_120px_rgba(0,0,0,1)] border border-white/5 p-6 sm:p-10 my-3 sm:my-6">

        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-white/30 hover:text-white transition-all duration-300 hover:rotate-90"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-[var(--red)]/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-[var(--red)]/20 shadow-[0_0_40px_rgba(214,43,43,0.1)]">
            <svg className="w-10 h-10 text-[var(--red)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="font-bebas text-5xl uppercase tracking-[4px] text-white mb-2 leading-none">ACCESS THE INN</h2>
          <p className="text-white/40 text-[10px] items-center uppercase tracking-[3px] font-body mt-4">Login or create your customer account</p>
        </div>

        <form className="space-y-8" onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}>
          {useSupabaseAuth ? (
            <>
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-[3px] text-center text-white/30">Quick Sign-In</p>
                <div className="w-full flex justify-center">
                  <GoogleLogin
                    onSuccess={(response) => {
                      void submitGoogle(response);
                    }}
                    onError={() => setError('Google sign-in popup was closed or blocked.')}
                    shape="pill"
                    text="continue_with"
                    theme="filled_black"
                    size="large"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[10px] uppercase tracking-[2px] text-white/30">or use email</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
            </>
          ) : (
            <p className="text-[10px] text-center text-white/35 uppercase tracking-[2px]">Google sign-in is disabled in local auth mode. Use email login or sign up.</p>
          )}

          <div className="flex bg-black p-1 rounded-full border border-white/5">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`w-1/2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${mode === 'login' ? 'bg-[var(--red)] text-white' : 'text-white/40'}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`w-1/2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${mode === 'signup' ? 'bg-[var(--red)] text-white' : 'text-white/40'}`}
            >
              Sign Up
            </button>
          </div>

          {mode === 'signup' && (
            <div className="space-y-4">
              <label className="block text-[10px] font-bold uppercase tracking-[3px] font-body text-[var(--red)]">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                className="w-full bg-black/50 border border-white/5 rounded-2xl p-4 text-sm text-white focus:border-[var(--red)] outline-none transition-all placeholder:text-white/10 font-body shadow-inner"
              />
              <label className="block text-[10px] font-bold uppercase tracking-[3px] font-body text-[var(--red)]">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="9876543210"
                className="w-full bg-black/50 border border-white/5 rounded-2xl p-4 text-sm text-white focus:border-[var(--red)] outline-none transition-all placeholder:text-white/10 font-body shadow-inner"
              />
            </div>
          )}

          <div className="space-y-4">
            <label className="block text-[10px] font-bold uppercase tracking-[3px] font-body text-[var(--red)]">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full bg-black/50 border border-white/5 rounded-2xl p-4 text-sm text-white focus:border-[var(--red)] outline-none transition-all placeholder:text-white/10 font-body shadow-inner"
            />
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-bold uppercase tracking-[3px] font-body text-[var(--red)]">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full bg-black/50 border border-white/5 rounded-2xl pl-4 pr-12 py-4 text-sm text-white focus:border-[var(--red)] outline-none transition-all placeholder:text-white/10 font-body shadow-inner"
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

          {error && (
            <div className="text-center text-sm text-red-400 bg-red-950/30 border border-red-500/30 rounded-2xl p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[var(--red)] text-white rounded-full py-5 text-lg font-bebas tracking-[4px] hover:shadow-[0_0_40px_rgba(214,43,43,0.4)] transition-all active:scale-[0.98] uppercase disabled:opacity-40"
          >
            {saving ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
