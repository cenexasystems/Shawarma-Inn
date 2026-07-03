import { useEffect, useState } from 'react';
import { Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

const emptyCoupon = {
  code: '',
  discount_type: 'percentage' as 'percentage' | 'fixed',
  discount_value: '',
  min_order_value: '',
  max_discount: '',
  valid_to: '',
  usage_limit: '',
};

export default function CouponsPage() {
  const { isAdmin } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [coupons, setCoupons] = useState<any[]>([]);
  const [couponForm, setCouponForm] = useState(emptyCoupon);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);

  const loadData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setCoupons(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [isAdmin]);

  const handleCouponSubmit = async () => {
    try {
      const payload = {
        code: couponForm.code,
        discount_type: couponForm.discount_type,
        discount_value: Number(couponForm.discount_value),
        min_order_value: Number(couponForm.min_order_value) || 0,
        max_discount: couponForm.max_discount ? Number(couponForm.max_discount) : null,
        valid_to: couponForm.valid_to || null,
        usage_limit: couponForm.usage_limit ? Number(couponForm.usage_limit) : null,
      };
      
      if (editingCouponId) {
        const { error } = await supabase
          .from('coupons')
          .update(payload)
          .eq('id', editingCouponId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('coupons')
          .insert(payload);
        if (error) throw error;
      }
      setCouponForm(emptyCoupon);
      setEditingCouponId(null);
      void loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save coupon');
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) throw error;
      void loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete coupon');
    }
  };

  const handleToggleCoupon = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !currentState })
        .eq('id', id);
      if (error) throw error;
      void loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to toggle coupon');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative z-10">
      <header>
        <h2 className="font-bebas text-5xl tracking-[3px] uppercase">Coupon Management</h2>
        <p className="text-white/50 text-sm mt-1">Create and track discount codes for marketing campaigns.</p>
      </header>

      {error && <div className="text-red-400 bg-red-400/10 p-4 rounded-xl text-sm border border-red-400/20">{error}</div>}
      
      <div className="bg-[#181818] border border-white/5 rounded-2xl p-6 shadow-xl">
        <h3 className="text-[11px] uppercase tracking-[2px] text-white/50 font-bold mb-6">{editingCouponId ? 'Edit Coupon' : 'Create New Coupon'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="lg:col-span-1">
             <label className="block text-[10px] text-white/50 uppercase tracking-wider mb-2 font-bold">Code</label>
             <input type="text" placeholder="e.g. SAVE10" value={couponForm.code} onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f] uppercase" />
          </div>
          <div className="lg:col-span-1">
             <label className="block text-[10px] text-white/50 uppercase tracking-wider mb-2 font-bold">Discount Type</label>
             <select value={couponForm.discount_type} onChange={e => setCouponForm({...couponForm, discount_type: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f] appearance-none">
               <option value="percentage">Percentage (%)</option>
               <option value="fixed">Fixed Amount (₹)</option>
             </select>
          </div>
          <div className="lg:col-span-1">
             <label className="block text-[10px] text-white/50 uppercase tracking-wider mb-2 font-bold">Value</label>
             <input type="number" placeholder={couponForm.discount_type === 'percentage' ? '%' : '₹'} value={couponForm.discount_value} onChange={e => setCouponForm({...couponForm, discount_value: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f]" />
          </div>
          <div className="lg:col-span-1">
             <label className="block text-[10px] text-white/50 uppercase tracking-wider mb-2 font-bold">Min Order (₹)</label>
             <input type="number" placeholder="0" value={couponForm.min_order_value} onChange={e => setCouponForm({...couponForm, min_order_value: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f]" />
          </div>
          <div className="lg:col-span-1">
             <label className="block text-[10px] text-white/50 uppercase tracking-wider mb-2 font-bold">Max Discount (₹)</label>
             <input type="number" placeholder="Optional" value={couponForm.max_discount} onChange={e => setCouponForm({...couponForm, max_discount: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f] disabled:opacity-50" disabled={couponForm.discount_type === 'fixed'} />
          </div>
          <div className="lg:col-span-1">
             <label className="block text-[10px] text-white/50 uppercase tracking-wider mb-2 font-bold">Expiry Date</label>
             <input type="date" value={couponForm.valid_to} onChange={e => setCouponForm({...couponForm, valid_to: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f] [color-scheme:dark]" />
          </div>
          <div className="lg:col-span-2">
             <label className="block text-[10px] text-white/50 uppercase tracking-wider mb-2 font-bold">Usage Limit</label>
             <input type="number" placeholder="Optional max uses" value={couponForm.usage_limit} onChange={e => setCouponForm({...couponForm, usage_limit: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f]" />
          </div>
        </div>
        <div className="flex gap-3 pt-4 border-t border-white/5">
          <button onClick={handleCouponSubmit} className="bg-[#ef8f2f] hover:bg-[#ef8f2f]/90 text-black px-6 py-3 rounded-xl font-bold uppercase tracking-[1px] text-sm flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(239,143,47,0.3)]">
            {editingCouponId ? 'Update Coupon' : 'Create Coupon'}
          </button>
          {editingCouponId && (
            <button onClick={() => { setEditingCouponId(null); setCouponForm(emptyCoupon); }} className="px-6 py-3 border border-white/10 rounded-xl font-bold uppercase tracking-[1px] text-sm hover:bg-white/5 transition-colors text-white/70">
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading && coupons.length === 0 ? (
          [...Array(4)].map((_, i) => (
             <div key={i} className="bg-[#181818] border border-white/5 rounded-2xl p-6 h-48 animate-pulse" />
          ))
        ) : coupons.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-[#181818] border border-white/5 rounded-2xl text-white/40">
            No coupons found.
          </div>
        ) : (
          coupons.map(c => (
            <div key={c.id} className={`bg-[#181818] border p-6 rounded-2xl transition-all relative overflow-hidden flex flex-col justify-between ${c.is_active ? 'border-white/5 hover:border-[#ef8f2f]/50' : 'border-red-500/20 opacity-60 grayscale'}`}>
              <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl pointer-events-none ${c.is_active ? 'bg-[#ef8f2f]/5 group-hover:bg-[#ef8f2f]/10' : 'bg-red-500/5'}`} />
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bebas text-3xl tracking-widest text-[#ef8f2f]">{c.code}</h4>
                    <p className="text-sm font-semibold text-white/80">{c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}</p>
                  </div>
                </div>
                
                <div className="text-[10px] uppercase tracking-[1px] font-bold text-white/50 mb-6 space-y-1">
                  <p>Uses: <span className="text-white">{c.used_count || 0}</span> {c.usage_limit ? `/ ${c.usage_limit}` : ''}</p>
                  {c.valid_to && <p>Expires: <span className="text-white">{new Date(c.valid_to).toLocaleDateString()}</span></p>}
                  {c.min_order_value > 0 && <p>Min Order: <span className="text-white">₹{c.min_order_value}</span></p>}
                  {c.max_discount > 0 && c.discount_type === 'percentage' && <p>Max Discount: <span className="text-white">₹{c.max_discount}</span></p>}
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-white/5 pt-4 relative z-10 mt-auto">
                 <button onClick={() => handleToggleCoupon(c.id, c.is_active)} className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${c.is_active ? 'text-green-400 hover:text-green-300' : 'text-red-400 hover:text-red-300'} transition-colors`}>
                    {c.is_active ? <><CheckCircle size={14} /> Active</> : <><XCircle size={14} /> Disabled</>}
                  </button>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { 
                        setEditingCouponId(c.id); 
                        setCouponForm({ 
                          code: c.code, 
                          discount_type: c.discount_type, 
                          discount_value: String(c.discount_value), 
                          min_order_value: String(c.min_order_value), 
                          max_discount: c.max_discount ? String(c.max_discount) : '', 
                          valid_to: c.valid_to ? c.valid_to.slice(0, 10) : '', 
                          usage_limit: c.usage_limit ? String(c.usage_limit) : '' 
                        }); 
                      }} 
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDeleteCoupon(c.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
