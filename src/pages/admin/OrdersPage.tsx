import { useEffect, useState, useMemo } from 'react';
import { Search, MapPin, Phone, MessageCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { resolveMenuImage, getRecoveryImage } from '../../utils/menuImages';

import { PageLayout } from '../../design-system/PageLayout';
import { StatCard } from '../../design-system/CardSystem';
import { TableSystem, type Column } from '../../design-system/TableSystem';
import { Button } from '../../design-system/ButtonSystem';
import { RightDrawer } from '../../design-system/DrawerSystem';

import { formatOrderId } from '../../context/OperationsFilterContext';

const ADMIN_ORDER_STATUSES = ['pending', 'accepted', 'processing', 'preparing', 'ready', 'in_transit', 'completed', 'cancelled'];
const STATUS_LABELS: Record<string, string> = {
 pending: 'Pending', accepted: 'Accepted', processing: 'Processing',
 preparing: 'Preparing', ready: 'Ready', in_transit: 'In Transit',
 completed: 'Completed', cancelled: 'Cancelled',
};

function getWhatsAppMsg(order: any): string {
 const items = (order.items || []).map((i: any) => ` • ${i.name} x${i.quantity} — ₹${(i.price * i.quantity).toLocaleString()}`).join('\n');
 return encodeURIComponent(`Hello ${order.customer_name || 'there'}! 👋\n\nYour Shawarma Inn order *${formatOrderId(order)}* is confirmed.\n\n*Items:*\n${items}\n\n*Total: ₹${Number(order.total).toLocaleString()}*\n\nThank you!`);
}

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
 
 const channel = supabase
 .channel('public:orders')
 .on(
 'postgres_changes',
 { event: '*', schema: 'public', table: 'orders' },
 () => { void loadData(); }
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

 await supabase.from('order_status_history').insert({
 order_id: orderId,
 status: newStatus,
 previous_status: orders.find(o => o.id === orderId)?.status || 'unknown'
 });

 if (selectedOrder && selectedOrder.id === orderId) {
 setSelectedOrder((prev: any) => prev ? { ...prev, status: newStatus } : prev);
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

 const columns = useMemo<Column<any>[]>(() => [
 {
 header: 'Order Details',
 accessor: (row) => (
 <div>
 <span className="font-manrope font-[800] text-[18px] text-erp-text">{formatOrderId(row)}</span>
 <div className="text-[12px] text-erp-muted mt-[4px]">{new Date(row.created_at).toLocaleString()}</div>
 <div className="text-[10px] mt-[8px] text-erp-muted bg-erp-bg inline-block px-[8px] py-[4px] rounded-[6px] uppercase tracking-[1px] font-[700]">{row.delivery_type?.replace('_', ' ')}</div>
 </div>
 ),
 },
 {
 header: 'Customer',
 accessor: (row) => (
 <div>
 <div className="font-[700] text-erp-text text-[15px]">{row.customer_name || 'Guest'}</div>
 <div className="text-[13px] text-erp-muted font-[500] mt-[2px]">{row.customer_phone}</div>
 </div>
 ),
 },
 {
 header: 'Items',
 width: '30%',
 accessor: (row) => (
 <div className="flex flex-wrap gap-[8px]">
 {row.items?.map((item: any) => (
 <span key={item.id} className="text-[12px] font-[500] bg-erp-bg border border-erp-border px-[8px] py-[4px] rounded-[6px] text-erp-text">
 {item.name} <span className="text-erp-primary font-[700]">x{item.quantity}</span>
 </span>
 ))}
 </div>
 ),
 },
 {
 header: 'Total',
 align: 'right',
 accessor: (row) => (
 <div>
 <div className="font-manrope text-[20px] font-[800] text-erp-text leading-none">₹{row.total.toLocaleString()}</div>
 {row.discount_amount > 0 && <div className="text-[11px] text-erp-success font-[700] mt-[4px] uppercase tracking-[1px]">-₹{row.discount_amount} (COUPON)</div>}
 </div>
 ),
 },
 {
 header: 'Status',
 align: 'center',
 accessor: (row) => (
 <div onClick={(e) => e.stopPropagation()}>
 <select
 value={row.status}
 onChange={(e) => updateOrderStatus(row.id, e.target.value)}
 className="w-full appearance-none px-[12px] py-[8px] border border-erp-border bg-white rounded-[8px] text-[12px] font-[700] uppercase tracking-[1px] text-center cursor-pointer outline-none transition-colors shadow-sm focus:border-erp-primary"
 >
 {ADMIN_ORDER_STATUSES.map((status) => (
 <option key={status} value={status}>{STATUS_LABELS[status] || status}</option>
 ))}
 </select>
 </div>
 ),
 }
 ], []);

 return (
 <>
 <PageLayout
 title="Order Archive"
 subtitle="Historical orders and detailed lifecycle tracking."
 toolbar={
 <div className="flex flex-1 items-center justify-between gap-[24px]">
 <div className="flex items-center gap-[12px] flex-1">
 <div className="relative w-full max-w-[320px]">
 <Search className="absolute left-[12px] top-[14px] text-erp-muted" size={18} />
 <input 
 type="text" 
 placeholder="Search order #, customer phone..." 
 value={orderSearch}
 onChange={(e) => setOrderSearch(e.target.value)}
 className="w-full bg-white border border-erp-border rounded-[12px] pl-[40px] pr-[16px] h-[46px] text-[15px] font-inter text-erp-text focus:outline-none focus:border-erp-primary shadow-sm"
 />
 </div>
 <select value={orderStatusFilter} onChange={e => setOrderStatusFilter(e.target.value)} className="bg-white border border-erp-border rounded-[12px] px-[16px] h-[46px] text-[14px] font-[600] text-erp-text focus:outline-none focus:border-erp-primary shadow-sm appearance-none min-w-[200px]">
 <option value="">All Statuses</option>
 {ADMIN_ORDER_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>)}
 </select>
 </div>
 </div>
 }
 statistics={
 <>
 <StatCard title="Total Archive" value={orders.length} />
 <StatCard title="Pending" value={orders.filter(o => o.status === 'pending').length} valueColor="text-erp-warning" />
 <StatCard title="Processing" value={orders.filter(o => o.status === 'processing' || o.status === 'preparing').length} valueColor="text-erp-blue" />
 <StatCard title="Completed" value={orders.filter(o => o.status === 'completed').length} valueColor="text-erp-success" />
 </>
 }
 >
 {error && <div className="text-erp-danger bg-erp-danger/10 p-[16px] rounded-[12px] text-[15px] border border-erp-danger/20 font-inter">{error}</div>}

 <div className="bg-white rounded-erp shadow-erp overflow-hidden border border-erp-border">
 {loading ? (
 <div className="animate-pulse space-y-[4px]">
 {[...Array(5)].map((_, i) => <div key={i} className="h-[72px] bg-white border-b border-erp-border" />)}
 </div>
 ) : (
 <TableSystem 
 data={orders}
 columns={columns}
 keyExtractor={(row) => row.id}
 emptyMessage="No orders found."
 onRowClick={openOrderDrawer}
 />
 )}
 </div>
 </PageLayout>

 <RightDrawer
 isOpen={!!selectedOrder}
 onClose={closeOrderDrawer}
 title={selectedOrder ? formatOrderId(selectedOrder) : ''}
 subtitle={selectedOrder ? new Date(selectedOrder.created_at).toLocaleString() : ''}
 width="540px"
 footer={
 selectedOrder && (
 <div className="flex flex-col gap-[16px]">
 <div className="flex gap-[12px]">
 {selectedOrder.customer_phone && (
 <>
 <Button variant="secondary" fullWidth onClick={() => window.open(`tel:${selectedOrder.customer_phone.replace(/\D/g, '')}`)}>
 <Phone size={18} className="mr-[8px]" /> Call
 </Button>
 <Button className="bg-[#128C7E] hover:bg-[#128C7E]/90 text-white" fullWidth onClick={() => window.open(`https://wa.me/${selectedOrder.customer_phone.replace(/\D/g, '')}?text=${getWhatsAppMsg(selectedOrder)}`, '_blank')}>
 <MessageCircle size={18} className="mr-[8px]" /> WhatsApp
 </Button>
 </>
 )}
 </div>
 <Button 
 variant="danger" 
 fullWidth 
 onClick={() => {
 if (!window.confirm('Cancel this order?')) return;
 updateOrderStatus(selectedOrder.id, 'cancelled');
 }}
 disabled={selectedOrder?.status === 'cancelled'}
 >
 Cancel Order
 </Button>
 </div>
 )
 }
 >
 {drawerLoading && (
 <div className="flex justify-center p-[48px]">
 <div className="w-[32px] h-[32px] border-[2px] border-erp-primary border-t-transparent rounded-full animate-spin" />
 </div>
 )}

 {!drawerLoading && selectedOrder && (
 <div className="space-y-[32px]">
 
 <section>
 <h4 className="text-[12px] uppercase tracking-[1px] font-[700] text-erp-muted mb-[16px]">Current Status</h4>
 <div className="bg-erp-bg border border-erp-border rounded-[16px] p-[24px]">
 <select
 value={selectedOrder.status}
 onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
 className="w-full appearance-none px-[16px] h-[46px] border border-erp-border bg-white rounded-[12px] text-[14px] font-[700] uppercase tracking-[1px] cursor-pointer outline-none transition-colors shadow-sm focus:border-erp-primary"
 >
 {ADMIN_ORDER_STATUSES.map((s) => (
 <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
 ))}
 </select>
 </div>
 </section>

 <section>
 <h4 className="text-[12px] uppercase tracking-[1px] font-[700] text-erp-muted mb-[16px]">Customer Details</h4>
 <div className="bg-erp-bg border border-erp-border rounded-[16px] p-[24px]">
 <p className="font-[700] text-[18px] text-erp-text">{selectedOrder.customer_name || 'Guest'}</p>
 <p className="text-[15px] text-erp-muted mt-[4px]">{selectedOrder.customer_phone}</p>
 
 {selectedOrder.delivery_address && (
 <div className="mt-[16px] pt-[16px] border-t border-erp-border">
 <span className="inline-block px-[8px] py-[4px] bg-white border border-erp-border rounded-[6px] text-[10px] uppercase tracking-[1px] font-[700] text-erp-muted mb-[8px]">
 {selectedOrder.delivery_type?.replace('_', ' ')}
 </span>
 <div className="flex items-start gap-[12px] bg-white p-[16px] rounded-[12px] border border-erp-border">
 <MapPin size={18} className="text-erp-muted mt-[2px] shrink-0" />
 <p className="text-[14px] text-erp-text leading-relaxed">{selectedOrder.delivery_address}</p>
 </div>
 </div>
 )}
 
 {selectedOrder.notes && (
 <div className="mt-[16px] pt-[16px] border-t border-erp-border">
 <span className="inline-block px-[8px] py-[4px] bg-erp-warning/10 border border-erp-warning/20 rounded-[6px] text-[10px] uppercase tracking-[1px] font-[700] text-erp-warning mb-[8px]">
 Special Instructions
 </span>
 <p className="text-[14px] text-erp-text italic bg-white p-[16px] rounded-[12px] border border-erp-border">
 "{selectedOrder.notes}"
 </p>
 </div>
 )}
 </div>
 </section>

 <section>
 <h4 className="text-[12px] uppercase tracking-[1px] font-[700] text-erp-muted mb-[16px]">Order Items</h4>
 <div className="bg-white border border-erp-border rounded-[16px] overflow-hidden">
 <div className="divide-y divide-erp-border">
 {(selectedOrder.items || []).map((item: any) => (
 <div key={item.id} className="flex items-center justify-between px-[24px] py-[16px]">
 <div className="flex items-center gap-[16px]">
 <img 
 src={resolveMenuImage({ name: item.name, category: 'Shawarma' })} 
 onError={(e) => { e.currentTarget.src = getRecoveryImage({ name: item.name, category: 'Shawarma' }); }}
 alt={item.name} 
 className="w-[48px] h-[48px] object-cover rounded-[12px] bg-erp-bg border border-erp-border"
 />
 <div>
 <p className="text-[15px] font-[600] text-erp-text">{item.name}</p>
 <p className="text-[12px] font-[700] text-erp-primary uppercase tracking-[1px] mt-[4px]">Quantity: {item.quantity}</p>
 </div>
 </div>
 <span className="font-manrope font-[800] text-[18px] text-erp-text">₹{(item.price * item.quantity).toLocaleString()}</span>
 </div>
 ))}
 </div>
 
 <div className="px-[24px] py-[24px] border-t border-erp-border bg-erp-bg space-y-[12px]">
 <div className="flex justify-between text-[14px] text-erp-muted font-[500]">
 <span>Subtotal</span>
 <span className="text-erp-text font-[600]">₹{(Number(selectedOrder.total) + Number(selectedOrder.discount_amount || 0)).toLocaleString()}</span>
 </div>
 {selectedOrder.discount_amount > 0 && (
 <div className="flex justify-between text-erp-success text-[14px] font-[600]">
 <span>Discount ({selectedOrder.coupon_code})</span>
 <span>-₹{selectedOrder.discount_amount.toLocaleString()}</span>
 </div>
 )}
 <div className="flex justify-between items-end pt-[16px] border-t border-erp-border">
 <span className="text-[12px] font-[700] text-erp-muted uppercase tracking-[1px] mb-[4px]">Total Amount</span>
 <span className="font-manrope font-[800] text-[34px] text-erp-primary leading-none">₹{Number(selectedOrder.total).toLocaleString()}</span>
 </div>
 </div>
 </div>
 </section>

 {drawerHistory.length > 0 && (
 <section>
 <h4 className="text-[12px] uppercase tracking-[1px] font-[700] text-erp-muted mb-[24px]">Status Timeline</h4>
 <div className="space-y-0 relative before:absolute before:inset-0 before:ml-[11px] before:h-full before:w-[2px] before:bg-erp-border">
 {drawerHistory.map((h, i) => (
 <div key={i} className="relative flex items-center group pb-[24px] pl-[32px]">
 <div className="absolute left-0 w-[24px] h-[24px] rounded-full border-[4px] border-white bg-erp-primary shadow-sm z-10" />
 <div className="w-full bg-white border border-erp-border p-[16px] rounded-[12px] shadow-sm">
 <span className="font-[800] text-[14px] text-erp-text uppercase tracking-[1px]">{STATUS_LABELS[h.status] || h.status}</span>
 <div className="text-[11px] font-[600] uppercase tracking-[1px] text-erp-muted mt-[4px]">{new Date(h.created_at).toLocaleString()}</div>
 {h.note && <p className="text-[14px] text-erp-text mt-[8px] bg-erp-bg p-[12px] rounded-[8px]">{h.note}</p>}
 </div>
 </div>
 ))}
 </div>
 </section>
 )}

 </div>
 )}
 </RightDrawer>
 </>
 );
}
