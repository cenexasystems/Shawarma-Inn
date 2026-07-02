import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import type { CartItem } from './useCart';
import { apiRequest } from '../lib/api';
import { supabase } from '../lib/supabaseClient';
import { useSupabaseAuth } from '../lib/runtime';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  order_number?: number;
  status: string;
  total: number;
  delivery_type?: string;
  delivery_address?: string;
  coupon_code?: string | null;
  discount_amount?: number;
  gst_amount?: number;
  packing_charge?: number;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
  order_items: OrderItem[];
}

export interface OrderStatusHistory {
  previous_status: string | null;
  status: string;
  note?: string | null;
  remarks?: string | null;
  created_at: string;
}

export const useOrders = () => {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sseRef = useRef<EventSource | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!user?.id || user.role !== 'user' || !token) {
      setOrders([]);
      return;
    }

    setLoading(true);

    try {
      if (useSupabaseAuth) {
        const { data, error: supabaseError } = await supabase
          .from('orders')
          .select('id, status, total, created_at, order_items(id, name, price, quantity)')
          .eq('user_id', String(user.id))
          .order('created_at', { ascending: false });

        if (supabaseError) {
          throw new Error(supabaseError.message);
        }

        const mappedOrders = ((data || []) as Array<{
          id: string;
          status: string;
          total: number;
          created_at: string;
          order_items: Array<{
            id: string;
            name: string;
            price: number;
            quantity: number;
          }> | null;
        }>).map((orderRow) => ({
          id: orderRow.id,
          status: orderRow.status,
          total: Number(orderRow.total),
          created_at: orderRow.created_at,
          order_items: (orderRow.order_items || []).map((item) => ({
            id: item.id,
            name: item.name,
            price: Number(item.price),
            quantity: Number(item.quantity),
            subtotal: Number(item.price) * Number(item.quantity),
          })),
        }));

        setOrders(mappedOrders);
      } else {
        const payload = await apiRequest<{ orders: Order[] }>('/orders/mine', {
          token,
        });
        setOrders((payload.orders as Order[]) || []);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    }

    setLoading(false);
  }, [user?.id, user?.role, token]);

  useEffect(() => {
    if (user?.id) {
      fetchOrders();
      return;
    }

    setOrders([]);
  }, [user?.id, fetchOrders]);

  // Customer SSE: subscribe to order_status events (local API mode only)
  useEffect(() => {
    if (!user?.id || user.role !== 'user' || !token || useSupabaseAuth) return;

    const es = new EventSource(`/api/events?token=${encodeURIComponent(token)}`);
    sseRef.current = es;

    es.addEventListener('order_status', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data || '{}');
        setOrders((prev) =>
          prev.map((o) =>
            String(o.id) === String(data.orderId)
              ? { ...o, status: data.status }
              : o,
          ),
        );
      } catch {
        void fetchOrders();
      }
    });

    return () => {
      es.close();
      sseRef.current = null;
    };
  }, [user?.id, user?.role, token, fetchOrders]);

  // Supabase Realtime: live order status updates for the logged-in customer
  useEffect(() => {
    if (!user?.id || user.role !== 'user' || !useSupabaseAuth) return;

    const channel = supabase
      .channel(`customer-orders-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as { id: string; status: string };
          setOrders((prev) =>
            prev.map((o) =>
              o.id === updated.id ? { ...o, status: updated.status } : o,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, user?.role]);

  const fetchOrderHistory = async (orderId: string): Promise<OrderStatusHistory[]> => {
    if (useSupabaseAuth) {
      try {
        const { data } = await supabase
          .from('order_status_history')
          .select('previous_status, status, note, created_at')
          .eq('order_id', orderId)
          .order('created_at', { ascending: true });

        return (data || []).map((row: {
          previous_status: string | null;
          status: string;
          note: string | null;
          created_at: string;
        }) => ({
          previous_status: row.previous_status,
          status: row.status,
          note: row.note || null,
          remarks: null,
          created_at: row.created_at,
        }));
      } catch {
        return [];
      }
    }

    if (!token) return [];
    try {
      const payload = await apiRequest<{ history: OrderStatusHistory[] }>(
        `/orders/mine/${orderId}/history`,
        { token },
      );
      return payload.history || [];
    } catch {
      return [];
    }
  };

  const placeOrder = async (params: {
    cartItems: CartItem[];
    subtotal: number;
    gst: number;
    total: number;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    deliveryAddress: string;
    deliveryType?: 'home_delivery' | 'store_pickup';
    couponCode?: string;
    discountAmount?: number;
    outlet?: string;
    notes?: string;
    gstAmount?: number;
    packingCharge?: number;
  }): Promise<{ success: boolean; orderId?: string; error?: string }> => {
    try {
      if (params.outlet && params.outlet !== 'Mathur') {
        return { success: false, error: 'Direct ordering is only available for the Mathur outlet.' };
      }

      if (useSupabaseAuth) {
        if (!user?.id || user.role !== 'user') {
          return { success: false, error: 'Please sign in before placing an order.' };
        }

        const { data: insertedOrder, error: insertOrderError } = await supabase
          .from('orders')
          .insert({
            user_id: String(user.id),
            delivery_address: params.deliveryAddress,
            delivery_type: params.deliveryType ?? 'store_pickup',
            customer_name: params.customerName,
            customer_phone: params.customerPhone,
            customer_email: params.customerEmail ?? null,
            coupon_code: params.couponCode ?? null,
            discount_amount: params.discountAmount ?? 0,
            subtotal: params.subtotal,
            gst: params.gst,
            packing_charge: params.packingCharge ?? 0,
            total: params.total,
            notes: params.notes ?? null,
            status: 'pending',
          })
          .select('id')
          .single();

        if (insertOrderError || !insertedOrder?.id) {
          return {
            success: false,
            error: insertOrderError?.message || 'Could not create order.',
          };
        }

        const itemsPayload = params.cartItems.map((item) => ({
          order_id: insertedOrder.id,
          menu_item_id: null,
          name: item.name,
          price: Number(item.price),
          quantity: Number(item.qty),
        }));

        const { error: insertItemsError } = await supabase.from('order_items').insert(itemsPayload);
        if (insertItemsError) {
          await supabase.from('orders').delete().eq('id', insertedOrder.id);
          return {
            success: false,
            error: insertItemsError.message,
          };
        }

        await fetchOrders();

        return { success: true, orderId: String(insertedOrder.id) };
      }

      const payload = await apiRequest<{ order: { id: string | number } }>('/orders/checkout', {
        method: 'POST',
        token,
        body: {
          cartItems: params.cartItems,
          customerName: params.customerName,
          customerPhone: params.customerPhone,
          customerEmail: params.customerEmail ?? null,
          deliveryAddress: params.deliveryAddress,
          deliveryType: params.deliveryType ?? 'store_pickup',
          couponCode: params.couponCode ?? null,
          outlet: params.outlet ?? 'Mathur',
          notes: params.notes ?? null,
          gstAmount: params.gstAmount ?? 0,
          packingCharge: params.packingCharge ?? 0,
        },
      });

      if (user?.role === 'user') {
        await fetchOrders();
      }

      return { success: true, orderId: String(payload.order.id) };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to place order',
      };
    }
  };

  return { orders, loading, error, placeOrder, refresh: fetchOrders, fetchOrderHistory };
};
