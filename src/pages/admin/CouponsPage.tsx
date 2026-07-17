import { useEffect, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
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

 const handleEdit = (coupon: any) => {
 setEditingCouponId(coupon.id);
 setCouponForm({
 code: coupon.code, 
 discount_type: coupon.discount_type, 
 discount_value: String(coupon.discount_value), 
 min_order_value: String(coupon.min_order_value), 
 max_discount: coupon.max_discount ? String(coupon.max_discount) : '', 
 valid_to: coupon.valid_to ? coupon.valid_to.slice(0, 10) : '', 
 usage_limit: coupon.usage_limit ? String(coupon.usage_limit) : '' 
 });
 window.scrollTo({ top: 0, behavior: 'smooth' });
 };

 const handleReset = () => {
 setEditingCouponId(null);
 setCouponForm(emptyCoupon);
 };

 const generateCode = () => {
 const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
 let result = '';
 for (let i = 0; i < 8; i++) {
 result += chars.charAt(Math.floor(Math.random() * chars.length));
 }
 setCouponForm(prev => ({ ...prev, code: result }));
 };

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
 handleReset();
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
 if (editingCouponId === id) handleReset();
 void loadData();
 } catch (err) {
 alert(err instanceof Error ? err.message : 'Failed to delete coupon');
 }
 };

 return (
 <div className="min-h-screen bg-[#fafafa] px-4 py-5 font-inter sm:px-6 sm:py-6 lg:p-8">
 {/* Header Area */}
 <div className="mb-6">
  <h1 className="mb-4 text-[22px] font-[700] leading-tight tracking-[-0.02em] text-[#111827]">
  Coupon Management
  </h1>
 <div className="rounded-[12px] border border-[#bfdbfe] bg-[#eff6ff] px-4 py-4 text-[13px] font-medium text-[#1d4ed8] sm:px-5">
 Coupon discount applies to product subtotal only — not delivery charge.
 </div>
 </div>

 {error && <div className="text-erp-danger bg-erp-danger/10 p-4 rounded-[12px] text-sm border border-erp-danger/20 mb-6">{error}</div>}

 <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1.35fr_1fr] xl:gap-8">
 {/* Left Column: Form */}
 <div className="rounded-[24px] border border-gray-100 bg-white p-4 shadow-sm sm:p-6 lg:p-8 xl:sticky xl:top-8">
 <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
 <h3 className="text-[13px] font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
 <Plus size={16} strokeWidth={3} /> {editingCouponId ? 'EDIT COUPON' : 'NEW COUPON'}
 </h3>
 {editingCouponId && (
 <button onClick={handleReset} className="text-[11px] font-bold text-gray-500 hover:text-gray-900 uppercase tracking-widest">
 Cancel Edit
 </button>
 )}
 </div>
 
 <div className="space-y-5 sm:space-y-6">
 <div className="space-y-[8px]">
 <label className="text-[10px] uppercase tracking-[1px] font-[800] text-gray-500 block">Coupon Code *</label>
 <div className="flex flex-col gap-2 sm:flex-row">
 <input 
 type="text" 
 placeholder="E.G. PILLOW" 
 value={couponForm.code} 
 onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})} 
 className="flex-1 bg-white border border-gray-200 rounded-[12px] px-[16px] h-[48px] text-[14px] text-gray-900 focus:outline-none focus:border-gray-900 transition-all uppercase placeholder:text-gray-300 font-[700] tracking-wider" 
 />
 <button onClick={generateCode} className="h-[48px] w-full shrink-0 rounded-[12px] bg-[#2b4236] px-4 text-[11px] font-[800] uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#1a2921] sm:w-auto sm:px-6">
 Generate
 </button>
 </div>
 </div>
 
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
 <div className="space-y-[8px]">
 <label className="text-[10px] uppercase tracking-[1px] font-[800] text-gray-500 block">Discount % *</label>
 <input 
 type="number" 
 value={couponForm.discount_value} 
 onChange={e => setCouponForm({...couponForm, discount_type: 'percentage', discount_value: e.target.value})} 
 className="w-full bg-white border border-gray-200 rounded-[12px] px-[16px] h-[48px] text-[14px] text-gray-900 focus:outline-none focus:border-gray-900 transition-all font-[700]" 
 />
 </div>
 <div className="space-y-[8px]">
 <label className="text-[10px] uppercase tracking-[1px] font-[800] text-gray-500 block">Min Order (₹)</label>
 <input 
 type="number" 
 value={couponForm.min_order_value} 
 onChange={e => setCouponForm({...couponForm, min_order_value: e.target.value})} 
 className="w-full bg-white border border-gray-200 rounded-[12px] px-[16px] h-[48px] text-[14px] text-gray-900 focus:outline-none focus:border-gray-900 transition-all font-[700]" 
 />
 </div>
 </div>

 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
 <div className="space-y-[8px]">
 <label className="text-[10px] uppercase tracking-[1px] font-[800] text-gray-500 block">Expiry Date</label>
 <input 
 type="date" 
 value={couponForm.valid_to} 
 onChange={e => setCouponForm({...couponForm, valid_to: e.target.value})} 
 className="w-full bg-white border border-gray-200 rounded-[12px] px-[16px] h-[48px] text-[14px] text-gray-900 focus:outline-none focus:border-gray-900 transition-all font-[700] text-gray-500 uppercase tracking-widest" 
 />
 </div>
 <div className="space-y-[8px]">
 <label className="text-[10px] uppercase tracking-[1px] font-[800] text-gray-500 block">Usage Limit</label>
 <input 
 type="number" 
 value={couponForm.usage_limit} 
 onChange={e => setCouponForm({...couponForm, usage_limit: e.target.value})} 
 className="w-full bg-white border border-gray-200 rounded-[12px] px-[16px] h-[48px] text-[14px] text-gray-900 focus:outline-none focus:border-gray-900 transition-all font-[700]" 
 />
 </div>
 </div>

 <div className="pt-4">
 <button onClick={handleCouponSubmit} className="w-full bg-[#2b4236] hover:bg-[#1a2921] text-white h-[56px] rounded-[16px] text-[13px] font-[800] uppercase tracking-[2px] transition-colors shadow-md">
 {editingCouponId ? 'UPDATE COUPON' : 'CREATE COUPON'}
 </button>
 </div>
 </div>
 </div>

 {/* Right Column: List */}
 <div className="rounded-[24px] border border-gray-100 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
 <div className="mb-6 flex flex-col gap-3 border-b border-gray-100 pb-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between sm:pb-6">
 <h3 className="text-[13px] font-bold text-gray-900 uppercase tracking-widest">
 ALL COUPONS ({coupons.length})
 </h3>
 <button onClick={() => loadData()} className="flex w-full items-center justify-center gap-2 text-[11px] font-[800] uppercase tracking-widest text-gray-500 transition-colors hover:text-gray-900 sm:w-auto sm:justify-start">
 <RefreshCw size={14} strokeWidth={2.5} /> Refresh
 </button>
 </div>
 
 <div className="space-y-4">
 {loading ? (
 [...Array(3)].map((_, i) => (
 <div key={i} className="animate-pulse h-[120px] bg-gray-50 rounded-[16px] border border-gray-100" />
 ))
 ) : coupons.length === 0 ? (
 <div className="text-center py-12 text-gray-500 font-medium">No coupons found. Create one to get started.</div>
 ) : (
 coupons.map(row => (
 <div key={row.id} className="flex flex-col gap-3 rounded-[16px] border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
 <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-3">
 <h4 className="max-w-full break-all font-manrope text-[18px] font-[800] leading-tight tracking-[-0.02em] text-gray-900 sm:text-[22px]">{row.code}</h4>
 {row.is_active && (
 <span className="px-2.5 py-1 rounded-[6px] text-[9px] font-[800] tracking-[1.5px] uppercase bg-[#dcfce7] text-[#166534] border border-[#bbf7d0]">
 Active
 </span>
 )}
 {!row.is_active && (
 <span className="px-2.5 py-1 rounded-[6px] text-[9px] font-[800] tracking-[1.5px] uppercase bg-gray-100 text-gray-500 border border-gray-200">
 Inactive
 </span>
 )}
 </div>
 
 <div className="flex flex-wrap items-center gap-2 break-words text-[14px] font-[700] text-gray-900">
 <span>{row.discount_type === 'percentage' ? `${row.discount_value}% off` : `₹${row.discount_value} off`}</span>
 {Number(row.min_order_value) > 0 && (
 <span className="text-gray-400 font-normal">&bull; min ₹{row.min_order_value}</span>
 )}
 </div>
 
 <div className="flex flex-wrap items-center gap-2 break-words text-[12px] font-[500] text-gray-500">
 Used {row.used_count || 0} times
 {row.valid_to && (
 <span className="text-gray-400 font-normal">&bull; expires {new Date(row.valid_to).toLocaleDateString('en-GB')}</span>
 )}
 </div>
 <div className="mt-2 flex w-full flex-col gap-2 border-t border-gray-100 pt-4 sm:flex-row">
   <button onClick={() => handleEdit(row)} className="flex-1 rounded-lg bg-blue-50 px-3 py-2 text-[12px] font-bold leading-tight text-blue-600 transition-colors hover:bg-blue-100">Edit</button>
   <button onClick={() => handleDeleteCoupon(row.id)} className="flex-1 rounded-lg bg-red-50 px-3 py-2 text-[12px] font-bold leading-tight text-red-600 transition-colors hover:bg-red-100">Delete</button>
 </div>
 </div>
 ))
 )}
 </div>
 </div>
 </div>
 </div>
 );
}
