import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import type { CartItem } from './useCart';

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
      const response = await fetch('/api/orders/mine', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load order history.');
      }

      const payload = await response.json();
      setOrders((payload.orders as Order[]) || []);
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
      const response = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          cartItems: params.cartItems,
          customerName: params.customerName,
          customerPhone: params.customerPhone,
          deliveryAddress: params.deliveryAddress,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        return { success: false, error: payload.error || 'Failed to place order' };
      }

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
