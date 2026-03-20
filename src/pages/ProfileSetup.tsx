import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [status, setStatus] = useState(user?.status || '');
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
        status,
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
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-[var(--red)]"
              placeholder="9000000000"
            />
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
            <label className="block text-[10px] font-bold uppercase tracking-[3px] text-white/60 mb-2">Status (Optional)</label>
            <input
              type="text"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-[var(--red)]"
              placeholder="Shawarma fan"
            />
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
