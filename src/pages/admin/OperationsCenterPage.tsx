import { useState, useEffect } from 'react';
import { RefreshCw, Copy, Package, MessageCircle, Phone, Search, Clock, CheckCircle, ReceiptText } from 'lucide-react';
import { OperationsFilterProvider, useOperationsFilter, formatOrderId } from '../../context/OperationsFilterContext';
import { RightDrawer } from '../../design-system/DrawerSystem';
import { Button } from '../../components/ui/Button';
import { KPICard } from '../../components/ui/KPICard';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { StatusSelect, type OrderStatus } from '../../components/ui/StatusSelect';
import { Input } from '../../components/ui/Input';
import { WhatsAppLogo } from '../../components/icons/WhatsAppLogo';
import { supabase } from '../../lib/supabaseClient';

function formatTime(iso: string): string {
 if (!iso) return '';
 return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDate(iso: string): string {
 if (!iso) return '';
 const d = new Date(iso);
 return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) + ' ' + formatTime(iso);
}

function money(value: unknown): string {
 return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function getOrderSubtotal(order: any): number {
 const itemSubtotal = (order.items || []).reduce(
 (sum: number, item: any) => sum + Number(item.price || 0) * Number(item.quantity || 0),
 0,
 );
 return Number(order.subtotal ?? itemSubtotal ?? 0);
}

function getOrderBill(order: any) {
 const subtotal = getOrderSubtotal(order);
 const discount = Number(order.discount_amount || 0);
 const packing = Number(order.packing_charge || 0);
 const gst = Number(order.gst || 0);
 const total = Number(order.total || 0);
 const isStorePickup = order.delivery_type === 'store_pickup' || order.delivery_address === 'STORE PICKUP';
 const deliveryCharge = Math.max(0, total - (subtotal - discount + packing + gst));

 return {
 subtotal,
 discount,
 packing,
 gst,
 total,
 couponCode: order.coupon_code,
 isStorePickup,
 deliveryCharge,
 };
}

function getDetailedWhatsAppMsg(order: any): string {
 const bill = getOrderBill(order);
 const items = (order.items || [])
 .map((i: any) => `• ${i.name} x${i.quantity} = ${money(Number(i.price || 0) * Number(i.quantity || 0))}`)
 .join('\n');
 const discountLine = bill.discount > 0 ? `\nCoupon (${bill.couponCode || 'Applied'}): -${money(bill.discount)}` : '';
 const deliveryLine = bill.isStorePickup
 ? '\nDelivery Charge: Not applicable for store pickup'
 : bill.deliveryCharge > 0
 ? `\nDelivery Charge: ${money(bill.deliveryCharge)}`
 : '\nDelivery Charge: To be confirmed';

 return encodeURIComponent(
 `Hello ${order.customer_name || 'there'}!\n\n` +
 `Your Shawarma Inn order *${formatOrderId(order)}* is confirmed.\n\n` +
 `*Customer*\nName: ${order.customer_name || 'Guest'}\nPhone: ${order.customer_phone || '-'}\nAddress: ${order.delivery_address || '-'}\n\n` +
 `*Items*\n${items}\n\n` +
 `*Bill Summary*\nNormal Bill Amount: ${money(bill.subtotal)}${discountLine}\nPacking Charge: ${money(bill.packing)}${bill.gst > 0 ? `\nGST: ${money(bill.gst)}` : ''}${deliveryLine}\n*Final Payable: ${money(bill.total)}*\n\n` +
 `Thank you!`,
 );
}

function OrderDrawer({ order, onClose }: { order: any; onClose: () => void }) {
 const { updateOrderStatus } = useOperationsFilter();
 const [copied, setCopied] = useState(false);
 const [waCopied, setWaCopied] = useState(false);
 const [history, setHistory] = useState<any[]>([]);

 useEffect(() => {
 if (order?.id) {
 supabase
 .from('order_status_history')
 .select('previous_status, status, note, created_at')
 .eq('order_id', order.id)
 .order('created_at', { ascending: true })
 .then(({ data }) => setHistory(data || []));
 } else {
 setHistory([]);
 }
 }, [order?.id]);

 if (!order) return null;

 const bill = getOrderBill(order);
 const phone = (order.customer_phone || '').replace(/\D/g, '');

 const handleUpdate = async (status: string) => {
 await updateOrderStatus(order.id, status);
 const { data } = await supabase
 .from('order_status_history')
 .select('previous_status, status, note, created_at')
 .eq('order_id', order.id)
 .order('created_at', { ascending: true });
 setHistory(data || []);
 };

 const copyAddress = () => {
 if (order.delivery_address) {
 navigator.clipboard.writeText(order.delivery_address);
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 }
 };

 const copyWaMessage = () => {
 navigator.clipboard.writeText(decodeURIComponent(getDetailedWhatsAppMsg(order)));
 setWaCopied(true);
 setTimeout(() => setWaCopied(false), 2000);
 };

 return (
 <RightDrawer
 isOpen={!!order}
 onClose={onClose}
 title={formatOrderId(order)}
 subtitle={order.status.toUpperCase()}
 width="1120px"
 footer={
 <div className="flex flex-col gap-[16px]">
 <div className="flex gap-[12px]">
 {phone && (
 <>
 <Button variant="secondary" className="w-full" onClick={() => window.open(`tel:${phone}`)} icon={Phone}>
 Call
 </Button>
 <Button className="w-full bg-[#128C7E] hover:bg-[#128C7E]/90 text-white border-none" onClick={() => window.open(`https://wa.me/${phone}?text=${getDetailedWhatsAppMsg(order)}`, '_blank')} icon={MessageCircle}>
 WhatsApp
 </Button>
 </>
 )}
 </div>
 <div className="grid grid-cols-3 gap-erp-12">
 <Button variant={order.status === 'pending' ? 'primary' : 'secondary'} className="w-full" onClick={() => handleUpdate('processing')} disabled={['processing', 'completed', 'cancelled'].includes(order.status)}>
 Process
 </Button>
 <Button variant={order.status === 'processing' ? 'primary' : 'secondary'} className="w-full" onClick={() => handleUpdate('completed')} disabled={['completed', 'cancelled'].includes(order.status)}>
 Complete
 </Button>
 <Button variant="danger" className="w-full" onClick={() => handleUpdate('cancelled')} disabled={['completed', 'cancelled'].includes(order.status)}>
 Cancel
 </Button>
 </div>
 </div>
 }
 >
 <div className="space-y-[24px]">
 <section className="bg-white border border-erp-border rounded-[24px] p-[24px] shadow-erp">
 <div className="grid gap-[16px] md:grid-cols-3">
 <div>
 <p className="text-[12px] font-[600] text-erp-muted uppercase tracking-[0.12em]">Name</p>
 <p className="mt-[8px] text-[15px] font-[700] text-erp-text">{order.customer_name || 'Guest'}</p>
 </div>
 <div>
 <p className="text-[12px] font-[600] text-erp-muted uppercase tracking-[0.12em]">Phone</p>
 <p className="mt-[8px] text-[15px] font-[700] text-erp-text">{order.customer_phone || '-'}</p>
 </div>
 <div>
 <p className="text-[12px] font-[600] text-erp-muted uppercase tracking-[0.12em]">Address</p>
 <div className="mt-[8px] flex items-start gap-[8px]">
 <p className="text-[15px] font-[700] leading-relaxed text-erp-text">{order.delivery_address || '-'}</p>
 {order.delivery_address && (
 <button onClick={copyAddress} className="mt-[2px] text-erp-muted hover:text-erp-text" title="Copy address">
 <Copy size={15} />
 </button>
 )}
 </div>
 {copied && <p className="mt-[4px] text-[12px] font-[600] text-erp-success">Address copied</p>}
 </div>
 </div>
 </section>

 <section className="bg-white border border-erp-border rounded-[24px] p-[24px] shadow-erp">
 <div className="overflow-x-auto">
 <table className="w-full min-w-[760px] text-left">
 <thead>
 <tr className="bg-[#F4FAF4]">
 <th className="px-[16px] h-[48px] text-[13px] font-[700] uppercase tracking-[0.08em] text-erp-text rounded-l-[16px]">Product</th>
 <th className="px-[16px] h-[48px] text-[13px] font-[700] uppercase tracking-[0.08em] text-erp-text">Qty</th>
 <th className="px-[16px] h-[48px] text-[13px] font-[700] uppercase tracking-[0.08em] text-erp-text">Unit Price</th>
 <th className="px-[16px] h-[48px] text-[13px] font-[700] uppercase tracking-[0.08em] text-erp-text text-right rounded-r-[16px]">Line Total</th>
 </tr>
 </thead>
 <tbody>
 {(order.items || []).map((item: any) => (
 <tr key={item.id} className="border-b border-erp-border last:border-b-0">
 <td className="px-[16px] py-[18px]">
 <div className="flex items-center gap-[12px]">
 <div className="h-[40px] w-[40px] rounded-[12px] bg-erp-bg border border-erp-border flex items-center justify-center text-erp-muted">
 <Package size={18} />
 </div>
 <span className="text-[15px] font-[700] text-erp-text">{item.name}</span>
 </div>
 </td>
 <td className="px-[16px] py-[18px] text-[15px] font-[700] text-erp-text">{item.quantity}</td>
 <td className="px-[16px] py-[18px] text-[15px] font-[600] text-erp-text">{money(item.price)}</td>
 <td className="px-[16px] py-[18px] text-right text-[15px] font-[800] text-erp-text">{money(Number(item.price || 0) * Number(item.quantity || 0))}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 <div className="mt-[24px] rounded-[18px] border border-erp-border bg-[#FAFBFC] p-[20px]">
 <div className="space-y-[12px] text-[15px]">
 <div className="flex items-center justify-between font-[600] text-erp-muted">
 <span>Normal bill amount</span>
 <span className="text-erp-text">{money(bill.subtotal)}</span>
 </div>
 {bill.discount > 0 && (
 <div className="flex items-center justify-between font-[600] text-erp-success">
 <span>Coupon {bill.couponCode ? `(${bill.couponCode})` : 'discount'}</span>
 <span>-{money(bill.discount)}</span>
 </div>
 )}
 {bill.packing > 0 && (
 <div className="flex items-center justify-between font-[600] text-erp-muted">
 <span>Packing charge</span>
 <span className="text-erp-text">{money(bill.packing)}</span>
 </div>
 )}
 {bill.gst > 0 && (
 <div className="flex items-center justify-between font-[600] text-erp-muted">
 <span>GST</span>
 <span className="text-erp-text">{money(bill.gst)}</span>
 </div>
 )}
 <div className="flex items-center justify-between font-[600] text-erp-muted">
 <span>{bill.isStorePickup ? 'Delivery charge' : 'Delivery charge note'}</span>
 <span className={bill.isStorePickup ? 'text-erp-muted' : 'text-erp-warning'}>
 {bill.isStorePickup ? 'Not applicable for store pickup' : bill.deliveryCharge > 0 ? money(bill.deliveryCharge) : 'Will be applied if arranged'}
 </span>
 </div>
 <div className="flex items-center justify-between border-t border-erp-border pt-[16px]">
 <span className="text-[13px] font-[700] text-erp-muted uppercase tracking-[0.12em]">Coupon discounted bill amount</span>
 <span className="text-[30px] font-[800] leading-none text-erp-text">{money(bill.total)}</span>
 </div>
 </div>
 </div>
 </section>

 <section className="bg-white border border-erp-border rounded-[24px] p-[24px] shadow-erp">
 <div className="flex items-center justify-between mb-[16px]">
 <div className="flex items-center gap-[10px]">
 <ReceiptText size={20} className="text-erp-primary" />
 <h4 className="text-[12px] font-[700] text-erp-text uppercase tracking-[0.12em]">WhatsApp Message</h4>
 </div>
 <button
 onClick={copyWaMessage}
 className="bg-[#12B981] hover:bg-[#10A371] text-white px-[16px] h-[36px] rounded-[16px] text-[13px] font-[700] flex items-center gap-2 transition-colors shadow-sm"
 >
 <Copy size={14} />
 {waCopied ? 'Copied' : 'Copy Message'}
 </button>
 </div>
 <div className="bg-[#FBFAF7] border border-erp-border rounded-[18px] p-[24px]">
 <pre className="text-[14px] text-erp-text whitespace-pre-wrap leading-[1.8]">
 {decodeURIComponent(getDetailedWhatsAppMsg(order))}
 </pre>
 </div>
 </section>

 <section className="bg-white border border-erp-border rounded-[24px] p-[24px] shadow-erp">
 <h4 className="text-[12px] font-[700] text-erp-muted uppercase tracking-[0.12em] mb-[16px]">Order Timeline</h4>
 {history.length > 0 ? (
 <div className="relative pl-4 space-y-6 before:absolute before:inset-y-0 before:left-[7px] before:w-0.5 before:bg-erp-border">
 {history.map((event, idx) => (
 <div key={idx} className="relative">
 <div className="absolute -left-[20px] top-1 w-3 h-3 rounded-full border-2 border-white bg-erp-primary shadow-sm" />
 <p className="text-sm font-[700] text-erp-text uppercase tracking-wide">{event.status}</p>
 <p className="text-xs text-erp-muted mt-1">{new Date(event.created_at).toLocaleString()}</p>
 {event.note && <p className="text-sm text-erp-muted mt-2 bg-erp-bg p-2 rounded-lg italic">{event.note}</p>}
 </div>
 ))}
 </div>
 ) : (
 <p className="text-sm text-erp-muted italic">Order placed.</p>
 )}
 </section>
 </div>
 </RightDrawer>
 );
}

function OperationsCenterContent() {
 const {
 search, setSearch, orders, kpi, refreshing, fetchOrders,
 datePreset, setDatePreset, updateOrderStatus,
 customDateRange, setCustomDateRange
 } = useOperationsFilter();

 const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

 return (
 <div className="min-h-screen bg-erp-bg p-4 md:p-6 xl:p-[32px]">
 <PageHeader
 title={
 <div className="flex items-center gap-[14px]">
 <div className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#25D366]/12 text-[#25D366]">
 <WhatsAppLogo className="h-[22px] w-[22px]" />
 </div>
 <span>WhatsApp Center</span>
 </div>
 }
 subtitle="Manage and respond to customer requests in real time"
 action={
 <>
  <div className="flex flex-wrap items-center gap-[6px] bg-transparent w-full sm:w-auto">
  {(['all', 'today', 'week', 'month', 'year', 'custom'] as const).map(preset => (
  <button
  key={preset}
  onClick={() => setDatePreset(preset)}
  className={`h-[34px] px-[12px] rounded-full text-[11px] font-[600] uppercase transition-all border ${
  datePreset === preset
  ? 'bg-erp-primary text-white border-erp-primary shadow-sm'
  : 'bg-white text-erp-muted border-erp-border hover:text-erp-text'
  }`}
  >
  {preset}
  </button>
  ))}
  </div>

 {datePreset === 'custom' && (
 <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
 <input
 type="date"
 className="bg-white border border-erp-border rounded-full px-3 py-1.5 text-xs text-erp-text focus:outline-none focus:border-erp-primary"
 value={customDateRange.from ? customDateRange.from.split('T')[0] : ''}
 onChange={(e) => setCustomDateRange({ ...customDateRange, from: e.target.value ? new Date(e.target.value).toISOString() : null })}
 />
 <span className="text-erp-muted text-xs">to</span>
 <input
 type="date"
 className="bg-white border border-erp-border rounded-full px-3 py-1.5 text-xs text-erp-text focus:outline-none focus:border-erp-primary"
 value={customDateRange.to ? customDateRange.to.split('T')[0] : ''}
 onChange={(e) => setCustomDateRange({ ...customDateRange, to: e.target.value ? new Date(new Date(e.target.value).setHours(23, 59, 59, 999)).toISOString() : null })}
 />
 </div>
 )}

  <Button variant="secondary" onClick={() => fetchOrders(true)} icon={RefreshCw} isLoading={refreshing} className="w-full sm:w-auto" size="sm">
  Refresh
  </Button>
 </>
 }
 />

  <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
  <KPICard title="Total Requests" value={kpi.total} icon={Package} iconBgColor="bg-[#173F2E]/10" iconColor="text-[#173F2E]" subtitle="All time" className="border-[#173F2E]/10 bg-[#173F2E]/[0.03]" />
  <KPICard title="Pending" value={kpi.pending} icon={Clock} iconBgColor="bg-erp-danger/10" iconColor="text-erp-danger" subtitle="Needs action" className="border-erp-danger/10 bg-erp-danger/[0.03]" />
  <KPICard title="Processing" value={kpi.contacted} icon={MessageCircle} iconBgColor="bg-[#25D366]/12" iconColor="text-[#25D366]" subtitle="In progress" className="border-[#25D366]/10 bg-[#25D366]/[0.03]" />
  <KPICard title="Completed" value={kpi.completed} icon={CheckCircle} iconBgColor="bg-erp-success/10" iconColor="text-erp-success" subtitle="Successfully done" className="border-erp-success/10 bg-erp-success/[0.03]" />
  </div>

 <div className="bg-erp-card rounded-[24px] shadow-erp border border-erp-border overflow-hidden flex flex-col">
 <div className="px-erp-24 py-erp-16 border-b border-erp-border flex flex-wrap items-center justify-between gap-4 bg-erp-card">
 <div className="flex items-center gap-3">
 <div className="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[#25D366]/12 text-[#25D366]">
 <WhatsAppLogo className="h-[18px] w-[18px]" />
 </div>
 <h2 className="text-[18px] font-semibold text-erp-text">Customer Requests</h2>
 <span className="px-2 py-0.5 bg-[#25D366]/10 text-[#1B8F49] text-xs font-semibold rounded-full">
 {kpi.total} requests
 </span>
 </div>

  <div className="w-full sm:w-[200px]">
 <Input
 icon={Search}
 placeholder="Search requests..."
 value={search}
 onChange={e => setSearch(e.target.value)}
 />
 </div>
 </div>

 <div className="hidden md:block"><Table>
 <TableHeader>
 <TableRow>
 <TableHead>Order ID</TableHead>
 <TableHead>Customer</TableHead>
 <TableHead>Phone</TableHead>
 <TableHead>Address</TableHead>
 <TableHead className="text-center">Products</TableHead>
 <TableHead>Est. Total</TableHead>
 <TableHead>Date & Time</TableHead>
 <TableHead>Status</TableHead>
 <TableHead className="text-center">Details</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {orders.length === 0 ? (
 <TableRow>
 <TableCell colSpan={9} className="text-center py-12 text-erp-muted">
 No requests found matching your filters.
 </TableCell>
 </TableRow>
 ) : (
 orders.map((order) => {
 const productCount = order.items.reduce((sum: number, item: any) => sum + item.quantity, 0);

 return (
 <TableRow key={order.id}>
 <TableCell className="font-bold whitespace-nowrap">{formatOrderId(order)}</TableCell>
 <TableCell>{order.customer_name || 'Guest'}</TableCell>
 <TableCell>{order.customer_phone || '-'}</TableCell>
 <TableCell>
 <div className="max-w-[120px] truncate text-erp-muted" title={order.delivery_address || '-'}>
 {order.delivery_address || '-'}
 </div>
 </TableCell>
 <TableCell className="text-center">
 <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-bold text-gray-600">
 {productCount}
 </span>
 </TableCell>
 <TableCell className="font-bold">{money(order.total)}</TableCell>
 <TableCell className="text-erp-muted whitespace-nowrap">{formatDate(order.created_at)}</TableCell>
 <TableCell>
 <div>
 <StatusSelect
 value={order.status.toLowerCase() as OrderStatus}
 onChange={(val) => updateOrderStatus(order.id, val)}
 />
 </div>
 </TableCell>
 <TableCell className="text-center">
 <Button variant="outline" size="sm" className="w-[66px] px-0" onClick={() => setSelectedOrder(order)}>
 View
 </Button>
 </TableCell>
 </TableRow>
 );
 })
 )}
 </TableBody>
 </Table></div>
 <div className="space-y-3 p-3 md:hidden">
  {orders.length === 0 ? <div className="py-10 text-center text-sm text-erp-muted">No requests found matching your filters.</div> : orders.map((order) => (
   <div key={order.id} className="rounded-2xl border border-erp-border bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3"><div><p className="font-bold text-erp-text">{formatOrderId(order)}</p><p className="mt-1 text-sm text-erp-muted">{order.customer_name || 'Guest'}</p><p className="text-xs text-erp-muted">{order.customer_phone || '-'}</p></div><p className="font-bold text-erp-text">{money(order.total)}</p></div>
    <div className="mt-3 flex items-center justify-between gap-3"><StatusSelect value={order.status.toLowerCase() as OrderStatus} onChange={(val) => updateOrderStatus(order.id, val)} /><Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>View</Button></div>
   </div>
  ))}
 </div>
 </div>

 <OrderDrawer
 order={selectedOrder}
 onClose={() => setSelectedOrder(null)}
 />
 </div>
 );
}

export default function OperationsCenterPage() {
 return (
 <OperationsFilterProvider>
 <OperationsCenterContent />
 </OperationsFilterProvider>
 );
}
