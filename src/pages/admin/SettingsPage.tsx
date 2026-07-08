import { useEffect, useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

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
 <div className="min-h-screen bg-erp-bg font-inter p-8 ">
 <PageHeader 
 title="Settings"
 subtitle="Configure restaurant details, pricing, and operating hours."
 action={
 <Button
 onClick={handleSaveSettings}
 disabled={saving}
 icon={Save}
 >
 {saving ? 'Saving...' : 'Save Changes'}
 </Button>
 }
 />

 {error && <div className="text-erp-danger bg-erp-danger/10 p-4 rounded-[12px] text-sm border border-erp-danger/20 flex items-center gap-2 mb-6"><AlertCircle size={16}/> {error}</div>}
 {success && <div className="text-erp-success bg-erp-success/10 p-4 rounded-[12px] text-sm border border-erp-success/20 flex items-center gap-2 mb-6"><AlertCircle size={16}/> Settings saved successfully!</div>}

 {loading ? (
 <Card className="p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
 <div className="w-8 h-8 border-2 border-erp-primary border-t-transparent rounded-full animate-spin mb-4" />
 <p className="text-erp-muted uppercase tracking-[2px] font-bold text-[11px]">Loading Settings...</p>
 </Card>
 ) : (
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* General Settings */}
 <Card className="p-6">
 <h3 className="text-[11px] uppercase tracking-[2px] text-erp-muted font-bold mb-6">General & Contact</h3>
 <div className="space-y-4">
 <div>
 <label className="block text-[11px] text-erp-muted uppercase tracking-[1px] mb-2 font-bold">WhatsApp Order Number</label>
 <Input
 type="text"
 value={settings.whatsapp_number}
 onChange={(e) => updateSetting('whatsapp_number', null, e.target.value)}
 placeholder="+91..."
 />
 </div>
 </div>
 </Card>

 {/* Business Hours */}
 <Card className="p-6">
 <h3 className="text-[11px] uppercase tracking-[2px] text-erp-muted font-bold mb-6">Operating Hours</h3>
 <div className="space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-[11px] text-erp-muted uppercase tracking-[1px] mb-2 font-bold">Opening Time</label>
 <Input
 type="time"
 value={settings.business_hours.openingTime}
 onChange={(e) => updateSetting('business_hours', 'openingTime', e.target.value)}
 />
 </div>
 <div>
 <label className="block text-[11px] text-erp-muted uppercase tracking-[1px] mb-2 font-bold">Closing Time</label>
 <Input
 type="time"
 value={settings.business_hours.closingTime}
 onChange={(e) => updateSetting('business_hours', 'closingTime', e.target.value)}
 />
 </div>
 </div>
 <label className="flex items-center justify-between p-4 rounded-[14px] bg-white border border-erp-border cursor-pointer hover:bg-gray-50 transition-colors mt-4 shadow-sm group">
 <div>
 <span className="text-erp-text text-[13px] font-bold block">Temporarily Closed</span>
 <span className="text-[11px] uppercase tracking-[1px] text-erp-muted block mt-1">Pause all incoming orders</span>
 </div>
 <input
 type="checkbox"
 checked={settings.business_hours.isClosed}
 onChange={(e) => updateSetting('business_hours', 'isClosed', e.target.checked)}
 className="w-5 h-5 accent-erp-danger cursor-pointer"
 />
 </label>
 </div>
 </Card>

 {/* Pricing & Fees */}
 <Card className="p-6">
 <h3 className="text-[11px] uppercase tracking-[2px] text-erp-muted font-bold mb-6">Pricing & Fees</h3>
 <div className="space-y-4">
 <div>
 <label className="block text-[11px] text-erp-muted uppercase tracking-[1px] mb-2 font-bold">Delivery Charges (₹)</label>
 <Input
 type="number"
 value={settings.delivery_charges}
 onChange={(e) => updateSetting('delivery_charges', null, Number(e.target.value))}
 />
 </div>
 <div>
 <label className="block text-[11px] text-erp-muted uppercase tracking-[1px] mb-2 font-bold">GST Percentage (%)</label>
 <Input
 type="number"
 value={settings.gst_percentage}
 onChange={(e) => updateSetting('gst_percentage', null, Number(e.target.value))}
 />
 </div>
 </div>
 </Card>

 {/* Social Links */}
 <Card className="p-6">
 <h3 className="text-[11px] uppercase tracking-[2px] text-erp-muted font-bold mb-6">Social Links</h3>
 <div className="space-y-4">
 <div>
 <label className="block text-[11px] text-erp-muted uppercase tracking-[1px] mb-2 font-bold">Instagram URL</label>
 <Input
 type="url"
 value={settings.social_links.instagram}
 onChange={(e) => updateSetting('social_links', 'instagram', e.target.value)}
 />
 </div>
 <div>
 <label className="block text-[11px] text-erp-muted uppercase tracking-[1px] mb-2 font-bold">Facebook URL</label>
 <Input
 type="url"
 value={settings.social_links.facebook}
 onChange={(e) => updateSetting('social_links', 'facebook', e.target.value)}
 />
 </div>
 </div>
 </Card>

 {/* SEO */}
 <Card className="p-6 lg:col-span-2">
 <h3 className="text-[11px] uppercase tracking-[2px] text-erp-muted font-bold mb-6">Search Engine Optimization (SEO)</h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-4">
 <div>
 <label className="block text-[11px] text-erp-muted uppercase tracking-[1px] mb-2 font-bold">Meta Title</label>
 <Input
 type="text"
 value={settings.seo.title}
 onChange={(e) => updateSetting('seo', 'title', e.target.value)}
 />
 </div>
 <div>
 <label className="block text-[11px] text-erp-muted uppercase tracking-[1px] mb-2 font-bold">Meta Keywords</label>
 <Input
 type="text"
 value={settings.seo.keywords}
 onChange={(e) => updateSetting('seo', 'keywords', e.target.value)}
 placeholder="shawarma, food, restaurant..."
 />
 </div>
 </div>
 <div>
 <label className="block text-[11px] text-erp-muted uppercase tracking-[1px] mb-2 font-bold">Meta Description</label>
 <textarea
 value={settings.seo.description}
 onChange={(e) => updateSetting('seo', 'description', e.target.value)}
 rows={4}
 className="w-full bg-gray-50 border border-erp-border rounded-[14px] px-4 py-3 text-[14px] text-erp-text focus:outline-none focus:border-erp-primary transition-colors resize-none"
 />
 </div>
 </div>
 </Card>

 </div>
 )}
 </div>
 );
}
