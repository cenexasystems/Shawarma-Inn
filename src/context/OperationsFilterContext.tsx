import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';

export type DatePreset = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'all' | 'custom';

interface DateRange {
  from: string | null;
  to: string | null;
}

export interface KpiData {
  total: number;
  pending: number;
  contacted: number; // preparing, processing, accepted
  completed: number; // ready, completed
  revenue: number;
  aov: number;
}

interface OperationsFilterContextType {
  datePreset: DatePreset;
  setDatePreset: (preset: DatePreset) => void;
  customDateRange: DateRange;
  setCustomDateRange: (range: DateRange) => void;
  search: string;
  setSearch: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  deliveryFilter: string;
  setDeliveryFilter: (type: string) => void;
  
  orders: any[];
  kpi: KpiData;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  fetchOrders: (silent?: boolean) => Promise<void>;
  updateOrderStatus: (orderId: string, newStatus: string) => Promise<void>;
}

const OperationsFilterContext = createContext<OperationsFilterContextType | undefined>(undefined);

function getDateRange(preset: DatePreset, custom: DateRange): DateRange | null {
  if (preset === 'custom') return custom;
  if (preset === 'all') return null;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (preset) {
    case 'today':
      return { from: todayStart.toISOString(), to: todayEnd.toISOString() };
    case 'yesterday': {
      const ys = new Date(todayStart); ys.setDate(ys.getDate() - 1);
      const ye = new Date(todayEnd); ye.setDate(ye.getDate() - 1);
      return { from: ys.toISOString(), to: ye.toISOString() };
    }
    case 'week': {
      const ws = new Date(todayStart); ws.setDate(ws.getDate() - ws.getDay());
      return { from: ws.toISOString(), to: todayEnd.toISOString() };
    }
    case 'month': {
      const ms = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: ms.toISOString(), to: todayEnd.toISOString() };
    }
    case 'year': {
      const ys2 = new Date(now.getFullYear(), 0, 1);
      return { from: ys2.toISOString(), to: todayEnd.toISOString() };
    }
    default:
      return null;
  }
}

export function formatOrderId(order: any): string {
  if (order.order_number) {
    const num = String(order.order_number).padStart(6, '0');
    return `ORD-${new Date(order.created_at).getFullYear()}-${num}`;
  }
  return order.id.split('-')[0].toUpperCase();
}

export function OperationsFilterProvider({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customDateRange, setCustomDateRange] = useState<DateRange>({ from: null, to: null });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState('');

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!isAdmin) return;
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('orders')
        .select(`
          id, order_number, status, total, created_at,
          customer_name, customer_phone, delivery_address,
          delivery_type, payment_method, coupon_code,
          discount_amount, subtotal, gst, packing_charge, notes,
          user_id,
          order_items(id, name, price, quantity)
        `)
        .order('created_at', { ascending: false });

      // Apply Date Filter via SQL
      const range = getDateRange(datePreset, customDateRange);
      if (range?.from) query = query.gte('created_at', range.from);
      if (range?.to) query = query.lte('created_at', range.to);

      if (statusFilter) query = query.eq('status', statusFilter);
      if (deliveryFilter) query = query.eq('delivery_type', deliveryFilter);

      const { data, error: err } = await query;
      if (err) throw err;

      let rows = (data || []).map((row: any) => ({
        ...row,
        total: Number(row.total),
        items: (row.order_items || []),
      }));

      // In-memory text search fallback (we should ideally do this on backend with textSearch)
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        rows = rows.filter((o: any) =>
          (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
          (o.customer_phone && o.customer_phone.includes(q)) ||
          (o.order_number && String(o.order_number).includes(q)) ||
          formatOrderId(o).toLowerCase().includes(q)
        );
      }

      setOrders(rows);
    } catch (e: any) {
      console.error('Failed to load orders', e);
      setError(e.message || 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin, datePreset, customDateRange, debouncedSearch, statusFilter, deliveryFilter]);

  // Refetch when filters change
  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  // Realtime
  useEffect(() => {
    if (!isAdmin) return;
    const ch = supabase
      .channel('ops-center-orders-global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        void fetchOrders(true);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [isAdmin, fetchOrders]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const prevStatus = orders.find(o => o.id === orderId)?.status || 'unknown';
    // Optimistic update
    setOrders(cur => cur.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    
    try {
      const { error: err } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      if (err) throw err;
      // Note: The new `order_events` row is automatically created by the postgres trigger `on_order_status_change`!
    } catch (e: any) {
      // Rollback
      setOrders(cur => cur.map(o => o.id === orderId ? { ...o, status: prevStatus } : o));
      alert('Failed to update status: ' + e.message);
    }
  };

  // Compute KPI directly from the filtered orders list
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const contactedCount = orders.filter(o => ['preparing', 'processing', 'accepted'].includes(o.status)).length;
  const completedOrders = orders.filter(o => ['ready', 'completed'].includes(o.status));
  const completedCount = completedOrders.length;
  
  const revenue = completedOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const aov = completedCount > 0 ? revenue / completedCount : 0;

  const kpi: KpiData = {
    total: orders.length,
    pending: pendingCount,
    contacted: contactedCount,
    completed: completedCount,
    revenue,
    aov,
  };

  return (
    <OperationsFilterContext.Provider value={{
      datePreset, setDatePreset,
      customDateRange, setCustomDateRange,
      search, setSearch,
      statusFilter, setStatusFilter,
      deliveryFilter, setDeliveryFilter,
      orders, kpi, loading, refreshing, error,
      fetchOrders, updateOrderStatus
    }}>
      {children}
    </OperationsFilterContext.Provider>
  );
}

export function useOperationsFilter() {
  const context = useContext(OperationsFilterContext);
  if (context === undefined) {
    throw new Error('useOperationsFilter must be used within an OperationsFilterProvider');
  }
  return context;
}
