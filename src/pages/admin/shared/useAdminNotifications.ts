import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';

export function useAdminNotifications(token: string | null | undefined) {
  const [notifications, setNotifications] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await apiRequest<any[]>('/admin/notifications', { token });
      setNotifications(res || []);
    } catch {
      // fail silently — notifications are non-critical
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = useCallback(async (id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
    if (!token) return;
    try {
      await apiRequest(`/admin/notifications/${id}/read`, { method: 'PUT', token });
    } catch {
      // fail silently
    }
  }, [token]);

  const markAllRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.is_read);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    await Promise.all(unread.map((n) => token ? apiRequest(`/admin/notifications/${n.id}/read`, { method: 'PUT', token }).catch(() => {}) : Promise.resolve()));
  }, [notifications, token]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return { notifications, unreadCount, reload: load, markRead, markAllRead };
}
