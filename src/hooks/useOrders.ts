import { useState, useEffect, useCallback } from 'react';
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
  created_at: string;
  order_items: OrderItem[];
}

export const useOrders = () => {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const placeOrder = async (params: {
    cartItems: CartItem[];
    subtotal: number;
    gst: number;
    total: number;
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    branchId?: string;
  }): Promise<{ success: boolean; orderId?: string; error?: string }> => {
    try {
      if (useSupabaseAuth) {
        if (!user?.id || user.role !== 'user') {
          return { success: false, error: 'Please sign in before placing an order.' };
        }

        const { data: insertedOrder, error: insertOrderError } = await supabase
          .from('orders')
          .insert({
            user_id: String(user.id),
            delivery_address: params.deliveryAddress,
            customer_name: params.customerName,
            customer_phone: params.customerPhone,
            subtotal: params.subtotal,
            gst: params.gst,
            total: params.total,
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
          deliveryAddress: params.deliveryAddress,
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

  return { orders, loading, error, placeOrder, refresh: fetchOrders };
};
