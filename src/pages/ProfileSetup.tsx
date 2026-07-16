import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { useAuth } from '../hooks/useAuth';

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const saveProfile = async () => {
    setError('');

    if (!name.trim() || !phone.trim()) {
      setError('Name and phone are required.');
      return;
    }

    try {
      setSaving(true);
      await updateProfile({
        name,
        phone,
        avatar_url: avatarUrl,
        status: 'Customer',
      });
      navigate('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--black)] text-[var(--white)] flex items-center justify-center px-6 py-24">
      <SEO title="Setup Profile | Shawarma Inn" description="Setup your profile" noindex={true} />
      <div className="w-full max-w-xl bg-[var(--card-bg)] border border-[var(--border)] rounded-[28px] p-8 md:p-10 shadow-2xl">
        <h1 className="font-bebas text-5xl tracking-[4px] uppercase text-center mb-2">Profile Setup</h1>
        <p className="text-center text-sm text-white/50 mb-8">
          Complete your customer profile to continue ordering.
        </p>

        <div className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[3px] text-white/60 mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-[var(--red)]"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[3px] text-white/60 mb-2">Phone</label>
            <div className="flex items-center bg-black/40 border border-white/10 rounded-xl focus-within:border-[var(--red)] transition-all overflow-hidden">
              <span className="pl-4 pr-3 text-sm text-white/50 select-none border-r border-white/10 py-4">+91</span>
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))}
                className="flex-1 bg-transparent px-3 py-4 text-sm outline-none"
                placeholder="9000000000"
                maxLength={10}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[3px] text-white/60 mb-2">Avatar URL (Optional)</label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-[var(--red)]"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[3px] text-white/60 mb-2">Status</label>
            <div className="w-full bg-black/20 border border-white/5 rounded-xl p-4 text-sm text-white/40 flex items-center gap-2 cursor-not-allowed">
              <svg className="w-3.5 h-3.5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Customer
            </div>
          </div>

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <button
            onClick={saveProfile}
            disabled={saving}
            className="w-full mt-2 bg-[var(--red)] rounded-full py-4 font-bebas tracking-[3px] text-xl uppercase disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </main>
  );
}
