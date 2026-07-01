import { useEffect, useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { supabase } from '../../lib/supabaseClient';
import { useSupabaseAuth } from '../../lib/runtime';
import { useAuth } from '../../hooks/useAuth';
import { resolveMenuImage, getRecoveryImage } from '../../utils/menuImages';

const ADMIN_ORDER_STATUSES = ['pending', 'accepted', 'processing', 'preparing', 'ready', 'in_transit', 'completed', 'cancelled'];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending', accepted: 'Accepted', processing: 'Processing',
  preparing: 'Preparing', ready: 'Ready', in_transit: 'In Transit',
  completed: 'Completed', cancelled: 'Cancelled',
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'text-green-500 bg-green-500/10 border-green-500/20';
    case 'pending': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    case 'processing': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    case 'in_transit': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
    case 'cancelled': return 'text-red-500 bg-red-500/10 border-red-500/20';
    default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
  }
};

export default function OrdersPage() {
  const { token } = useAuth();
  const tokenRequired = token || '';
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [drawerHistory, setDrawerHistory] = useState<any[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);

  const loadData = async () => {
    if (!tokenRequired) return;
    setLoading(true);
    setError('');
    try {
      if (useSupabaseAuth) {
        const baseQuery = supabase
          .from('orders')
          .select(
            'id, status, total, created_at, customer_name, customer_phone, delivery_address, delivery_type, coupon_code, discount_amount, notes, order_items(id, name, price, quantity)'
          )
          .order('created_at', { ascending: false });

        const { data, error: supaErr } = orderStatusFilter
          ? await baseQuery.eq('status', orderStatusFilter)
          : await baseQuery;

        if (supaErr) throw new Error(supaErr.message);
        let fetchedOrders = (data || []).map((row: any) => ({
          ...row,
          total: Number(row.total),
          order_items: (row.order_items || []).map((item: any) => ({
            ...item,
            price: Number(item.price),
            subtotal: Number(item.price) * Number(item.quantity),
          })),
        }));

        if (orderSearch) {
          const lower = orderSearch.toLowerCase();
          fetchedOrders = fetchedOrders.filter(
            (o: any) =>
              (o.customer_name && o.customer_name.toLowerCase().includes(lower)) ||
              (o.customer_phone && o.customer_phone.includes(lower)) ||
              String(o.order_number).includes(lower)
          );
        }
        setOrders(fetchedOrders);
      } else {
        const params = new URLSearchParams();
        if (orderStatusFilter) params.append('status', orderStatusFilter);
        if (orderSearch) params.append('search', orderSearch);
        const res = await apiRequest<{ items: any[] }>(`/admin/orders?${params.toString()}`, { token: tokenRequired });
        setOrders(res.items || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    const interval = setInterval(() => { void loadData(); }, 30000);
    return () => clearInterval(interval);
  }, [tokenRequired, orderSearch, orderStatusFilter]);

  const updateOrderStatus = async (orderId: number | string, newStatus: string) => {
    try {
      if (useSupabaseAuth) {
        const { error: supaErr } = await supabase
          .from('orders')
          .update({ status: newStatus })
          .eq('id', String(orderId));
        if (supaErr) throw new Error(supaErr.message);
      } else {
        await apiRequest(`/admin/orders/${orderId}/status`, {
          method: 'PATCH',
          token: tokenRequired,
          body: { status: newStatus },
        });
      }
      void loadData();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev: any) => prev ? { ...prev, status: newStatus } : prev);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const openOrderDrawer = async (order: any) => {
    setSelectedOrder(order);
    setDrawerLoading(true);
    try {
      if (useSupabaseAuth) {
        const [orderRes, historyRes] = await Promise.all([
          supabase
            .from('orders')
            .select('*, order_items(id, name, price, quantity)')
            .eq('id', order.id)
            .single(),
          supabase
            .from('order_status_history')
            .select('previous_status, status, note, created_at')
            .eq('order_id', order.id)
            .order('created_at', { ascending: true }),
        ]);
        if (orderRes.data) {
          const o = orderRes.data;
          setSelectedOrder({
            ...o,
            items: (o.order_items || []).map((item: any) => ({
              id: item.id,
              name: item.name,
              price: Number(item.price),
              quantity: Number(item.quantity),
            })),
          });
        }
        setDrawerHistory(historyRes.data || []);
      } else {
        const res = await apiRequest<{ order: any; history: any[] }>(`/admin/orders/${order.id}`, { token: tokenRequired });
        setSelectedOrder(res.order);
        setDrawerHistory(res.history || []);
      }
    } catch { /* fall back to existing order data */ }
    setDrawerLoading(false);
  };

  const closeOrderDrawer = () => {
    setSelectedOrder(null);
    setDrawerHistory([]);
  };

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-500">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-bebas text-5xl tracking-[3px] uppercase">WhatsApp Orders</h2>
            <p className="text-sm text-white/50 mt-1">Manage order lifecycle. Revenue calculates only on Completed status.</p>
          </div>
        </header>

        {error && <div className="text-red-400 bg-red-400/10 p-4 rounded-xl text-sm border border-red-400/20">{error}</div>}

        <div className="flex flex-col md:flex-row gap-4 bg-[#181818] p-4 rounded-2xl border border-white/5">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            <input
              type="text"
              placeholder="Search order #, phone, or name..."
              value={orderSearch}
              onChange={e => setOrderSearch(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f] transition-colors"
            />
          </div>
          <div className="relative w-full md:w-64">
            <select
              value={orderStatusFilter}
              onChange={e => setOrderStatusFilter(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm appearance-none focus:outline-none focus:border-[#ef8f2f] transition-colors"
            >
              <option value="">All Statuses</option>
              {ADMIN_ORDER_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" size={16} />
          </div>
        </div>

        <div className="bg-[#181818] border border-white/5 rounded-2xl overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-black/40 text-white/50 text-[10px] uppercase tracking-[2px]">
              <tr>
                <th className="p-4 text-left font-medium">Order Details</th>
                <th className="p-4 text-left font-medium">Customer</th>
                <th className="p-4 text-left font-medium">Items</th>
                <th className="p-4 text-right font-medium">Total</th>
                <th className="p-4 text-center font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && orders.length === 0 ? (
                [...Array(5)].map((_, i) => (
                  <tr key={`skel-${i}`} className="animate-pulse">
                    <td className="p-4"><div className="h-6 w-20 bg-white/10 rounded mb-2" /><div className="h-4 w-32 bg-white/5 rounded" /></td>
                    <td className="p-4"><div className="h-5 w-24 bg-white/10 rounded mb-2" /><div className="h-4 w-28 bg-white/5 rounded" /></td>
                    <td className="p-4"><div className="h-6 w-32 bg-white/10 rounded" /></td>
                    <td className="p-4"><div className="h-8 w-16 bg-white/10 rounded ml-auto" /></td>
                    <td className="p-4"><div className="h-8 w-24 bg-white/10 rounded mx-auto" /></td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-white/40">No orders found.</td></tr>
              ) : orders.map(order => (
                <tr 
                  key={order.id} 
                  className="hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => openOrderDrawer(order)}
                >
                  <td className="p-4">
                    <div className="font-bebas text-xl text-[#ef8f2f]">#{order.order_number}</div>
                    <div className="text-xs text-white/40">{new Date(order.created_at).toLocaleString()}</div>
                    <div className="text-xs mt-1 text-white/60 bg-white/5 inline-block px-2 py-0.5 rounded">{order.delivery_type.replace('_', ' ')}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold">{order.customer_name || 'Guest'}</div>
                    <div className="text-xs text-white/50">{order.customer_phone}</div>
                    {order.delivery_address && <div className="text-xs text-white/40 mt-1 max-w-[200px] line-clamp-1 hover:line-clamp-none transition-all">{order.delivery_address}</div>}
                  </td>
                  <td className="p-4 max-w-[300px]">
                    <div className="flex flex-wrap gap-1">
                      {order.items?.map((item: any) => (
                        <span key={item.id} className="text-xs bg-black/40 border border-white/10 px-2 py-1 rounded text-white/70">
                          {item.name} <span className="text-[#ef8f2f]">x{item.quantity}</span>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="font-bebas text-2xl tracking-wider">₹{order.total.toLocaleString()}</div>
                    {order.discount_amount > 0 && <div className="text-[10px] text-green-400">-{order.discount_amount} (Coupon)</div>}
                  </td>
                  <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="relative inline-block text-left w-32">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className={`w-full appearance-none px-3 py-2 border rounded-lg text-xs font-bold uppercase tracking-wider text-center cursor-pointer outline-none transition-colors ${getStatusColor(order.status)}`}
                      >
                        {ADMIN_ORDER_STATUSES.map((status) => (
                          <option key={status} value={status} className="bg-[#101010] text-white">{status.replace('_', ' ')}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" size={14} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={closeOrderDrawer} />
          <aside className="fixed right-0 top-0 h-full w-full max-w-lg bg-[#141414] border-l border-white/10 z-50 flex flex-col shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 sticky top-0 bg-[#141414]">
              <div>
                <h3 className="font-bebas text-3xl tracking-wider text-[#ef8f2f]">Order #{selectedOrder.order_number}</h3>
                <p className="text-xs text-white/40 mt-0.5">{new Date(selectedOrder.created_at).toLocaleString()}</p>
              </div>
              <button onClick={closeOrderDrawer} className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {drawerLoading && (
              <div className="p-6 text-center text-white/30 text-sm animate-pulse">Loading order details…</div>
            )}

            {!drawerLoading && (
              <div className="flex-1 p-6 space-y-6">
                <div className="bg-black/30 border border-white/5 rounded-2xl p-5 space-y-3">
                  <h4 className="text-[10px] uppercase tracking-[2px] text-white/40 mb-3">Customer</h4>
                  <p className="font-semibold text-lg">{selectedOrder.customer_name || 'Guest'}</p>
                  {selectedOrder.customer_phone && <p className="text-sm text-white/60">{selectedOrder.customer_phone}</p>}
                  {selectedOrder.customer_email && <p className="text-xs text-white/40">{selectedOrder.customer_email}</p>}
                  {selectedOrder.delivery_address && (
                    <p className="text-xs text-white/50 border-t border-white/5 pt-3">
                      <span className="text-white/30 uppercase text-[10px] tracking-wider block mb-1">{selectedOrder.delivery_type?.replace('_', ' ')}</span>
                      {selectedOrder.delivery_address}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {selectedOrder.customer_phone && (
                    <a
                      href={`tel:${selectedOrder.customer_phone}`}
                      className="flex flex-col items-center gap-1.5 p-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-xl text-green-400 text-xs font-semibold transition-colors"
                    >
                      Call
                    </a>
                  )}
                  {selectedOrder.customer_phone && (
                    <a
                      href={`https://wa.me/${selectedOrder.customer_phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1.5 p-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 rounded-xl text-[#25D366] text-xs font-semibold transition-colors"
                    >
                      WhatsApp
                    </a>
                  )}
                  <button
                    onClick={() => {
                      if (!window.confirm('Cancel this order?')) return;
                      updateOrderStatus(selectedOrder.id, 'cancelled');
                    }}
                    className="flex flex-col items-center gap-1.5 p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-400 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>

                <div className="bg-black/30 border border-white/5 rounded-2xl p-5">
                  <h4 className="text-[10px] uppercase tracking-[2px] text-white/40 mb-3">Update Status</h4>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                    className={`w-full appearance-none px-4 py-3 border rounded-xl text-sm font-bold uppercase tracking-wider cursor-pointer outline-none transition-colors ${getStatusColor(selectedOrder.status)}`}
                  >
                    {ADMIN_ORDER_STATUSES.map((s) => (
                      <option key={s} value={s} className="bg-[#101010] text-white">{STATUS_LABELS[s] || s}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-black/30 border border-white/5 rounded-2xl p-5">
                  <h4 className="text-[10px] uppercase tracking-[2px] text-white/40 mb-4">Items</h4>
                  <div className="space-y-3">
                    {(selectedOrder.items || []).map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between text-sm bg-black/20 p-2 rounded-xl">
                        <div className="flex items-center gap-3">
                          <img 
                            src={resolveMenuImage({ name: item.name, category: 'Shawarma' })} 
                            onError={(e) => { e.currentTarget.src = getRecoveryImage({ name: item.name, category: 'Shawarma' }); }}
                            alt={item.name} 
                            className="w-10 h-10 object-cover rounded-lg bg-[#181818]"
                          />
                          <span className="text-white/80">{item.name} <span className="text-[#ef8f2f] ml-1 font-bold">×{item.quantity}</span></span>
                        </div>
                        <span className="font-bebas text-lg tracking-wide pr-2">₹{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-white/5 mt-4 pt-4 space-y-1.5 text-xs text-white/50">
                    <div className="flex justify-between pt-2 border-t border-white/5 text-white font-bold text-sm">
                      <span>Total</span>
                      <span className="font-bebas text-xl text-[#ef8f2f]">₹{Number(selectedOrder.total).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {drawerHistory.length > 0 && (
                  <div className="bg-black/30 border border-white/5 rounded-2xl p-5">
                    <h4 className="text-[10px] uppercase tracking-[2px] text-white/40 mb-4">Status Timeline</h4>
                    <div className="space-y-3">
                      {drawerHistory.map((h, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 bg-white/30`} />
                            {i < drawerHistory.length - 1 && <div className="w-px flex-1 bg-white/10 mt-1.5 min-h-[20px]" />}
                          </div>
                          <div className="flex-1 pb-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold">{STATUS_LABELS[h.status] || h.status}</span>
                              <span className="text-[10px] text-white/30">{new Date(h.created_at).toLocaleTimeString()}</span>
                            </div>
                            {h.note && <p className="text-xs text-white/50 mt-0.5">{h.note}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </aside>
        </>
      )}
    </>
  );
}
