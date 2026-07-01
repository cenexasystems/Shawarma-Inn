import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

export default function CustomersPage() {
  const { token } = useAuth();
  const tokenRequired = token || '';
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');

  const loadData = async () => {
    if (!tokenRequired) return;
    setLoading(true);
    setError('');
    try {
      const custRes = await apiRequest<any>(`/admin/customers?search=${encodeURIComponent(customerSearch)}`, { token: tokenRequired });
      setCustomers(custRes.customers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      void loadData();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [tokenRequired, customerSearch]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="font-bebas text-5xl tracking-[3px] uppercase">Customer Management</h2>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <input
            type="text"
            placeholder="Search phone or name..."
            value={customerSearch}
            onChange={e => setCustomerSearch(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f] transition-colors"
          />
        </div>
      </header>

      {error && <div className="text-red-400 bg-red-400/10 p-4 rounded-xl text-sm border border-red-400/20">{error}</div>}

      <div className="bg-[#181818] border border-white/5 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-black/40 text-white/50 text-[10px] uppercase tracking-[2px]">
            <tr>
              <th className="p-4 text-left font-medium">Customer Info</th>
              <th className="p-4 text-center font-medium">Orders Count</th>
              <th className="p-4 text-right font-medium">Total Spend (Completed)</th>
              <th className="p-4 text-right font-medium">Last Order</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading && customers.length === 0 ? (
              [...Array(3)].map((_, i) => (
                <tr key={`skel-${i}`} className="animate-pulse">
                  <td className="p-4"><div className="h-5 w-24 bg-white/10 rounded mb-2" /></td>
                  <td className="p-4"><div className="h-5 w-12 bg-white/10 rounded mx-auto" /></td>
                  <td className="p-4"><div className="h-5 w-20 bg-white/10 rounded ml-auto" /></td>
                  <td className="p-4"><div className="h-5 w-24 bg-white/10 rounded ml-auto" /></td>
                </tr>
              ))
            ) : customers.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-white/40">No customers found.</td></tr>
            ) : (
              customers.map((c, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="font-semibold">{c.name || 'Unknown'}</div>
                    <div className="text-xs text-white/50">{c.phone}</div>
                    {c.email && <div className="text-xs text-white/40">{c.email}</div>}
                  </td>
                  <td className="p-4 text-center">
                    <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold">{c.order_count}</span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="font-bebas text-2xl text-[#ef8f2f] tracking-wider">₹{c.total_spend.toLocaleString()}</div>
                  </td>
                  <td className="p-4 text-right text-xs text-white/60">
                    {c.last_order_date ? new Date(c.last_order_date).toLocaleDateString() : 'Never'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
