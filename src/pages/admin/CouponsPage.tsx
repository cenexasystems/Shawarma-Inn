import { useEffect, useState } from 'react';
import { Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

const emptyCoupon = {
  code: '',
  discount_type: 'percentage' as 'percentage' | 'fixed',
  discount_value: '',
  min_order_value: '',
  max_discount: '',
  expiry_date: '',
  usage_limit: '',
};

export default function CouponsPage() {
  const { token } = useAuth();
  const tokenRequired = token || '';
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [coupons, setCoupons] = useState<any[]>([]);
  const [couponForm, setCouponForm] = useState(emptyCoupon);
  const [editingCouponId, setEditingCouponId] = useState<number | null>(null);

  const loadData = async () => {
    if (!tokenRequired) return;
    setLoading(true);
    setError('');
    try {
      const coupRes = await apiRequest<any>('/admin/coupons', { token: tokenRequired });
      setCoupons(coupRes.coupons || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [tokenRequired]);

  const handleCouponSubmit = async () => {
    try {
      const payload = {
        code: couponForm.code,
        discount_type: couponForm.discount_type,
        discount_value: Number(couponForm.discount_value),
        min_order_value: Number(couponForm.min_order_value),
        max_discount: couponForm.max_discount ? Number(couponForm.max_discount) : null,
        expiry_date: couponForm.expiry_date || null,
        usage_limit: couponForm.usage_limit ? Number(couponForm.usage_limit) : null,
      };
      if (editingCouponId) {
        await apiRequest(`/admin/coupons/${editingCouponId}`, { method: 'PUT', token: tokenRequired, body: payload });
      } else {
        await apiRequest('/admin/coupons', { method: 'POST', token: tokenRequired, body: payload });
      }
      setCouponForm(emptyCoupon);
      setEditingCouponId(null);
      void loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save coupon');
    }
  };

  const handleDeleteCoupon = async (id: number) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await apiRequest(`/admin/coupons/${id}`, { method: 'DELETE', token: tokenRequired });
      void loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete coupon');
    }
  };

  const handleToggleCoupon = async (id: number) => {
    try {
      await apiRequest(`/admin/coupons/${id}/disable`, { method: 'PATCH', token: tokenRequired });
      void loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to toggle coupon');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header>
        <h2 className="font-bebas text-5xl tracking-[3px] uppercase">Coupon Management</h2>
      </header>

      {error && <div className="text-red-400 bg-red-400/10 p-4 rounded-xl text-sm border border-red-400/20">{error}</div>}
      {loading && <div className="text-xs text-white/30 animate-pulse">Loading coupons…</div>}

      <div className="bg-[#181818] border border-white/5 rounded-2xl p-6">
        <h3 className="font-bebas text-2xl tracking-[2px] uppercase mb-4 text-[#ef8f2f]">{editingCouponId ? 'Edit Coupon' : 'Create Coupon'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <input type="text" placeholder="Code (e.g. SAVE10)" value={couponForm.code} onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})} className="lg:col-span-2 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f]" />
          <select value={couponForm.discount_type} onChange={e => setCouponForm({...couponForm, discount_type: e.target.value as any})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f]">
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed Amount (₹)</option>
          </select>
          <input type="number" placeholder="Discount Value" value={couponForm.discount_value} onChange={e => setCouponForm({...couponForm, discount_value: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f]" />
          <input type="number" placeholder="Min Order (₹)" value={couponForm.min_order_value} onChange={e => setCouponForm({...couponForm, min_order_value: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f]" />
          <input type="number" placeholder="Max Discount (₹)" value={couponForm.max_discount} onChange={e => setCouponForm({...couponForm, max_discount: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f]" disabled={couponForm.discount_type === 'fixed'} />
          <input type="date" value={couponForm.expiry_date} onChange={e => setCouponForm({...couponForm, expiry_date: e.target.value})} className="lg:col-span-2 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f] text-white/70" />
          <input type="number" placeholder="Usage Limit (optional)" value={couponForm.usage_limit} onChange={e => setCouponForm({...couponForm, usage_limit: e.target.value})} className="lg:col-span-2 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f]" />
        </div>
        <div className="flex gap-3">
          <button onClick={handleCouponSubmit} className="bg-[#ef8f2f] text-black px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-[#ef8f2f]/90 transition-colors">
            {editingCouponId ? 'Update Coupon' : 'Create Coupon'}
          </button>
          {editingCouponId && (
            <button onClick={() => { setEditingCouponId(null); setCouponForm(emptyCoupon); }} className="px-6 py-3 border border-white/20 rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-white/5 transition-colors">
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map(c => (
          <div key={c.id} className={`bg-[#181818] border p-6 rounded-2xl transition-all ${c.is_active ? 'border-white/10 hover:border-[#ef8f2f]/50' : 'border-red-500/20 opacity-70'}`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-bebas text-3xl tracking-widest text-[#ef8f2f]">{c.code}</h4>
                <p className="text-sm font-semibold">{c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}</p>
              </div>
              <div className="text-right text-xs text-white/50">
                <p>Uses: {c.usage_count} {c.usage_limit ? `/ ${c.usage_limit}` : ''}</p>
                {c.expiry_date && <p>Expires: {new Date(c.expiry_date).toLocaleDateString()}</p>}
              </div>
            </div>
            <div className="text-xs text-white/50 mb-4 space-y-1">
              {c.min_order_value > 0 && <p>Min Order: ₹{c.min_order_value}</p>}
              {c.max_discount > 0 && c.discount_type === 'percentage' && <p>Max Discount: ₹{c.max_discount}</p>}
            </div>
            
            <div className="grid grid-cols-3 gap-2 bg-black/40 p-3 rounded-xl mb-4 border border-white/5">
              <div className="text-center">
                <p className="text-[10px] uppercase text-white/40 tracking-wider">Usage</p>
                <p className="font-bebas text-lg tracking-wider text-[#ef8f2f]">{c.total_usage || 0}</p>
              </div>
              <div className="text-center border-l border-r border-white/10">
                <p className="text-[10px] uppercase text-white/40 tracking-wider">Revenue</p>
                <p className="font-bebas text-lg tracking-wider text-green-400">₹{c.revenue_generated?.toLocaleString() || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase text-white/40 tracking-wider">Given</p>
                <p className="font-bebas text-lg tracking-wider text-red-400">₹{c.discount_given?.toLocaleString() || 0}</p>
              </div>
            </div>
            <div className="flex justify-between items-center border-t border-white/5 pt-4">
               <button onClick={() => handleToggleCoupon(c.id)} className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${c.is_active ? 'text-green-400' : 'text-red-400'}`}>
                  {c.is_active ? <><CheckCircle size={14} /> Active</> : <><XCircle size={14} /> Disabled</>}
                </button>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingCouponId(c.id); setCouponForm({ code: c.code, discount_type: c.discount_type, discount_value: String(c.discount_value), min_order_value: String(c.min_order_value), max_discount: c.max_discount ? String(c.max_discount) : '', expiry_date: c.expiry_date ? c.expiry_date.slice(0, 10) : '', usage_limit: c.usage_limit ? String(c.usage_limit) : '' }); }} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDeleteCoupon(c.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors text-red-400">
                    <Trash2 size={16} />
                  </button>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
