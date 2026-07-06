import { useState, useEffect } from 'react';
import { RefreshCw, MapPin, Copy, Package, MessageCircle, Phone, Search, ChevronDown } from 'lucide-react';
import { OperationsFilterProvider, useOperationsFilter, formatOrderId } from '../../context/OperationsFilterContext';
import { RightDrawer } from '../../design-system/DrawerSystem';
import { Button } from '../../design-system/ButtonSystem';
import { supabase } from '../../lib/supabaseClient';

// ─── Constants ───────────────────────────────────────────────────────────────
function formatTime(iso: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) + ' ' + formatTime(iso);
}

function getWhatsAppMsg(order: any): string {
  const items = (order.items || []).map((i: any) => `  • ${i.name} x${i.quantity} — ₹${(i.price * i.quantity).toLocaleString()}`).join('\n');
  return encodeURIComponent(`Hello ${order.customer_name || 'there'}! 👋\n\nYour Shawarma Inn order *${formatOrderId(order)}* is confirmed.\n\n*Items:*\n${items}\n\n*Total: ₹${Number(order.total).toLocaleString()}*\n\nThank you!`);
}

// ─── Drawer Component ────────────────────────────────────────────────────────
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
    if (order) {
      navigator.clipboard.writeText(decodeURIComponent(getWhatsAppMsg(order)));
      setWaCopied(true);
      setTimeout(() => setWaCopied(false), 2000);
    }
  };

  const phone = (order.customer_phone || '').replace(/\D/g, '');

  return (
    <RightDrawer
      isOpen={!!order}
      onClose={onClose}
      title={formatOrderId(order)}
      subtitle={order.status.toUpperCase()}
      footer={
        <div className="flex flex-col gap-[16px]">
          <div className="flex gap-[12px]">
            {phone && (
              <>
                <Button variant="secondary" fullWidth onClick={() => window.open(`tel:${phone}`)}>
                  <Phone size={18} className="mr-2" /> Call
                </Button>
                <Button className="bg-[#128C7E] hover:bg-[#128C7E]/90 text-white" fullWidth onClick={() => window.open(`https://wa.me/${phone}?text=${getWhatsAppMsg(order)}`, '_blank')}>
                  <MessageCircle size={18} className="mr-2" /> WhatsApp
                </Button>
              </>
            )}
          </div>
          <div className="grid grid-cols-3 gap-[12px]">
            <Button variant={order.status === 'pending' ? 'primary' : 'secondary'} onClick={() => handleUpdate('processing')} disabled={['processing', 'completed', 'cancelled'].includes(order.status)}>
              Process
            </Button>
            <Button variant={order.status === 'processing' ? 'primary' : 'secondary'} onClick={() => handleUpdate('completed')} disabled={['completed', 'cancelled'].includes(order.status)}>
              Complete
            </Button>
            <Button variant="danger" onClick={() => handleUpdate('cancelled')} disabled={['completed', 'cancelled'].includes(order.status)}>
              Cancel
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-[32px]">
        <section>
          <h4 className="text-[12px] font-[700] text-erp-muted uppercase tracking-[1px] mb-[16px]">Customer</h4>
          <div className="bg-erp-bg border border-erp-border rounded-[16px] p-[24px]">
            <p className="font-[700] text-[16px] text-erp-text">{order.customer_name || 'Guest'}</p>
            <p className="text-[14px] text-erp-muted mt-[4px]">{order.customer_phone}</p>
          </div>
        </section>

        {order.delivery_address && (
          <section>
            <h4 className="text-[12px] font-[700] text-erp-muted uppercase tracking-[1px] mb-[16px]">Delivery</h4>
            <div className="bg-erp-bg border border-erp-border rounded-[16px] p-[24px] flex items-start gap-[16px]">
              <MapPin size={20} className="text-erp-muted mt-[2px] shrink-0" />
              <div>
                <p className="text-[15px] text-erp-text leading-relaxed">{order.delivery_address}</p>
                <button onClick={copyAddress} className="mt-[12px] text-[13px] text-erp-muted hover:text-erp-text font-[700] flex items-center gap-[8px] transition-colors">
                  <Copy size={14} /> {copied ? 'Copied!' : 'Copy Address'}
                </button>
              </div>
            </div>
          </section>
        )}

        <section>
          <h4 className="text-[12px] font-[700] text-erp-muted uppercase tracking-[1px] mb-[16px]">Order Timeline</h4>
          <div className="bg-white border border-erp-border rounded-[16px] p-[24px]">
            {history.length > 0 ? (
              <div className="relative pl-4 space-y-6 before:absolute before:inset-y-0 before:left-[7px] before:w-0.5 before:bg-erp-border">
                {history.map((event, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[20px] top-1 w-3 h-3 rounded-full border-2 border-white bg-erp-primary shadow-sm" />
                    <p className="text-sm font-[700] text-erp-text uppercase tracking-wide">
                      {event.status}
                    </p>
                    <p className="text-xs text-erp-muted mt-1">
                      {new Date(event.created_at).toLocaleString()}
                    </p>
                    {event.note && (
                      <p className="text-sm text-erp-muted mt-2 bg-erp-bg p-2 rounded-lg italic">
                        {event.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-erp-muted italic">Order placed.</p>
            )}
          </div>
        </section>

        <section>
          <h4 className="text-[12px] font-[700] text-erp-muted uppercase tracking-[1px] mb-[16px]">Order Items</h4>
          <div className="bg-white border border-erp-border rounded-[16px] overflow-hidden">
            <div className="divide-y divide-erp-border">
              {(order.items || []).map((item: any) => (
                <div key={item.id} className="flex items-center justify-between px-[24px] py-[16px]">
                  <div className="flex items-center gap-[16px]">
                    <div className="w-[40px] h-[40px] bg-erp-bg rounded-[8px] flex items-center justify-center shrink-0">
                      <Package size={18} className="text-erp-muted" />
                    </div>
                    <div>
                      <p className="text-[15px] font-[600] text-erp-text">{item.name}</p>
                      <p className="text-[13px] text-erp-muted mt-[4px]">₹{(item.price || 0).toLocaleString()} × {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-[700] text-[16px] text-erp-text">₹{((item.price || 0) * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            
            <div className="px-[24px] py-[24px] border-t border-erp-border bg-erp-bg space-y-[12px]">
              <div className="flex justify-between text-[14px] text-erp-muted font-[500]">
                <span>Subtotal</span>
                <span>₹{(order.subtotal || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-[16px] border-t border-erp-border">
                <span className="text-[13px] font-[700] text-erp-muted uppercase tracking-[1px]">Grand Total</span>
                <span className="font-[800] text-[24px] text-erp-text leading-none">₹{(order.total || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-[16px]">
            <h4 className="text-[12px] font-[700] text-erp-muted uppercase tracking-[1px]">WhatsApp Message</h4>
            <button 
              onClick={copyWaMessage}
              className="bg-[#128C7E] hover:bg-[#128C7E]/90 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
            >
              <Copy size={14} /> 
              {waCopied ? 'Copied!' : 'Copy Message'}
            </button>
          </div>
          <div className="bg-white border border-erp-border rounded-[16px] p-[24px] shadow-sm">
            <pre className="text-[13px] text-erp-text whitespace-pre-wrap font-inter leading-relaxed">
              {decodeURIComponent(getWhatsAppMsg(order))}
            </pre>
          </div>
        </section>
      </div>
    </RightDrawer>
  );
}

// ─── Main Page Content ───────────────────────────────────────────────────────
function OperationsCenterContent() {
  const { 
    search, setSearch, orders, kpi, refreshing, fetchOrders, 
    datePreset, setDatePreset, updateOrderStatus,
    customDateRange, setCustomDateRange
  } = useOperationsFilter();
  
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'processing': return 'text-[#2563EB] border-[#2563EB]';
      case 'pending': return 'text-[#EAB308] border-[#EAB308]';
      case 'completed': return 'text-[#16A34A] border-[#16A34A]';
      case 'cancelled': return 'text-[#DC2626] border-[#DC2626]';
      default: return 'text-gray-600 border-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-inter p-8 max-w-[1600px] mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#E8F5E9] flex items-center justify-center shrink-0">
            <MessageCircle className="text-[#128C7E]" size={24} />
          </div>
          <h1 className="text-2xl font-[800] text-[#1a1a1a]">WhatsApp Center</h1>
          {kpi.pending > 0 && (
            <span className="px-3 py-1 bg-[#FFF8E6] text-[#EAB308] text-xs font-[700] rounded-full border border-[#FFE4A0]">
              {kpi.pending} pending
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-[#F4F4F5] rounded-full p-1">
            {(['all', 'today', 'week', 'month', 'year', 'custom'] as const).map(preset => (
              <button
                key={preset}
                onClick={() => setDatePreset(preset)}
                className={`px-4 py-1.5 rounded-full text-xs font-[600] tracking-wide uppercase transition-all ${
                  datePreset === preset 
                    ? 'bg-[#18181B] text-white shadow-sm' 
                    : 'text-[#71717A] hover:text-[#18181B]'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          {datePreset === 'custom' && (
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                className="bg-white border border-[#E4E4E7] rounded-full px-3 py-1.5 text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                value={customDateRange.from ? customDateRange.from.split('T')[0] : ''}
                onChange={(e) => setCustomDateRange({ ...customDateRange, from: e.target.value ? new Date(e.target.value).toISOString() : null })}
              />
              <span className="text-[#A1A1AA] text-xs">to</span>
              <input 
                type="date" 
                className="bg-white border border-[#E4E4E7] rounded-full px-3 py-1.5 text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                value={customDateRange.to ? customDateRange.to.split('T')[0] : ''}
                onChange={(e) => setCustomDateRange({ ...customDateRange, to: e.target.value ? new Date(new Date(e.target.value).setHours(23, 59, 59, 999)).toISOString() : null })}
              />
            </div>
          )}

          <button 
            onClick={() => fetchOrders(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E4E4E7] rounded-full text-sm font-[600] text-[#18181B] hover:bg-[#F4F4F5] transition-colors"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {/* Total Requests */}
        <div className="bg-white rounded-3xl border border-[#F4F4F5] p-6 flex flex-col items-center justify-center text-center shadow-sm">
          <span className="text-xs font-[700] text-[#71717A] uppercase tracking-[1.5px] mb-2">Total Requests</span>
          <span className="text-5xl font-[800] text-[#18181B]">{kpi.total}</span>
        </div>
        
        {/* Pending */}
        <div className="bg-[#FFFDF6] rounded-3xl border border-[#FEF3C7] p-6 flex flex-col items-center justify-center text-center shadow-sm">
          <span className="text-xs font-[700] text-[#D97706] uppercase tracking-[1.5px] mb-2">Pending</span>
          <span className="text-5xl font-[800] text-[#D97706]">{kpi.pending}</span>
        </div>

        {/* Contacted/Processing */}
        <div className="bg-[#F4F8FF] rounded-3xl border border-[#DBEAFE] p-6 flex flex-col items-center justify-center text-center shadow-sm">
          <span className="text-xs font-[700] text-[#2563EB] uppercase tracking-[1.5px] mb-2">Contacted</span>
          <span className="text-5xl font-[800] text-[#2563EB]">{kpi.contacted}</span>
        </div>

        {/* Completed */}
        <div className="bg-[#F2FDF5] rounded-3xl border border-[#DCFCE7] p-6 flex flex-col items-center justify-center text-center shadow-sm">
          <span className="text-xs font-[700] text-[#16A34A] uppercase tracking-[1.5px] mb-2">Completed</span>
          <span className="text-5xl font-[800] text-[#16A34A]">{kpi.completed}</span>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-[#F4F4F5] overflow-hidden flex flex-col">
        
        {/* Table Header Area */}
        <div className="px-6 py-5 border-b border-[#F4F4F5] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <MessageCircle size={20} className="text-[#16A34A]" />
            <h2 className="text-lg font-[800] text-[#18181B]">Customer Requests</h2>
            <span className="px-2 py-0.5 bg-[#F4F4F5] text-[#71717A] text-xs font-[600] rounded-full">
              {kpi.total} requests
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-[#A1A1AA]" size={16} />
            <input
              type="text"
              placeholder="Search requests..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-[280px] h-[36px] bg-[#F4F4F5] border-transparent rounded-full pl-9 pr-4 text-sm font-[500] text-[#18181B] focus:bg-white focus:border-[#E4E4E7] focus:outline-none focus:ring-2 focus:ring-[#E4E4E7]/50 transition-all"
            />
          </div>
        </div>

        {/* Table List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-[#EEF6F0]">
                <th className="px-6 py-4 text-xs font-[800] text-[#173A2A] uppercase tracking-[1px] whitespace-nowrap">Order ID</th>
                <th className="px-6 py-4 text-xs font-[800] text-[#173A2A] uppercase tracking-[1px] whitespace-nowrap">Customer</th>
                <th className="px-6 py-4 text-xs font-[800] text-[#173A2A] uppercase tracking-[1px] whitespace-nowrap">Phone</th>
                <th className="px-6 py-4 text-xs font-[800] text-[#173A2A] uppercase tracking-[1px] min-w-[200px]">Address</th>
                <th className="px-6 py-4 text-xs font-[800] text-[#173A2A] uppercase tracking-[1px] whitespace-nowrap text-center">Products</th>
                <th className="px-6 py-4 text-xs font-[800] text-[#173A2A] uppercase tracking-[1px] whitespace-nowrap">Est. Total</th>
                <th className="px-6 py-4 text-xs font-[800] text-[#173A2A] uppercase tracking-[1px] whitespace-nowrap">Date & Time</th>
                <th className="px-6 py-4 text-xs font-[800] text-[#173A2A] uppercase tracking-[1px] whitespace-nowrap">Status</th>
                <th className="px-6 py-4 text-xs font-[800] text-[#173A2A] uppercase tracking-[1px] whitespace-nowrap text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F4F5]">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-[#71717A] text-sm">
                    No requests found matching your filters.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const productCount = order.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
                  
                  return (
                    <tr key={order.id} className="hover:bg-[#FAFAFA] transition-colors group">
                      <td className="px-6 py-4">
                        <span className="font-[700] text-sm text-[#18181B] whitespace-nowrap">{formatOrderId(order)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-[500] text-[#18181B]">{order.customer_name || 'Guest'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-[500] text-[#18181B]">{order.customer_phone || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-[#52525B] max-w-[250px] truncate" title={order.delivery_address || '-'}>
                          {order.delivery_address || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#F4F4F5] text-xs font-[700] text-[#52525B]">
                          {productCount}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-[700] text-[#18181B]">₹{(order.total || 0).toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-[500] text-[#52525B] whitespace-nowrap">{formatDate(order.created_at)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative inline-block w-[140px]">
                          <select
                            value={order.status.toLowerCase()}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className={`appearance-none w-full bg-transparent border border-transparent font-[700] text-[11px] uppercase tracking-[1px] px-3 py-1.5 rounded-full cursor-pointer transition-all hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${getStatusColor(order.status)}`}
                          >
                            <option value="pending" className="text-black font-semibold">PENDING</option>
                            <option value="processing" className="text-black font-semibold">PROCESSING</option>
                            <option value="completed" className="text-black font-semibold">COMPLETED</option>
                            <option value="cancelled" className="text-black font-semibold">CANCELLED</option>
                          </select>
                          <ChevronDown size={14} className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${getStatusColor(order.status).split(' ')[0]}`} />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-4 py-1.5 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] hover:bg-[#DBEAFE] text-xs font-[700] rounded-full transition-colors whitespace-nowrap"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
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
