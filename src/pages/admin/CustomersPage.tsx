import { useEffect, useState, useMemo } from 'react';
import { Search, User, Mail, Phone, ShoppingBag } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

export default function CustomersPage() {
  const { isAdmin } = useAuth();
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('lifetime_spend');

  const loadData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      // Aggregate customers from orders table
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id, customer_name, customer_phone, customer_email, total, created_at, status')
        .not('status', 'eq', 'cancelled');
        
      if (error) throw error;
      
      const customerMap = new Map<string, any>();
      
      (orders || []).forEach(order => {
        const phone = order.customer_phone || 'Unknown';
        
        if (!customerMap.has(phone)) {
          customerMap.set(phone, {
            id: phone,
            name: order.customer_name,
            phone: order.customer_phone,
            email: order.customer_email,
            total_orders: 0,
            lifetime_spend: 0,
            last_order: order.created_at,
            joined_date: order.created_at,
          });
        }
        
        const cust = customerMap.get(phone);
        cust.total_orders += 1;
        if (order.status === 'completed') {
           cust.lifetime_spend += Number(order.total || 0);
        }
        
        const orderDate = new Date(order.created_at).getTime();
        if (orderDate > new Date(cust.last_order).getTime()) {
          cust.last_order = order.created_at;
          // Use latest name/email in case they updated it
          cust.name = order.customer_name || cust.name;
          cust.email = order.customer_email || cust.email;
        }
        
        if (orderDate < new Date(cust.joined_date).getTime()) {
          cust.joined_date = order.created_at;
        }
      });

      setCustomers(Array.from(customerMap.values()));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [isAdmin]);

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
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-bebas text-5xl tracking-[3px] uppercase">Customers</h2>
          <p className="text-white/50 text-sm mt-1">Manage your customer database and track lifetime value.</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-[#181818] border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search by name, phone, or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#ef8f2f] transition-all"
          />
        </div>
        
        <div className="flex gap-3">
          <select value={sortField} onChange={e => setSortField(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ef8f2f] transition-all">
            <option value="lifetime_spend">Highest Spend</option>
            <option value="total_orders">Most Orders</option>
            <option value="recent">Most Recent</option>
          </select>
        </div>
      </div>

      <div className="flex justify-between items-center text-xs font-medium text-white/40 uppercase tracking-[1px] px-2">
        <span>Showing {filteredCustomers.length} Customers</span>
      </div>

      {/* Data Table */}
      <div className="bg-[#181818] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-black/40 text-white/50 text-[10px] uppercase tracking-[2px]">
                <th className="p-4 font-medium">Customer</th>
                <th className="p-4 font-medium text-center">Total Orders</th>
                <th className="p-4 font-medium text-right">Lifetime Spend</th>
                <th className="p-4 font-medium text-right">Last Order</th>
                <th className="p-4 font-medium text-right">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={`skel-${i}`} className="animate-pulse">
                     <td className="p-4 flex gap-3"><div className="w-10 h-10 bg-white/10 rounded-full" /><div className="w-24 h-8 bg-white/10 rounded" /></td>
                     <td className="p-4"><div className="w-16 h-4 bg-white/10 rounded mx-auto" /></td>
                     <td className="p-4"><div className="w-20 h-4 bg-white/10 rounded ml-auto" /></td>
                     <td className="p-4"><div className="w-24 h-4 bg-white/10 rounded ml-auto" /></td>
                     <td className="p-4"><div className="w-24 h-4 bg-white/10 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : filteredCustomers.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-white/40 text-sm">No customers found.</td></tr>
              ) : (
                filteredCustomers.map(c => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#ef8f2f]/10 text-[#ef8f2f] flex items-center justify-center font-bebas text-2xl border border-[#ef8f2f]/20">
                          {c.name ? c.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            {c.name || 'Anonymous'}
                          </div>
                          <div className="text-xs text-white/40 flex items-center gap-3 mt-1">
                            {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {c.phone}</span>}
                            {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {c.email}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center justify-center gap-2 bg-black/40 border border-white/5 px-4 py-2 rounded-xl">
                        <ShoppingBag className="w-4 h-4 text-white/40" />
                        <span className="font-bebas text-xl text-white leading-none">{c.total_orders || 0}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-bebas text-2xl text-[#ef8f2f] flex items-center justify-end gap-1">
                        ₹{(c.lifetime_spend || 0).toLocaleString()}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="text-white text-sm font-medium">
                        {c.last_order ? new Date(c.last_order).toLocaleDateString() : 'Never'}
                      </div>
                      <div className="text-xs text-white/40 mt-1 uppercase tracking-[1px]">
                        {c.last_order ? new Date(c.last_order).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="text-white/60 text-sm">
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
