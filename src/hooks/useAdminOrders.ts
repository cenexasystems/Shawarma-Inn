import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Order } from './useOrders';

export const ADMIN_ORDER_STATUSES = ['pending', 'confirmed', 'delivered', 'cancelled'] as const;
export type AdminOrderStatus = typeof ADMIN_ORDER_STATUSES[number];

export interface AdminOrder extends Order {
  customer_name: string | null;
  customer_phone: string | null;
  delivery_address: string | null;
}

export const useAdminOrders = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);

    try {
      const { data, error: supabaseError } = await supabase
        .from('orders')
        .select('id, status, total, created_at, customer_name, customer_phone, delivery_address, order_items(id, name, price, quantity)')
        .order('created_at', { ascending: false });

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      const mappedOrders = ((data || []) as Array<{
        id: string;
        status: string;
        total: number;
        created_at: string;
        customer_name: string | null;
        customer_phone: string | null;
        delivery_address: string | null;
        order_items: Array<{ id: string; name: string; price: number; quantity: number }> | null;
      }>).map((orderRow) => ({
        id: orderRow.id,
        status: orderRow.status,
        total: Number(orderRow.total),
        created_at: orderRow.created_at,
        customer_name: orderRow.customer_name,
        customer_phone: orderRow.customer_phone,
        delivery_address: orderRow.delivery_address,
        order_items: (orderRow.order_items || []).map((item) => ({
          id: item.id,
          name: item.name,
          price: Number(item.price),
          quantity: Number(item.quantity),
          subtotal: Number(item.price) * Number(item.quantity),
        })),
      }));

      setOrders(mappedOrders);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const updateOrderStatus = useCallback(async (orderId: string, status: AdminOrderStatus) => {
    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status } : order)));

    const { error: supabaseError } = await supabase.from('orders').update({ status }).eq('id', orderId);

    if (supabaseError) {
      setError(supabaseError.message);
      await fetchOrders();
      return false;
    }

    return true;
  }, [fetchOrders]);

  return { orders, loading, error, refresh: fetchOrders, updateOrderStatus };
};
