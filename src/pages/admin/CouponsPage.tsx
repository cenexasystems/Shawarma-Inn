import { useEffect, useState } from 'react';
import { Edit2, Trash2, Plus, Save } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

import { PageHeader } from '../../components/ui/PageHeader';
import { KPICard } from '../../components/ui/KPICard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import { RightDrawer } from '../../design-system/DrawerSystem';

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
  const [drawerOpen, setDrawerOpen] = useState(false);
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

  const openDrawer = (coupon: any = null) => {
    if (coupon) {
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
    } else {
      setEditingCouponId(null);
      setCouponForm(emptyCoupon);
    }
    setDrawerOpen(true);
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
      setDrawerOpen(false);
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

  const totalUses = coupons.reduce((sum, c) => sum + (c.used_count || 0), 0);
  const activeCoupons = coupons.filter(c => c.is_active).length;

  return (
    <>
      <div className="min-h-screen bg-erp-bg font-inter p-8 max-w-[1680px] mx-auto">
        <PageHeader 
          title="Coupon Management"
          subtitle="Create and track discount codes for marketing campaigns."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard title="Total Coupons" value={coupons.length} icon={Edit2} iconBgColor="bg-gray-100" iconColor="text-gray-700" />
          <KPICard title="Active Campaigns" value={activeCoupons} icon={Save} iconBgColor="bg-erp-success/10" iconColor="text-erp-success" />
          <KPICard title="Total Uses" value={totalUses} icon={Edit2} iconBgColor="bg-erp-blue/10" iconColor="text-erp-blue" />
          <KPICard title="Total Discount Given" value="₹0" icon={Edit2} iconBgColor="bg-gray-100" iconColor="text-erp-muted" />
        </div>

        {error && <div className="text-erp-danger bg-erp-danger/10 p-4 rounded-[12px] text-sm border border-erp-danger/20 mb-6">{error}</div>}

        <Card noPadding className="overflow-hidden">
          <div className="p-4 border-b border-erp-border flex justify-between items-center bg-gray-50/50">
            <h3 className="text-[14px] font-bold text-erp-text ml-2">All Coupons</h3>
            <Button onClick={() => openDrawer()} icon={Plus} size="sm">
              Create Coupon
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={`skel-${i}`} className="animate-pulse">
                    <TableCell><div className="h-5 w-24 bg-gray-200 rounded" /></TableCell>
                    <TableCell><div className="h-5 w-24 bg-gray-200 rounded" /></TableCell>
                    <TableCell><div className="h-5 w-24 bg-gray-200 rounded" /></TableCell>
                    <TableCell><div className="h-5 w-24 bg-gray-200 rounded" /></TableCell>
                    <TableCell><div className="h-5 w-16 bg-gray-200 rounded mx-auto" /></TableCell>
                    <TableCell><div className="h-5 w-24 bg-gray-200 rounded ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : coupons.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="p-16 text-center text-erp-muted font-medium">No coupons found. Create one to get started.</TableCell></TableRow>
              ) : (
                coupons.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <span className="font-manrope font-[800] text-[20px] text-erp-text tracking-tight uppercase">{row.code}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-[700] text-[15px] text-erp-text">
                        {row.discount_type === 'percentage' ? `${row.discount_value}% OFF` : `₹${row.discount_value} OFF`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-[4px]">
                        <span className="text-[14px] text-erp-text font-[600]">{row.used_count || 0} Uses</span>
                        {row.usage_limit && <span className="text-[12px] text-erp-muted font-[500]">Limit: {row.usage_limit}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {row.valid_to ? (
                        <span className="text-[14px] text-erp-text font-[500]">{new Date(row.valid_to).toLocaleDateString()}</span>
                      ) : (
                        <span className="text-[14px] text-erp-muted font-[500]">Never</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-[1px] uppercase border ${row.is_active ? 'bg-erp-success/10 text-erp-success border-erp-success/20' : 'bg-gray-100 text-erp-muted border-gray-200'}`}>
                        {row.is_active ? 'Active' : 'Expired'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-[8px]">
                        <button onClick={(e) => { e.stopPropagation(); handleToggleCoupon(row.id, row.is_active); }} className={`p-[8px] rounded-[8px] text-[12px] font-[700] uppercase tracking-[1px] ${row.is_active ? 'bg-erp-danger/10 text-erp-danger hover:bg-erp-danger/20' : 'bg-erp-success/10 text-erp-success hover:bg-erp-success/20'} transition-colors`}>
                          {row.is_active ? 'Disable' : 'Enable'}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); openDrawer(row); }} className="p-[8px] text-erp-muted hover:text-erp-text bg-erp-bg hover:bg-gray-200 rounded-[8px] transition-colors">
                          <Edit2 className="w-[18px] h-[18px]" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteCoupon(row.id); }} className="p-[8px] text-erp-danger hover:text-white bg-erp-danger/10 hover:bg-erp-danger rounded-[8px] transition-colors">
                          <Trash2 className="w-[18px] h-[18px]" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <RightDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingCouponId ? 'Edit Coupon' : 'Create New Coupon'}
        subtitle="Configure discount rules and limits"
        width="540px"
        footer={
          <Button className="w-full" onClick={handleCouponSubmit}>
            <Save size={18} className="mr-[8px]" /> {editingCouponId ? 'Update Coupon' : 'Create Coupon'}
          </Button>
        }
      >
        <div className="flex flex-col gap-[24px]">
          <div className="space-y-[12px]">
            <label className="text-[12px] uppercase tracking-[1px] font-[700] text-erp-muted">Coupon Code</label>
            <input type="text" placeholder="e.g. SAVE10" value={couponForm.code} onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})} className="w-full bg-erp-bg border border-erp-border rounded-[12px] px-[16px] h-[46px] text-[15px] text-erp-text focus:outline-none focus:border-erp-primary transition-all uppercase placeholder:text-gray-400 font-manrope font-[700] tracking-wider" />
          </div>
          
          <div className="grid grid-cols-2 gap-[24px]">
            <div className="space-y-[12px]">
              <label className="text-[12px] uppercase tracking-[1px] font-[700] text-erp-muted">Discount Type</label>
              <select value={couponForm.discount_type} onChange={e => setCouponForm({...couponForm, discount_type: e.target.value as any})} className="w-full bg-erp-bg border border-erp-border rounded-[12px] px-[16px] h-[46px] text-[15px] text-erp-text focus:outline-none focus:border-erp-primary transition-all appearance-none">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
            <div className="space-y-[12px]">
              <label className="text-[12px] uppercase tracking-[1px] font-[700] text-erp-muted">Value</label>
              <input type="number" placeholder={couponForm.discount_type === 'percentage' ? '%' : '₹'} value={couponForm.discount_value} onChange={e => setCouponForm({...couponForm, discount_value: e.target.value})} className="w-full bg-erp-bg border border-erp-border rounded-[12px] px-[16px] h-[46px] text-[18px] font-manrope font-[700] text-erp-text focus:outline-none focus:border-erp-primary transition-all placeholder:text-gray-400 placeholder:font-inter placeholder:text-[15px] placeholder:font-[500]" />
            </div>
            <div className="space-y-[12px]">
              <label className="text-[12px] uppercase tracking-[1px] font-[700] text-erp-muted">Min Order (₹)</label>
              <input type="number" placeholder="0" value={couponForm.min_order_value} onChange={e => setCouponForm({...couponForm, min_order_value: e.target.value})} className="w-full bg-erp-bg border border-erp-border rounded-[12px] px-[16px] h-[46px] text-[15px] text-erp-text focus:outline-none focus:border-erp-primary transition-all placeholder:text-gray-400" />
            </div>
            <div className="space-y-[12px]">
              <label className="text-[12px] uppercase tracking-[1px] font-[700] text-erp-muted">Max Discount (₹)</label>
              <input type="number" placeholder="Optional" value={couponForm.max_discount} onChange={e => setCouponForm({...couponForm, max_discount: e.target.value})} className="w-full bg-erp-bg border border-erp-border rounded-[12px] px-[16px] h-[46px] text-[15px] text-erp-text focus:outline-none focus:border-erp-primary transition-all disabled:opacity-50 placeholder:text-gray-400" disabled={couponForm.discount_type === 'fixed'} />
            </div>
            <div className="space-y-[12px]">
              <label className="text-[12px] uppercase tracking-[1px] font-[700] text-erp-muted">Expiry Date</label>
              <input type="date" value={couponForm.valid_to} onChange={e => setCouponForm({...couponForm, valid_to: e.target.value})} className="w-full bg-erp-bg border border-erp-border rounded-[12px] px-[16px] h-[46px] text-[15px] text-erp-text focus:outline-none focus:border-erp-primary transition-all" />
            </div>
            <div className="space-y-[12px]">
              <label className="text-[12px] uppercase tracking-[1px] font-[700] text-erp-muted">Usage Limit</label>
              <input type="number" placeholder="Optional max uses" value={couponForm.usage_limit} onChange={e => setCouponForm({...couponForm, usage_limit: e.target.value})} className="w-full bg-erp-bg border border-erp-border rounded-[12px] px-[16px] h-[46px] text-[15px] text-erp-text focus:outline-none focus:border-erp-primary transition-all placeholder:text-gray-400" />
            </div>
          </div>
        </div>
      </RightDrawer>
    </>
  );
}
