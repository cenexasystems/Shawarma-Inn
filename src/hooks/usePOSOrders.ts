import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { shouldUseSupabase, checkSupabaseHealth } from '../lib/supabaseMigration';

export interface POSOrder {
  id: string;
  userId?: string;
  items: Array<{ id: string; name: string; price: number; quantity: number; subtotal: number }>;
  total: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
  orderType?: 'dine-in' | 'takeaway' | 'delivery';
  subtotal?: number;
  discount?: number;
  tax?: number;
}

function normalizeOrderType(value: unknown): 'dine-in' | 'takeaway' | 'delivery' {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'takeaway' || raw === 'take-away' || raw === 'take away') return 'takeaway';
  if (raw === 'delivery') return 'delivery';
  return 'dine-in';
}

function normalizeItems(rawItems: unknown): POSOrder['items'] {
  if (!Array.isArray(rawItems)) {
    return [];
  }

  return rawItems.map((item: any, index: number) => {
    const quantity = Number(item?.quantity ?? item?.qty ?? 1);
    const price = Number(item?.price ?? 0);
    const subtotal = Number(item?.subtotal ?? price * quantity);

    return {
      id: String(item?.id ?? item?.menu_item_id ?? index),
      name: String(item?.name ?? 'Item'),
      price: Number.isFinite(price) ? price : 0,
      quantity: Number.isFinite(quantity) ? quantity : 1,
      subtotal: Number.isFinite(subtotal) ? subtotal : 0,
    };
  });
}

function normalizeOrder(raw: any): POSOrder | null {
  if (!raw) {
    return null;
  }

  const createdAtRaw = raw.createdAt ?? raw.created_at;
  const timestampRaw = raw.timestamp;

  const createdAt = typeof createdAtRaw === 'string' && createdAtRaw
    ? createdAtRaw
    : Number.isFinite(Number(timestampRaw))
      ? new Date(Number(timestampRaw)).toISOString()
      : new Date().toISOString();

  const items = normalizeItems(raw.items ?? raw.order_items ?? []);
  const total = Number(raw.total ?? 0);

  return {
    id: String(raw.id ?? raw.order_number ?? Date.now()),
    userId: raw.userId ?? raw.user_id,
    items,
    total: Number.isFinite(total) ? total : 0,
    status: String(raw.status ?? 'PENDING'),
    createdAt,
    updatedAt: raw.updatedAt ?? raw.updated_at,
    orderType: normalizeOrderType(raw.orderType ?? raw.order_type),
    subtotal: Number(raw.subtotal ?? items.reduce((sum, item) => sum + item.subtotal, 0)),
    discount: Number(raw.discount ?? 0),
    tax: Number(raw.tax ?? 0),
  };
}

function readLocalOrders(): POSOrder[] {
  const storageData = localStorage.getItem('shawarmainn_orders');
  if (!storageData) {
    return [];
  }

  try {
    const parsed = JSON.parse(storageData);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((row) => normalizeOrder(row))
      .filter((row): row is POSOrder => Boolean(row));
  } catch {
    return [];
  }
}

function mergeOrders(primary: POSOrder[], secondary: POSOrder[]): POSOrder[] {
  const byId = new Map<string, POSOrder>();

  for (const order of [...primary, ...secondary]) {
    byId.set(order.id, order);
  }

  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export const usePOSOrders = () => {
  const [orders, setOrders] = useState<POSOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'localStorage' | 'supabase'>('localStorage');

  // Load orders from best available source
  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const localOrders = readLocalOrders();

      // Try Supabase first if enabled and healthy
      if (shouldUseSupabase()) {
        const isHealthy = await checkSupabaseHealth();

        if (isHealthy) {
          try {
            const { data, error: supabaseError } = await supabase
              .from('orders')
              .select('*')
              .order('created_at', { ascending: false });

            if (!supabaseError && data) {
              const supabaseOrders = (data as any[])
                .map((row) => normalizeOrder(row))
                .filter((row): row is POSOrder => Boolean(row));

              // Merge both sources to avoid empty analytics when cloud has no POS rows yet.
              const merged = mergeOrders(supabaseOrders, localOrders);

              setOrders(merged);
              setSource(supabaseOrders.length > 0 ? 'supabase' : 'localStorage');
              setLoading(false);
              return;
            }
          } catch {
            // Fall through to localStorage
          }
        }
      }

      // Fall back to localStorage
      if (localOrders.length > 0) {
        setOrders(localOrders);
        setSource('localStorage');
      } else {
        setOrders([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
      // Still load from localStorage on error
      const localOrders = readLocalOrders();
      if (localOrders.length > 0) {
        setOrders(localOrders);
        setSource('localStorage');
      }
    }

    setLoading(false);
  }, []);

  // Load orders on mount
  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  // Save order to both sources (dual-write)
  const addOrder = useCallback(
    async (order: POSOrder): Promise<void> => {
      try {
        // Write to localStorage
        const currentOrders = JSON.parse(localStorage.getItem('shawarmainn_orders') || '[]');
        currentOrders.push(order);
        localStorage.setItem('shawarmainn_orders', JSON.stringify(currentOrders));

        // Write to Supabase if available
        if (shouldUseSupabase()) {
          const isHealthy = await checkSupabaseHealth();
          if (isHealthy) {
            try {
              await supabase.from('orders').insert({
                id: order.id,
                user_id: order.userId || 'pos-user',
                items: order.items,
                total: order.total,
                status: order.status,
                created_at: order.createdAt,
                updated_at: new Date().toISOString(),
              });
            } catch {
              // Supabase write failed but localStorage succeeded
              console.warn('Order backed up in localStorage; Supabase sync pending');
            }
          }
        }

        // Refresh local state
        await loadOrders();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add order');
        throw err;
      }
    },
    [loadOrders],
  );

  // Update order status
  const updateOrderStatus = useCallback(
    async (orderId: string, status: string): Promise<void> => {
      try {
        // Update localStorage
        const currentOrders = JSON.parse(localStorage.getItem('shawarmainn_orders') || '[]');
        const updatedOrders = currentOrders.map((o: POSOrder) =>
          o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o,
        );
        localStorage.setItem('shawarmainn_orders', JSON.stringify(updatedOrders));

        // Update Supabase if available
        if (shouldUseSupabase()) {
          const isHealthy = await checkSupabaseHealth();
          if (isHealthy) {
            try {
              await supabase.from('orders').update({ status }).eq('id', orderId);
            } catch {
              console.warn('Status update backed up in localStorage; Supabase sync pending');
            }
          }
        }

        // Refresh local state
        await loadOrders();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update order');
        throw err;
      }
    },
    [loadOrders],
  );

  // Clear all orders
  const clearOrders = useCallback(async (): Promise<void> => {
    try {
      // Clear localStorage
      localStorage.removeItem('shawarmainn_orders');

      // Clear Supabase if available and enabled
      if (shouldUseSupabase()) {
        const isHealthy = await checkSupabaseHealth();
        if (isHealthy) {
          try {
            await supabase.from('orders').delete().neq('id', '');
          } catch {
            console.warn('Deletion backed up; Supabase sync pending');
          }
        }
      }

      setOrders([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear orders');
      throw err;
    }
  }, []);

  return {
    orders,
    loading,
    error,
    source, // Shows which source data came from
    loadOrders,
    addOrder,
    updateOrderStatus,
    clearOrders,
    isSupabaseEnabled: shouldUseSupabase(),
  };
};
