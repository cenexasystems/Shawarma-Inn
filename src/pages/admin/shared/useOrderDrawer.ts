import { useState } from 'react';
import { apiRequest } from '../../../lib/api';

export function useOrderDrawer(token: string | null | undefined, onChanged?: () => void) {
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const open = async (order: any) => {
    setSelectedOrder(order);
    setLoading(true);
    try {
      const res = await apiRequest<{ order: any; history: any[] }>(`/admin/orders/${order.id}`, { token: token || '' });
      setSelectedOrder(res.order);
      setHistory(res.history || []);
    } catch { /* use existing order data */ }
    setLoading(false);
  };

  const close = () => {
    setSelectedOrder(null);
    setHistory([]);
  };

  const updateStatus = async (orderId: number | string, status: string) => {
    try {
      await apiRequest(`/admin/orders/${orderId}/status`, { method: 'PATCH', token: token || '', body: { status } });
      setSelectedOrder((prev: any) => (prev ? { ...prev, status } : prev));
      onChanged?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const duplicate = async (orderId: number | string) => {
    try {
      await apiRequest(`/admin/orders/${orderId}/duplicate`, { method: 'POST', token: token || '' });
      close();
      onChanged?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to duplicate order');
    }
  };

  return { selectedOrder, history, loading, open, close, updateStatus, duplicate };
}
