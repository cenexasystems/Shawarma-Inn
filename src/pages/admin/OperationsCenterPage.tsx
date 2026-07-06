import { useState, useEffect } from 'react';
import { RefreshCw, MapPin, Copy, Package, MessageCircle, Phone, Search, Clock, CheckCircle } from 'lucide-react';
import { OperationsFilterProvider, useOperationsFilter, formatOrderId } from '../../context/OperationsFilterContext';
import { RightDrawer } from '../../design-system/DrawerSystem';
import { Button } from '../../components/ui/Button';
import { KPICard } from '../../components/ui/KPICard';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
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
                <Button variant="secondary" className="w-full" onClick={() => window.open(`tel:${phone}`)} icon={Phone}>
                  Call
                </Button>
                <Button className="w-full bg-[#128C7E] hover:bg-[#128C7E]/90 text-white border-none" onClick={() => window.open(`https://wa.me/${phone}?text=${getWhatsAppMsg(order)}`, '_blank')} icon={MessageCircle}>
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

  return (
    <div className="min-h-screen bg-erp-bg font-inter p-8 max-w-[1680px] mx-auto">
      
      <PageHeader 
        title="WhatsApp Center"
        subtitle="Manage and respond to customer requests in real time"
        action={
          <>
            <div className="flex items-center bg-white border border-erp-border rounded-full p-1 shadow-sm">
              {(['all', 'today', 'week', 'month', 'year', 'custom'] as const).map(preset => (
                <button
                  key={preset}
                  onClick={() => setDatePreset(preset)}
                  className={`px-4 py-1.5 rounded-full text-xs font-[600] tracking-wide transition-all ${
                    datePreset === preset 
                      ? 'bg-erp-primary text-white shadow-sm' 
                      : 'text-erp-muted hover:text-erp-text'
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

            <Button variant="secondary" onClick={() => fetchOrders(true)} icon={RefreshCw} isLoading={refreshing}>
              Refresh
            </Button>
          </>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-erp-24 mb-erp-32">
        <KPICard title="Total Requests" value={kpi.total} icon={Package} iconBgColor="bg-erp-success/10" iconColor="text-erp-success" subtitle="All time" />
        <KPICard title="Pending" value={kpi.pending} icon={Clock} iconBgColor="bg-erp-warning/10" iconColor="text-erp-warning" subtitle="Needs action" />
        <KPICard title="Contacted" value={kpi.contacted} icon={MessageCircle} iconBgColor="bg-erp-blue/10" iconColor="text-erp-blue" subtitle="In conversation" />
        <KPICard title="Completed" value={kpi.completed} icon={CheckCircle} iconBgColor="bg-erp-success/10" iconColor="text-erp-success" subtitle="Successfully done" />
      </div>

      {/* Table Section */}
      <div className="bg-erp-card rounded-erp shadow-erp border border-erp-border overflow-hidden flex flex-col">
        
        {/* Table Header Area */}
        <div className="px-erp-24 py-erp-16 border-b border-erp-border flex items-center justify-between bg-erp-card">
          <div className="flex items-center gap-3">
            <MessageCircle size={20} className="text-erp-primary" />
            <h2 className="text-[18px] font-semibold text-erp-text font-inter">Customer Requests</h2>
            <span className="px-2 py-0.5 bg-gray-100 text-erp-muted text-xs font-semibold rounded-full">
              {kpi.total} requests
            </span>
          </div>

          <div className="w-[280px]">
            <Input 
              icon={Search} 
              placeholder="Search requests..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table List */}
        <Table>
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
                      <div className="max-w-[200px] truncate" title={order.delivery_address || '-'}>
                        {order.delivery_address || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                        {productCount}
                      </span>
                    </TableCell>
                    <TableCell className="font-bold">₹{(order.total || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-erp-muted whitespace-nowrap">{formatDate(order.created_at)}</TableCell>
                    <TableCell>
                      <div className="w-[140px]">
                        <Select
                          value={order.status.toLowerCase()}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateOrderStatus(order.id, e.target.value)}
                          options={[
                            { label: 'PENDING', value: 'pending' },
                            { label: 'PROCESSING', value: 'processing' },
                            { label: 'COMPLETED', value: 'completed' },
                            { label: 'CANCELLED', value: 'cancelled' },
                          ]}
                          className={
                            order.status === 'pending' ? 'text-erp-warning border-erp-warning/20 bg-erp-warning/5' :
                            order.status === 'processing' ? 'text-erp-blue border-erp-blue/20 bg-erp-blue/5' :
                            order.status === 'completed' ? 'text-erp-success border-erp-success/20 bg-erp-success/5' :
                            'text-erp-danger border-erp-danger/20 bg-erp-danger/5'
                          }
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
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
