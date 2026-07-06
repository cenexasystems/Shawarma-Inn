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
      // Every signed-up user is a customer, whether or not they've ordered yet.
      const [{ data: profiles, error: profilesError }, { data: orders, error: ordersError }] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, name, phone, role, created_at')
          .eq('role', 'user'),
        supabase
          .from('orders')
          .select('id, user_id, customer_name, customer_phone, customer_email, total, created_at, status')
          .not('status', 'eq', 'cancelled'),
      ]);

      if (profilesError) throw profilesError;
      if (ordersError) throw ordersError;

      const customerMap = new Map<string, any>();

      (profiles || []).forEach((profile) => {
        customerMap.set(profile.id, {
          id: profile.id,
          name: profile.name,
          phone: profile.phone,
          email: null,
          total_orders: 0,
          lifetime_spend: 0,
          last_order: null,
          joined_date: profile.created_at,
        });
      });

      (orders || []).forEach((order) => {
        const key = order.user_id || order.customer_phone || 'Unknown';

        if (!customerMap.has(key)) {
          customerMap.set(key, {
            id: key,
            name: order.customer_name,
            phone: order.customer_phone,
            email: order.customer_email,
            total_orders: 0,
            lifetime_spend: 0,
            last_order: order.created_at,
            joined_date: order.created_at,
          });
        }

        const cust = customerMap.get(key);
        cust.total_orders += 1;
        if (order.status === 'completed') {
          cust.lifetime_spend += Number(order.total || 0);
        }

        const orderDate = new Date(order.created_at).getTime();
        if (!cust.last_order || orderDate > new Date(cust.last_order).getTime()) {
          cust.last_order = order.created_at;
          // Use latest order's name/phone/email in case they updated it
          cust.name = order.customer_name || cust.name;
          cust.phone = order.customer_phone || cust.phone;
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
          <h2 className="font-bebas text-5xl tracking-[2px] uppercase text-gray-900">Customers</h2>
          <p className="text-gray-500 text-sm mt-1">Manage your customer database and track lifetime value.</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col md:flex-row gap-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search by name, phone, or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-[#183025] transition-all"
          />
        </div>
        
        <div className="flex gap-3">
          <select value={sortField} onChange={e => setSortField(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-[#183025] transition-all">
            <option value="lifetime_spend">Highest Spend</option>
            <option value="total_orders">Most Orders</option>
            <option value="recent">Most Recent</option>
          </select>
        </div>
      </div>

      <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-[1px] px-2">
        <span>Showing {filteredCustomers.length} Customers</span>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-[2px] border-b border-gray-200">
                <th className="p-4 font-bold">Customer</th>
                <th className="p-4 font-bold text-center">Total Orders</th>
                <th className="p-4 font-bold text-right">Lifetime Spend</th>
                <th className="p-4 font-bold text-right">Last Order</th>
                <th className="p-4 font-bold text-right">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={`skel-${i}`} className="animate-pulse">
                     <td className="p-4 flex gap-3"><div className="w-10 h-10 bg-gray-200 rounded-full" /><div className="w-24 h-8 bg-gray-200 rounded" /></td>
                     <td className="p-4"><div className="w-16 h-4 bg-gray-200 rounded mx-auto" /></td>
                     <td className="p-4"><div className="w-20 h-4 bg-gray-200 rounded ml-auto" /></td>
                     <td className="p-4"><div className="w-24 h-4 bg-gray-200 rounded ml-auto" /></td>
                     <td className="p-4"><div className="w-24 h-4 bg-gray-200 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : filteredCustomers.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500 font-medium text-sm">No customers found.</td></tr>
              ) : (
                filteredCustomers.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-50 text-[#183025] flex items-center justify-center font-bebas text-2xl border border-green-200">
                          {c.name ? c.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 flex items-center gap-2">
                            {c.name || 'Anonymous'}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-3 mt-1 font-medium">
                            {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {c.phone}</span>}
                            {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {c.email}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center justify-center gap-2 bg-gray-50 border border-gray-200 px-4 py-2 rounded-xl">
                        <ShoppingBag className="w-4 h-4 text-gray-400" />
                        <span className="font-bebas text-xl text-gray-900 leading-none">{c.total_orders || 0}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-bebas text-2xl text-[#183025] flex items-center justify-end gap-1">
                        ₹{(c.lifetime_spend || 0).toLocaleString()}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="text-gray-900 text-sm font-bold">
                        {c.last_order ? new Date(c.last_order).toLocaleDateString() : 'Never'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 uppercase tracking-[1px] font-bold">
                        {c.last_order ? new Date(c.last_order).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="text-gray-600 text-sm font-medium">
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
