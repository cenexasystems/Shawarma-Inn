import { useEffect, useState } from 'react';
import { Search, ChevronDown, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
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
    case 'completed': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20 shadow-[0_0_10px_rgba(52,211,153,0.1)]';
    case 'pending': return 'text-red-400 bg-red-400/10 border-red-400/20 shadow-[0_0_10px_rgba(248,113,113,0.1)]';
    case 'processing': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20 shadow-[0_0_10px_rgba(250,204,21,0.1)]';
    case 'in_transit': return 'text-purple-400 bg-purple-400/10 border-purple-400/20 shadow-[0_0_10px_rgba(192,132,252,0.1)]';
    case 'cancelled': return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
  }
};

export default function OrdersPage() {
  const { isAdmin } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [drawerHistory, setDrawerHistory] = useState<any[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);

  const loadData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError('');
    try {
      let query = supabase
        .from('orders')
        .select(`
          id, status, total, created_at, customer_name, customer_phone, delivery_address, delivery_type, coupon_code, discount_amount, notes, order_number,
          order_items(id, name, price, quantity)
        `)
        .order('created_at', { ascending: false });

      if (orderStatusFilter) {
        query = query.eq('status', orderStatusFilter);
      }

      const { data, error: supaErr } = await query;
      if (supaErr) throw new Error(supaErr.message);

      let fetchedOrders = (data || []).map((row: any) => ({
        ...row,
        total: Number(row.total),
        items: (row.order_items || []).map((item: any) => ({
          ...item,
          price: Number(item.price),
          quantity: Number(item.quantity)
        })),
      }));

      if (orderSearch) {
        const lower = orderSearch.toLowerCase();
        fetchedOrders = fetchedOrders.filter(
          (o: any) =>
            (o.customer_name && o.customer_name.toLowerCase().includes(lower)) ||
            (o.customer_phone && o.customer_phone.includes(lower)) ||
            (o.order_number && String(o.order_number).includes(lower)) ||
            String(o.id).toLowerCase().includes(lower)
        );
      }
      setOrders(fetchedOrders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();

    if (!isAdmin) return;
    
    // Real-time listener for orders
    const channel = supabase
      .channel('public:orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          // Re-fetch data on any order change to ensure items/history are accurate
          void loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, orderSearch, orderStatusFilter]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error: supaErr } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
        
      if (supaErr) throw new Error(supaErr.message);

      // Add to status history
      await supabase.from('order_status_history').insert({
        order_id: orderId,
        status: newStatus,
        previous_status: orders.find(o => o.id === orderId)?.status || 'unknown'
      });

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev: any) => prev ? { ...prev, status: newStatus } : prev);
        
        // Refresh history
        const { data: historyRes } = await supabase
          .from('order_status_history')
          .select('previous_status, status, note, created_at')
          .eq('order_id', orderId)
          .order('created_at', { ascending: true });
        
        setDrawerHistory(historyRes || []);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const openOrderDrawer = async (order: any) => {
    setSelectedOrder(order);
    setDrawerLoading(true);
    try {
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
    } catch (err) {
      console.error(err);
    } finally {
      setDrawerLoading(false);
    }
  };

  const closeOrderDrawer = () => {
    setSelectedOrder(null);
    setDrawerHistory([]);
  };

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-500 relative z-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-bebas text-5xl tracking-[3px] uppercase flex items-center gap-3">
              Live Order Queue
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            </h2>
            <p className="text-sm text-white/50 mt-1">Real-time order tracking and lifecycle management.</p>
          </div>
        </header>

        {error && <div className="text-red-400 bg-red-400/10 p-4 rounded-xl text-sm border border-red-400/20">{error}</div>}

        <div className="flex flex-col md:flex-row gap-4 bg-[#181818] p-4 rounded-2xl border border-white/5 relative z-20">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            <input
              type="text"
              placeholder="Search order #, customer phone, or name..."
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

        <div className="bg-[#181818] border border-white/5 rounded-2xl overflow-x-auto shadow-xl relative z-20">
          <table className="w-full text-sm min-w-[900px] border-collapse">
            <thead className="bg-black/40 text-white/50 text-[10px] uppercase tracking-[2px] sticky top-0 z-20">
              <tr>
                <th className="p-5 text-left font-medium">Order Details</th>
                <th className="p-5 text-left font-medium">Customer</th>
                <th className="p-5 text-left font-medium">Items</th>
                <th className="p-5 text-right font-medium">Total</th>
                <th className="p-5 text-center font-medium">Status</th>
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
                  className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                  onClick={() => openOrderDrawer(order)}
                >
                  <td className="p-5">
                    {order.order_number ? (
                      <div className="font-bebas text-2xl text-[#ef8f2f] drop-shadow-md">#{order.order_number}</div>
                    ) : (
                      <div>
                        <div className="text-[9px] uppercase tracking-[1.5px] text-white/40">WhatsApp Request</div>
                        <div className="font-mono text-xs text-[#ef8f2f] break-all" title={order.id}>{order.id}</div>
                      </div>
                    )}
                    <div className="text-xs text-white/40 mt-1">{new Date(order.created_at).toLocaleString()}</div>
                    <div className="text-[9px] mt-2 text-white/70 bg-white/5 border border-white/10 inline-block px-2 py-0.5 rounded uppercase tracking-[1px]">{order.delivery_type?.replace('_', ' ')}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold">{order.customer_name || 'Guest'}</div>
                    <div className="text-xs text-white/50">{order.customer_phone}</div>
                    {order.delivery_address && <div className="text-[10px] text-white/40 mt-1 max-w-[200px] line-clamp-1 group-hover:line-clamp-none transition-all">{order.delivery_address}</div>}
                  </td>
                  <td className="p-4 max-w-[300px]">
                    <div className="flex flex-wrap gap-1.5">
                      {order.items?.map((item: any) => (
                        <span key={item.id} className="text-[11px] bg-black/40 border border-white/10 px-2 py-1 rounded text-white/70">
                          {item.name} <span className="text-[#ef8f2f] font-bold">x{item.quantity}</span>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="font-bebas text-2xl tracking-wider text-white">₹{order.total.toLocaleString()}</div>
                    {order.discount_amount > 0 && <div className="text-[10px] text-green-400 font-bold tracking-wide">-{order.discount_amount} (Coupon)</div>}
                  </td>
                  <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="relative inline-block text-left w-36">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className={`w-full appearance-none px-3 py-2 border rounded-xl text-[10px] font-bold uppercase tracking-wider text-center cursor-pointer outline-none transition-colors ${getStatusColor(order.status)}`}
                      >
                        {ADMIN_ORDER_STATUSES.map((status) => (
                          <option key={status} value={status} className="bg-[#121212] text-white">{STATUS_LABELS[status] || status}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" size={14} />
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
          <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm transition-opacity" onClick={closeOrderDrawer} />
          <aside className="fixed right-0 top-0 h-full w-full max-w-lg bg-[#121212] border-l border-white/10 z-50 flex flex-col shadow-2xl overflow-y-auto animate-in slide-in-from-right-full duration-300">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 sticky top-0 bg-[#121212]/95 backdrop-blur-xl z-20">
              <div className="min-w-0">
                {selectedOrder.order_number ? (
                  <h3 className="font-bebas text-4xl tracking-wider text-[#ef8f2f] leading-none">Order #{selectedOrder.order_number}</h3>
                ) : (
                  <>
                    <div className="text-[10px] uppercase tracking-[2px] text-white/40 mb-1">WhatsApp Request</div>
                    <h3 className="font-mono text-sm text-[#ef8f2f] break-all">{selectedOrder.id}</h3>
                  </>
                )}
                <p className="text-[11px] uppercase tracking-[1px] font-bold text-white/40 mt-2">{new Date(selectedOrder.created_at).toLocaleString()}</p>
              </div>
              <button onClick={closeOrderDrawer} className="p-3 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-colors bg-black/40 border border-white/5">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {drawerLoading && (
              <div className="p-12 flex justify-center">
                <div className="w-8 h-8 border-2 border-[#ef8f2f] border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!drawerLoading && (
              <div className="flex-1 p-6 space-y-6 bg-gradient-to-br from-[#121212] to-black">
                {/* Status Update Card */}
                <div className="bg-black/40 border border-white/5 rounded-2xl p-5 shadow-inner">
                  <h4 className="text-[10px] uppercase tracking-[2px] text-white/40 font-bold mb-3 flex items-center gap-2">
                    <AlertCircle size={14} className="text-[#ef8f2f]" /> Current Status
                  </h4>
                  <div className="relative">
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                      className={`w-full appearance-none px-4 py-4 border-2 rounded-xl text-sm font-bold uppercase tracking-[1px] cursor-pointer outline-none transition-all shadow-lg ${getStatusColor(selectedOrder.status)}`}
                    >
                      {ADMIN_ORDER_STATUSES.map((s) => (
                        <option key={s} value={s} className="bg-[#121212] text-white">{STATUS_LABELS[s] || s}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" size={20} />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedOrder.customer_phone && (
                    <a
                      href={`tel:${selectedOrder.customer_phone}`}
                      className="flex flex-col items-center justify-center gap-2 p-4 bg-black/40 hover:bg-white/5 border border-white/5 rounded-2xl text-white/70 hover:text-white text-[11px] font-bold uppercase tracking-[1px] transition-colors"
                    >
                      Call Customer
                    </a>
                  )}
                  {selectedOrder.customer_phone && (
                    <a
                      href={`https://wa.me/${selectedOrder.customer_phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center gap-2 p-4 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 rounded-2xl text-[#25D366] text-[11px] font-bold uppercase tracking-[1px] transition-colors"
                    >
                      WhatsApp
                    </a>
                  )}
                  <button
                    onClick={() => {
                      if (!window.confirm('Cancel this order?')) return;
                      updateOrderStatus(selectedOrder.id, 'cancelled');
                    }}
                    disabled={selectedOrder.status === 'cancelled'}
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-2xl text-red-400 text-[11px] font-bold uppercase tracking-[1px] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Cancel Order
                  </button>
                </div>

                <div className="bg-black/40 border border-white/5 rounded-2xl p-5">
                  <h4 className="text-[10px] uppercase tracking-[2px] text-white/40 font-bold mb-4">Customer Details</h4>
                  <div className="space-y-1">
                    <p className="font-bold text-xl">{selectedOrder.customer_name || 'Guest'}</p>
                    {selectedOrder.customer_phone && <p className="text-sm text-white/60">{selectedOrder.customer_phone}</p>}
                    {selectedOrder.customer_email && <p className="text-xs text-white/40">{selectedOrder.customer_email}</p>}
                  </div>
                  {selectedOrder.delivery_address && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <span className="inline-block px-2 py-1 bg-white/5 border border-white/10 rounded text-[9px] uppercase tracking-[2px] text-white/50 mb-2 font-bold">
                        {selectedOrder.delivery_type?.replace('_', ' ')}
                      </span>
                      <p className="text-sm text-white/80 leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/5">
                        {selectedOrder.delivery_address}
                      </p>
                    </div>
                  )}
                  {selectedOrder.notes && (
                     <div className="mt-4 pt-4 border-t border-white/5">
                        <span className="inline-block px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded text-[9px] uppercase tracking-[2px] text-yellow-500 mb-2 font-bold">
                          Special Instructions
                        </span>
                        <p className="text-sm text-white/80 italic bg-white/[0.02] p-3 rounded-xl border border-white/5">
                          "{selectedOrder.notes}"
                        </p>
                     </div>
                  )}
                </div>

                <div className="bg-black/40 border border-white/5 rounded-2xl p-5">
                  <h4 className="text-[10px] uppercase tracking-[2px] text-white/40 font-bold mb-4">Order Items</h4>
                  <div className="space-y-3">
                    {(selectedOrder.items || []).map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between text-sm bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                        <div className="flex items-center gap-4">
                          <img 
                            src={resolveMenuImage({ name: item.name, category: 'Shawarma' })} 
                            onError={(e) => { e.currentTarget.src = getRecoveryImage({ name: item.name, category: 'Shawarma' }); }}
                            alt={item.name} 
                            className="w-12 h-12 object-cover rounded-lg bg-[#181818]"
                          />
                          <div>
                            <p className="text-white font-bold">{item.name}</p>
                            <p className="text-[10px] text-[#ef8f2f] uppercase tracking-[1px] font-bold mt-0.5">Quantity: {item.quantity}</p>
                          </div>
                        </div>
                        <span className="font-bebas text-2xl tracking-wide text-white">₹{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t border-white/5 mt-6 pt-4 space-y-2">
                    <div className="flex justify-between text-white/50 text-xs font-bold uppercase tracking-[1px]">
                      <span>Subtotal</span>
                      <span>₹{(Number(selectedOrder.total) + Number(selectedOrder.discount_amount || 0)).toLocaleString()}</span>
                    </div>
                    {selectedOrder.discount_amount > 0 && (
                      <div className="flex justify-between text-green-400 text-xs font-bold uppercase tracking-[1px]">
                        <span>Discount ({selectedOrder.coupon_code})</span>
                        <span>-₹{selectedOrder.discount_amount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-4 mt-2 border-t border-white/5">
                      <span className="text-white/60 text-[10px] uppercase tracking-[2px] font-bold self-end">Total Amount</span>
                      <span className="font-bebas text-4xl text-[#ef8f2f] leading-none">₹{Number(selectedOrder.total).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {drawerHistory.length > 0 && (
                  <div className="bg-black/40 border border-white/5 rounded-2xl p-5 mb-8">
                    <h4 className="text-[10px] uppercase tracking-[2px] text-white/40 font-bold mb-6">Status Timeline</h4>
                    <div className="space-y-0 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-white/10 before:to-transparent">
                      {drawerHistory.map((h, i) => (
                        <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active pb-6">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-[#121212] bg-[#ef8f2f] text-black shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10" />
                          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white/[0.02] border border-white/5 p-4 rounded-xl shadow">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-sm text-white uppercase tracking-[1px]">{STATUS_LABELS[h.status] || h.status}</span>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-[1px] text-[#ef8f2f]">{new Date(h.created_at).toLocaleString()}</span>
                            {h.note && <p className="text-xs text-white/50 mt-2">{h.note}</p>}
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
