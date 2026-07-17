import { useEffect, useState } from 'react';
import { Bell, CheckCircle, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { useAdminContext } from '../../context/AdminContext';

export default function NotificationsPage() {
  const { isAdmin, user } = useAuth();
  const { acknowledgeAlert, viewAlert } = useAdminContext();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    if (!isAdmin) return;
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from('order_notifications')
      .select('id, order_id, created_at, is_acknowledged, acknowledged_by, acknowledged_at, notification_sound')
      .order('created_at', { ascending: false }).limit(50);

    if (fetchError) {
      setError(fetchError.message);
      setNotifications([]);
      setLoading(false);
      return;
    }

    const orderIds = Array.from(new Set((data || []).map((notification) => String(notification.order_id)).filter(Boolean)));
    const { data: orders, error: orderError } = orderIds.length === 0
      ? { data: [], error: null }
      : await supabase
          .from('orders')
          .select('id, order_number, customer_name, total, status, created_at, source')
          .in('id', orderIds);

    if (orderError) {
      setError(orderError.message);
      setNotifications((data || []).map((notification) => ({ ...notification, order: null })));
      setLoading(false);
      return;
    }

    const ordersById = new Map((orders || []).map((order) => [String(order.id), order]));
    setNotifications((data || []).map((notification) => ({
      ...notification,
      order: ordersById.get(String(notification.order_id)) || null,
    })));
    setLoading(false);
  };

  useEffect(() => { void load(); }, [isAdmin, user?.id]);

  const acknowledge = async (id: string) => {
    await acknowledgeAlert(id);
    setNotifications((current) => current.map((n) => n.id === id ? { ...n, is_acknowledged: true, acknowledged_at: new Date().toISOString() } : n));
  };

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-3xl font-bold text-erp-text">Notifications</h1><p className="mt-2 text-sm text-erp-muted">Persistent KDS order alerts and acknowledgement history.</p></div>
        <button onClick={() => { void Promise.all(notifications.filter((n) => !n.is_acknowledged).map((n) => acknowledge(n.id))); }} className="inline-flex items-center gap-2 rounded-xl border border-erp-border bg-white px-4 py-3 text-sm font-bold text-erp-text"><CheckCircle size={16} /> Acknowledge all</button>
      </header>
      {error && <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</p>}
      {loading ? <div className="rounded-2xl bg-white p-10 text-center text-erp-muted">Loading notifications…</div> : notifications.length === 0 ? <div className="rounded-2xl border border-erp-border bg-white p-14 text-center text-erp-muted"><Bell className="mx-auto mb-3" /> No notifications yet.</div> : (
        <div className="space-y-3">{notifications.map((notification) => {
          const order = Array.isArray(notification.order) ? notification.order[0] : notification.order;
          return <div key={notification.id} className={`rounded-2xl border bg-white p-5 shadow-sm ${notification.is_acknowledged ? 'border-erp-border opacity-70' : 'border-erp-danger/40'}`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3"><div className="mt-1 rounded-full bg-erp-danger/10 p-2 text-erp-danger"><Bell size={18} /></div><div><p className="font-bold text-erp-text">{notification.is_acknowledged ? 'Order acknowledged' : 'New Order Received'}</p><p className="mt-1 text-sm text-erp-muted">{order?.order_number ? `ORD-${order.order_number}` : notification.order_id} · {order?.customer_name || 'Guest'} · ₹{Number(order?.total || 0).toLocaleString('en-IN')}</p><p className="mt-1 text-xs text-erp-muted">Received {new Date(notification.created_at).toLocaleString()} · {order?.source || 'Online'}</p>{notification.is_acknowledged && <p className="mt-1 text-xs text-erp-muted">Acknowledged {notification.acknowledged_at ? new Date(notification.acknowledged_at).toLocaleString() : ''}</p>}</div></div>
              <div className="flex shrink-0 gap-2"><button onClick={() => { void viewAlert({ ...notification, order_id: notification.order_id }); }} className="inline-flex items-center gap-1 rounded-lg bg-erp-primary px-3 py-2 text-xs font-bold text-white"><ExternalLink size={13} /> View Order</button>{!notification.is_acknowledged && <button onClick={() => { void acknowledge(notification.id); }} className="rounded-lg border border-erp-border px-3 py-2 text-xs font-bold text-erp-text">Acknowledge</button>}</div>
            </div>
          </div>;
        })}</div>
      )}
    </div>
  );
}
