import React, { useEffect, useState, useMemo } from 'react';
import { Search, User, Mail, Phone, Calendar, ShoppingBag, DollarSign, Tag, TrendingUp } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

export default function CustomersPage() {
  const { token } = useAuth();
  const tokenRequired = token || '';
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('lifetime_spend');

  const loadData = async () => {
    if (!tokenRequired) return;
    setLoading(true);
    try {
      const custRes = await apiRequest<any>('/admin/customers', { token: tokenRequired });
      setCustomers(custRes.customers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [tokenRequired]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const search = searchTerm.toLowerCase();
      return (c.name?.toLowerCase() || '').includes(search) || 
             (c.phone || '').includes(search) || 
             (c.email?.toLowerCase() || '').includes(search);
    }).sort((a, b) => {
      if (sortField === 'lifetime_spend') return (b.lifetime_spend || 0) - (a.lifetime_spend || 0);
      if (sortField === 'total_orders') return (b.total_orders || 0) - (a.total_orders || 0);
      if (sortField === 'recent') return new Date(b.last_order || 0).getTime() - new Date(a.last_order || 0).getTime();
      return 0;
    });
  }, [customers, searchTerm, sortField]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Customers</h1>
          <p className="text-zinc-400 mt-1">Manage your customer database and track lifetime value.</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search by name, phone, or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-4 py-2 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
          />
        </div>
        
        <div className="flex gap-3">
          <select value={sortField} onChange={e => setSortField(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-zinc-300 focus:outline-none focus:border-orange-500">
            <option value="lifetime_spend">Highest Spend</option>
            <option value="total_orders">Most Orders</option>
            <option value="recent">Most Recent</option>
          </select>
        </div>
      </div>

      <div className="flex justify-between items-center text-sm font-medium text-zinc-400 px-1">
        <span>Showing {filteredCustomers.length} Customers</span>
      </div>

      {/* Data Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-800/50 border-b border-zinc-800">
                <th className="p-4 text-sm font-semibold text-zinc-400">Customer</th>
                <th className="p-4 text-sm font-semibold text-zinc-400 text-center">Total Orders</th>
                <th className="p-4 text-sm font-semibold text-zinc-400 text-right">Lifetime Spend</th>
                <th className="p-4 text-sm font-semibold text-zinc-400 text-center">Coupons</th>
                <th className="p-4 text-sm font-semibold text-zinc-400 text-right">Last Order</th>
                <th className="p-4 text-sm font-semibold text-zinc-400 text-right">Joined Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-zinc-500">Loading customers...</td></tr>
              ) : filteredCustomers.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-zinc-500">No customers found.</td></tr>
              ) : (
                filteredCustomers.map(c => (
                  <tr key={c.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold text-lg border border-orange-500/30">
                          {c.name ? c.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            {c.name || 'Anonymous'}
                            {c.status === 'active' ? <span className="w-2 h-2 rounded-full bg-green-500" title="Active"></span> : null}
                          </div>
                          <div className="text-xs text-zinc-500 flex items-center gap-3 mt-1">
                            {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {c.phone}</span>}
                            {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {c.email}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center justify-center gap-1.5 bg-zinc-800 border border-zinc-700 px-3 py-1 rounded-lg">
                        <ShoppingBag className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="font-medium text-white">{c.total_orders || 0}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-black text-xl text-orange-500 flex items-center justify-end gap-1">
                        ₹{(c.lifetime_spend || 0).toLocaleString()}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center justify-center gap-1.5 bg-zinc-800 border border-zinc-700 px-3 py-1 rounded-lg">
                        <Tag className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="font-medium text-white">{c.coupons_used || 0}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="text-white font-medium">
                        {c.last_order ? new Date(c.last_order).toLocaleDateString() : 'Never'}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {c.last_order ? new Date(c.last_order).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="text-zinc-300">
                        {c.joined_date ? new Date(c.joined_date).toLocaleDateString() : 'Unknown'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
