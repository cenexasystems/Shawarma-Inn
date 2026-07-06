import { useState, useEffect } from 'react';
import { BellRing, Volume2, VolumeX, Save, Play, Square, ExternalLink } from 'lucide-react';
import { useAdminContext } from '../../context/AdminContext';

export default function KDSSettingsPage() {
  const { kdsSettings, updateKDSSettings, testAlert, stopTestAlert } = useAdminContext();
  
  const [formData, setFormData] = useState(kdsSettings);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    setFormData(kdsSettings);
  }, [kdsSettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
                type === 'number' || type === 'range' ? Number(value) : 
                value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage('');
    try {
      await updateKDSSettings(formData);
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      setSaveMessage('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = () => {
    if (isTesting) {
      stopTestAlert();
      setIsTesting(false);
    } else {
      // Temporarily use formData for testing
      updateKDSSettings(formData).then(() => {
        testAlert();
        setIsTesting(true);
      });
    }
  };

  const handleRequestPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          alert('Notification permission granted!');
        } else {
          alert('Notification permission denied. Please allow it in browser settings.');
        }
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
      <header>
        <h2 className="font-bebas text-5xl tracking-[2px] uppercase text-gray-900">KDS Settings</h2>
        <p className="text-gray-500 text-sm mt-1">Configure kitchen display audio and visual alerts.</p>
      </header>

      <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 space-y-8 shadow-sm">
        
        {/* Sound URL */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[2px] text-gray-500 font-bold flex items-center gap-2">
            <BellRing size={14} /> Alert Sound URL
          </label>
          <input
            type="text"
            name="sound_url"
            value={formData.sound_url}
            onChange={handleChange}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-[#183025] transition-colors"
            placeholder="https://..."
            required
          />
          <p className="text-[10px] text-gray-500">Provide a direct URL to an mp3 or ogg file. Default is a restaurant bell.</p>
        </div>

        {/* Volume */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[2px] text-gray-500 font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              {formData.volume === 0 || formData.is_muted ? <VolumeX size={14} /> : <Volume2 size={14} />} 
              Volume ({formData.volume}%)
            </div>
          </label>
          <input
            type="range"
            name="volume"
            min="0"
            max="100"
            value={formData.volume}
            onChange={handleChange}
            disabled={formData.is_muted}
            className={`w-full accent-[#183025] ${formData.is_muted ? 'opacity-50' : ''}`}
          />
        </div>

        {/* Repeat Interval */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[2px] text-gray-500 font-bold">Repeat Interval (Seconds)</label>
          <select
            name="repeat_interval_sec"
            value={formData.repeat_interval_sec}
            onChange={handleChange}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-[#183025] transition-colors"
          >
            <option value={0}>Play once (Do not repeat)</option>
            <option value={5}>Every 5 seconds</option>
            <option value={10}>Every 10 seconds</option>
            <option value={15}>Every 15 seconds</option>
            <option value={30}>Every 30 seconds</option>
          </select>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center gap-3 p-4 border border-gray-200 bg-white rounded-xl cursor-pointer hover:bg-gray-50 transition-colors shadow-sm">
            <input
              type="checkbox"
              name="is_muted"
              checked={formData.is_muted}
              onChange={handleChange}
              className="w-4 h-4 accent-red-600"
            />
            <div>
              <p className="text-sm font-bold text-gray-900">Mute All Sounds</p>
              <p className="text-[10px] text-gray-500">Disable audio alerts entirely.</p>
            </div>
          </label>

          <div className="flex items-center justify-between gap-3 p-4 border border-gray-200 bg-white rounded-xl shadow-sm">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="enable_browser_notifications"
                checked={formData.enable_browser_notifications}
                onChange={handleChange}
                className="w-4 h-4 accent-[#183025]"
              />
              <div>
                <p className="text-sm font-bold text-gray-900">Browser Notifications</p>
                <p className="text-[10px] text-gray-500">Show desktop push notifications.</p>
              </div>
            </label>
            <button 
              type="button" 
              onClick={handleRequestPermission}
              className="text-[10px] bg-white hover:bg-gray-50 px-2 py-1 rounded border border-gray-200 text-gray-900 flex items-center gap-1 shadow-sm"
            >
              Test Perms <ExternalLink size={10} />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-6 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleTest}
            className={`px-6 py-3 rounded-xl text-xs uppercase font-bold tracking-[2px] transition-all flex items-center gap-2 ${
              isTesting 
                ? 'bg-red-600 text-white shadow-sm' 
                : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 shadow-sm'
            }`}
          >
            {isTesting ? <><Square size={16} /> Stop Test</> : <><Play size={16} /> Test Alert</>}
          </button>
          
          <div className="flex items-center gap-4">
            {saveMessage && <span className="text-xs text-green-700 font-medium">{saveMessage}</span>}
            <button
              type="submit"
              disabled={isSaving}
              className="bg-[#183025] hover:bg-[#254636] text-white px-8 py-3 rounded-xl text-sm uppercase font-bold tracking-[2px] transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
            >
              <Save size={18} /> {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
