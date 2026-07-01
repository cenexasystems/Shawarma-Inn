import { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

export default function SettingsPage() {
  const { token } = useAuth();
  const tokenRequired = token || '';
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [settingsRows, setSettingsRows] = useState<any[]>([]);
  const [settingsDraft, setSettingsDraft] = useState<Record<string, string>>({});
  const [settingsSaving, setSettingsSaving] = useState(false);

  const loadData = async () => {
    if (!tokenRequired) return;
    setLoading(true);
    setError('');
    try {
      const settRes = await apiRequest<any>('/admin/settings', { token: tokenRequired });
      const rows = settRes.settings || [];
      setSettingsRows(rows);
      setSettingsDraft(Object.fromEntries(rows.map((r: any) => [r.key, r.value ?? ''])));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [tokenRequired]);

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try {
      await apiRequest('/admin/settings', {
        method: 'PUT',
        token: tokenRequired,
        body: { settings: settingsDraft },
      });
      void loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSettingsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-bebas text-5xl tracking-[3px] uppercase">Restaurant Settings</h2>
          <p className="text-sm text-white/50 mt-1">Configure restaurant details, pricing, and integrations.</p>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={settingsSaving}
          className="bg-[#ef8f2f] text-black px-8 py-3 rounded-full text-sm font-bold uppercase tracking-wider hover:bg-[#ef8f2f]/90 transition-colors disabled:opacity-60"
        >
          {settingsSaving ? 'Saving…' : 'Save All Changes'}
        </button>
      </header>

      {error && <div className="text-red-400 bg-red-400/10 p-4 rounded-xl text-sm border border-red-400/20">{error}</div>}

      {loading && settingsRows.length === 0 ? (
        <div className="bg-[#181818] border border-white/5 rounded-2xl p-12 text-center text-white/40 animate-pulse">
          Loading settings…
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(['general', 'contact', 'hours', 'pricing', 'ordering', 'social'] as const).map((section) => {
            const sectionRows = settingsRows.filter((r) => r.section === section);
            if (!sectionRows.length) return null;
            const sectionLabel: Record<string, string> = {
              general: 'General', contact: 'Contact', hours: 'Operating Hours',
              pricing: 'Pricing & Taxes', ordering: 'Ordering', social: 'Social & Delivery Links',
            };
            return (
              <div key={section} className="bg-[#181818] border border-white/5 rounded-2xl p-6">
                <h3 className="text-[11px] uppercase tracking-[2px] text-[#ef8f2f] mb-5 font-semibold">
                  {sectionLabel[section] || section}
                </h3>
                <div className="space-y-4">
                  {sectionRows.map((row) => (
                    <div key={row.key}>
                      <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">
                        {row.label}
                      </label>
                      {row.type === 'boolean' ? (
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setSettingsDraft((d) => ({
                              ...d,
                              [row.key]: d[row.key] === 'true' ? 'false' : 'true',
                            }))}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settingsDraft[row.key] === 'true' ? 'bg-[#ef8f2f]' : 'bg-white/10'}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${settingsDraft[row.key] === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                          <span className="text-sm text-white/70">
                            {settingsDraft[row.key] === 'true' ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      ) : (
                        <input
                          type={row.type === 'number' ? 'number' : row.type === 'url' ? 'url' : 'text'}
                          value={settingsDraft[row.key] ?? ''}
                          onChange={(e) => setSettingsDraft((d) => ({ ...d, [row.key]: e.target.value }))}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f] transition-colors"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
