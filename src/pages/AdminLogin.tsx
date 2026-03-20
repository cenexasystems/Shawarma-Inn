import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { canUseAdminApi } from '../lib/runtime';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { adminLogin } = useAuth();

  const [email, setEmail] = useState('admin@shawarmainn.local');
  const [password, setPassword] = useState('admin12345');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (!canUseAdminApi) {
      setError('Admin login is unavailable on this deployment because backend API is not connected.');
      return;
    }

    try {
      setSaving(true);
      const user = await adminLogin({ email, password });
      if (user.role !== 'admin') {
        throw new Error('This account does not have admin access.');
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
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md bg-[#181818] border border-white/10 rounded-[24px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
      >
        <h1 className="font-bebas text-5xl uppercase tracking-[4px] text-center mb-2">Admin Login</h1>
        <p className="text-center text-white/60 text-sm mb-8">Restricted access for billing and menu control.</p>
        {!canUseAdminApi && (
          <p className="text-center text-amber-300/90 text-xs mb-6">
            Connect a backend API and set VITE_API_BASE to enable admin authentication here.
          </p>
        )}

        <div className="space-y-5">
          <div>
            <label className="block text-[10px] uppercase tracking-[3px] text-white/60 mb-2 font-bold">Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-[#ef8f2f]"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[3px] text-white/60 mb-2 font-bold">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-[#ef8f2f]"
            />
          </div>

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#ef8f2f] text-[#121212] font-bebas text-2xl tracking-[3px] uppercase rounded-full py-4 disabled:opacity-50"
          >
            {saving ? 'Signing in...' : 'Enter Admin Dashboard'}
          </button>
        </div>
      </form>
    </main>
  );
}
