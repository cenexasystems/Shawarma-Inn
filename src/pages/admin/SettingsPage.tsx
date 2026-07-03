import { useEffect, useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

interface SettingsData {
  whatsapp_number: string;
  delivery_charges: number;
  gst_percentage: number;
  business_hours: {
    openingTime: string;
    closingTime: string;
    isClosed: boolean;
  };
  social_links: {
    instagram: string;
    facebook: string;
    twitter: string;
  };
  seo: {
    title: string;
    description: string;
    keywords: string;
  };
}

const DEFAULT_SETTINGS: SettingsData = {
  whatsapp_number: '',
  delivery_charges: 0,
  gst_percentage: 5,
  business_hours: { openingTime: '11:00', closingTime: '23:00', isClosed: false },
  social_links: { instagram: '', facebook: '', twitter: '' },
  seo: { title: 'Shawarma Inn', description: 'Best Shawarma in town', keywords: 'shawarma, food' }
};

export default function SettingsPage() {
  const { isAdmin } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS);

  const loadData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'global')
        .single();
        
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings({
          whatsapp_number: data.whatsapp_number || '',
          delivery_charges: Number(data.delivery_charges || 0),
          gst_percentage: Number(data.gst_percentage || 0),
          business_hours: data.business_hours || DEFAULT_SETTINGS.business_hours,
          social_links: data.social_links || DEFAULT_SETTINGS.social_links,
          seo: data.seo || DEFAULT_SETTINGS.seo,
        });
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [isAdmin]);

  const handleSaveSettings = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          id: 'global',
          whatsapp_number: settings.whatsapp_number,
          delivery_charges: settings.delivery_charges,
          gst_percentage: settings.gst_percentage,
          business_hours: settings.business_hours,
          social_links: settings.social_links,
          seo: settings.seo,
          updated_at: new Date().toISOString()
        });
        
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (section: keyof SettingsData, key: string | null, value: any) => {
    setSettings(prev => {
      if (key === null) {
        return { ...prev, [section]: value };
      }
      return {
        ...prev,
        [section]: {
          ...(prev[section] as any),
          [key]: value
        }
      };
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative z-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-bebas text-5xl tracking-[3px] uppercase">Settings</h2>
          <p className="text-sm text-white/50 mt-1">Configure restaurant details, pricing, and operating hours.</p>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="bg-[#ef8f2f] hover:bg-[#ef8f2f]/90 text-black px-6 py-3 rounded-xl font-bold uppercase tracking-[1px] text-sm flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(239,143,47,0.3)] hover:shadow-[0_0_30px_rgba(239,143,47,0.5)] disabled:opacity-50"
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </header>

      {error && <div className="text-red-400 bg-red-400/10 p-4 rounded-xl text-sm border border-red-400/20 flex items-center gap-2"><AlertCircle size={16}/> {error}</div>}
      {success && <div className="text-green-400 bg-green-400/10 p-4 rounded-xl text-sm border border-green-400/20">Settings saved successfully!</div>}

      {loading ? (
        <div className="bg-[#181818] border border-white/5 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-2 border-[#ef8f2f] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white/40 uppercase tracking-[2px] font-bold text-xs">Loading Settings...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General Settings */}
          <div className="bg-[#181818] border border-white/5 rounded-2xl p-6 shadow-xl">
            <h3 className="text-[11px] uppercase tracking-[2px] text-white/50 font-bold mb-6">General & Contact</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-white/50 uppercase tracking-wider mb-2 font-bold">WhatsApp Order Number</label>
                <input
                  type="text"
                  value={settings.whatsapp_number}
                  onChange={(e) => updateSetting('whatsapp_number', null, e.target.value)}
                  placeholder="+91..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Business Hours */}
          <div className="bg-[#181818] border border-white/5 rounded-2xl p-6 shadow-xl">
            <h3 className="text-[11px] uppercase tracking-[2px] text-white/50 font-bold mb-6">Operating Hours</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-white/50 uppercase tracking-wider mb-2 font-bold">Opening Time</label>
                  <input
                    type="time"
                    value={settings.business_hours.openingTime}
                    onChange={(e) => updateSetting('business_hours', 'openingTime', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f] transition-colors [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-white/50 uppercase tracking-wider mb-2 font-bold">Closing Time</label>
                  <input
                    type="time"
                    value={settings.business_hours.closingTime}
                    onChange={(e) => updateSetting('business_hours', 'closingTime', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f] transition-colors [color-scheme:dark]"
                  />
                </div>
              </div>
              <label className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/[0.04] transition-colors">
                <div>
                  <span className="text-white text-sm font-bold block">Temporarily Closed</span>
                  <span className="text-[10px] uppercase tracking-[1px] text-white/40 block mt-1">Pause all incoming orders</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.business_hours.isClosed}
                  onChange={(e) => updateSetting('business_hours', 'isClosed', e.target.checked)}
                  className="w-5 h-5 accent-red-500 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Pricing & Fees */}
          <div className="bg-[#181818] border border-white/5 rounded-2xl p-6 shadow-xl">
            <h3 className="text-[11px] uppercase tracking-[2px] text-white/50 font-bold mb-6">Pricing & Fees</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-white/50 uppercase tracking-wider mb-2 font-bold">Delivery Charges (₹)</label>
                <input
                  type="number"
                  value={settings.delivery_charges}
                  onChange={(e) => updateSetting('delivery_charges', null, Number(e.target.value))}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f] transition-colors font-bebas text-lg"
                />
              </div>
              <div>
                <label className="block text-[10px] text-white/50 uppercase tracking-wider mb-2 font-bold">GST Percentage (%)</label>
                <input
                  type="number"
                  value={settings.gst_percentage}
                  onChange={(e) => updateSetting('gst_percentage', null, Number(e.target.value))}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f] transition-colors font-bebas text-lg"
                />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-[#181818] border border-white/5 rounded-2xl p-6 shadow-xl">
            <h3 className="text-[11px] uppercase tracking-[2px] text-white/50 font-bold mb-6">Social Links</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-white/50 uppercase tracking-wider mb-2 font-bold">Instagram URL</label>
                <input
                  type="url"
                  value={settings.social_links.instagram}
                  onChange={(e) => updateSetting('social_links', 'instagram', e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] text-white/50 uppercase tracking-wider mb-2 font-bold">Facebook URL</label>
                <input
                  type="url"
                  value={settings.social_links.facebook}
                  onChange={(e) => updateSetting('social_links', 'facebook', e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* SEO */}
          <div className="bg-[#181818] border border-white/5 rounded-2xl p-6 shadow-xl lg:col-span-2">
            <h3 className="text-[11px] uppercase tracking-[2px] text-white/50 font-bold mb-6">Search Engine Optimization (SEO)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] text-white/50 uppercase tracking-wider mb-2 font-bold">Meta Title</label>
                  <input
                    type="text"
                    value={settings.seo.title}
                    onChange={(e) => updateSetting('seo', 'title', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-white/50 uppercase tracking-wider mb-2 font-bold">Meta Keywords</label>
                  <input
                    type="text"
                    value={settings.seo.keywords}
                    onChange={(e) => updateSetting('seo', 'keywords', e.target.value)}
                    placeholder="shawarma, food, restaurant..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f] transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-white/50 uppercase tracking-wider mb-2 font-bold">Meta Description</label>
                <textarea
                  value={settings.seo.description}
                  onChange={(e) => updateSetting('seo', 'description', e.target.value)}
                  rows={4}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f] transition-colors resize-none"
                />
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
