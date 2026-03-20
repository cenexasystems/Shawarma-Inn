import { useState } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../hooks/useAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login, signup, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const submit = async () => {
    setError('');

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      setSaving(true);
      if (mode === 'signup') {
        await signup({ email, password, name });
      } else {
        await login({ email, password });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
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
      setError(err instanceof Error ? err.message : 'Google authentication failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/98 backdrop-blur-md transition-all duration-300">
      <div className="relative w-full max-w-md bg-[#111111] rounded-[32px] overflow-hidden shadow-[0_40px_120px_rgba(0,0,0,1)] border border-white/5 p-10">
        
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-white/30 hover:text-white transition-all duration-300 hover:rotate-90"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
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
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full bg-black/50 border border-white/5 rounded-2xl p-4 text-sm text-white focus:border-[var(--red)] outline-none transition-all placeholder:text-white/10 font-body shadow-inner"
            />
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
