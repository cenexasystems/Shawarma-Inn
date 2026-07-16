import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { getRangeForPreset, type DateRangePreset, type DateRange } from '../utils/dateRanges';

export type DateRangeType = DateRangePreset;
export type { DateRange };

const STORAGE_KEY_TYPE = 'admin_date_range_type';
const STORAGE_KEY_CUSTOM = 'admin_date_range_custom';

export interface AlertSettings {
  sound_url: string;
  volume: number;
  repeat_interval_sec: number;
  is_muted: boolean;
  enable_browser_notifications: boolean;
}

const DEFAULT_SETTINGS: AlertSettings = {
  sound_url: '/notification-1.mp3',
  volume: 90,
  repeat_interval_sec: 5,
  is_muted: false,
  enable_browser_notifications: true,
};

interface AdminNotification {
  id: string;
  order_id: string;
  created_at: string;
  is_acknowledged: boolean;
  acknowledged_by?: string | null;
  acknowledged_at?: string | null;
  notification_sound?: string | null;
  order?: any;
}

interface AdminContextValue {
  dateRangeType: DateRangeType;
  dateRange: DateRange;
  setDateRangeType: (type: DateRangeType, customRange?: DateRange) => void;
  pendingOrdersCount: number;
  unacknowledgedAlerts: AdminNotification[];
  latestIncomingOrder: any | null;
  acknowledgeAlert: (notificationId: string) => Promise<void>;
  viewAlert: (notification: AdminNotification) => Promise<void>;
  dismissIncomingOrder: () => void;
  refreshSignal: number;
  alertSettings: AlertSettings;
  updateAlertSettings: (newSettings: Partial<AlertSettings>) => Promise<void>;
  testAlert: () => void;
  stopTestAlert: () => void;
}

const AdminContext = createContext<AdminContextValue | undefined>(undefined);

function mapNotification(row: any): AdminNotification {
  return { ...row, order: Array.isArray(row.order) ? row.order[0] : row.order };
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const { isAdmin, user } = useAuth();
  const [dateRangeType, setDateRangeTypeState] = useState<DateRangeType>(() => (localStorage.getItem(STORAGE_KEY_TYPE) as DateRangeType | null) || 'today');
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_CUSTOM);
    if (localStorage.getItem(STORAGE_KEY_TYPE) === 'custom' && stored) {
      try { return JSON.parse(stored) as DateRange; } catch { /* use today */ }
    }
    return getRangeForPreset((localStorage.getItem(STORAGE_KEY_TYPE) as DateRangeType | null) || 'today');
  });
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [unacknowledgedAlerts, setUnacknowledgedAlerts] = useState<AdminNotification[]>([]);
  const [latestIncomingOrder, setLatestIncomingOrder] = useState<any | null>(null);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [alertSettings, setAlertSettings] = useState<AlertSettings>(DEFAULT_SETTINGS);
  const alertSettingsRef = useRef(DEFAULT_SETTINGS);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loopIntervalRef = useRef<number | null>(null);
  const skipInitialAlarmRef = useRef(false);

  const setDateRangeType = useCallback((type: DateRangeType, customRange?: DateRange) => {
    setDateRangeTypeState(type);
    localStorage.setItem(STORAGE_KEY_TYPE, type);
    if (type === 'custom' && customRange) {
      setDateRange(customRange);
      localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(customRange));
    } else setDateRange(getRangeForPreset(type));
  }, []);

  const fetchAlertSettings = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase.from('kds_settings').select('*').eq('user_id', String(user.id)).maybeSingle();
    const stored = data ? { ...DEFAULT_SETTINGS, ...data, sound_url: data.sound_url || DEFAULT_SETTINGS.sound_url } : DEFAULT_SETTINGS;
    skipInitialAlarmRef.current = true;
    setAlertSettings(stored);
    alertSettingsRef.current = stored;
  }, [user?.id]);

  const updateAlertSettings = useCallback(async (newSettings: Partial<AlertSettings>) => {
    const updated = { ...alertSettingsRef.current, ...newSettings, volume: Math.max(0, Math.min(100, Number(newSettings.volume ?? alertSettingsRef.current.volume))), repeat_interval_sec: Math.max(1, Number(newSettings.repeat_interval_sec ?? alertSettingsRef.current.repeat_interval_sec)) };
    setAlertSettings(updated);
    alertSettingsRef.current = updated;
    if (user?.id) {
      const { error } = await supabase.from('kds_settings').upsert({ user_id: String(user.id), ...updated, updated_at: new Date().toISOString() });
      if (error) console.error('Failed to save KDS settings:', error);
    }
  }, [user?.id]);

  const loadNotifications = useCallback(async () => {
    if (!isAdmin) return;
    const { data: notifications } = await supabase.from('order_notifications').select('*, order:orders(id, order_number, customer_name, total, status, created_at, source)').eq('is_acknowledged', false).order('created_at', { ascending: false });
    const next = (notifications || []).map(mapNotification);
    setUnacknowledgedAlerts(next);
    setPendingOrdersCount(next.filter((n) => n.order?.status === 'pending').length);
  }, [isAdmin]);

  const playSingleAlert = useCallback(() => {
    const settings = alertSettingsRef.current;
    if (settings.is_muted || typeof window === 'undefined') return;
    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;
    audio.src = settings.sound_url;
    audio.volume = settings.volume / 100;
    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  }, []);

  const stopAlertLoop = useCallback(() => {
    if (loopIntervalRef.current !== null) window.clearInterval(loopIntervalRef.current);
    loopIntervalRef.current = null;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
  }, []);

  const startAlertLoop = useCallback(() => {
    playSingleAlert();
    if (loopIntervalRef.current !== null) window.clearInterval(loopIntervalRef.current);
    loopIntervalRef.current = window.setInterval(playSingleAlert, Math.max(1, alertSettingsRef.current.repeat_interval_sec) * 1000);
  }, [playSingleAlert]);

  const notifyBrowser = useCallback((order: any) => {
    if (!alertSettingsRef.current.enable_browser_notifications || !('Notification' in window) || Notification.permission !== 'granted') return;
    const notification = new Notification('🍽 Shawarma Inn — New Order Received', { body: `${order.order_number ? `ORD-${order.order_number}` : order.id}\n₹${Number(order.total || 0).toLocaleString('en-IN')}`, icon: '/favicon.svg', tag: `order-${order.id}` });
    notification.onclick = () => { void supabase.from('order_notifications').update({ is_acknowledged: true, acknowledged_by: user?.id || null, acknowledged_at: new Date().toISOString() }).eq('order_id', order.id); window.focus(); window.location.assign(`/admin/orders?order=${encodeURIComponent(order.id)}`); };
  }, [user?.id]);

  useEffect(() => {
    if (!isAdmin) return;
    void fetchAlertSettings();
    void loadNotifications();
    return () => stopAlertLoop();
  }, [isAdmin, fetchAlertSettings, loadNotifications, stopAlertLoop]);

  useEffect(() => {
    if (isAdmin && alertSettings.enable_browser_notifications && 'Notification' in window && Notification.permission === 'default') void Notification.requestPermission();
  }, [isAdmin, alertSettings.enable_browser_notifications]);

  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase.channel('admin-order-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_notifications' }, async (payload) => {
        const { data } = await supabase.from('order_notifications').select('*, order:orders(id, order_number, customer_name, total, status, created_at, source)').eq('id', payload.new.id).single();
        const notification = mapNotification(data || payload.new);
        setUnacknowledgedAlerts((prev) => prev.some((n) => n.id === notification.id) ? prev : [notification, ...prev]);
        setLatestIncomingOrder(notification);
        setRefreshSignal((prev) => prev + 1);
        startAlertLoop();
        notifyBrowser(notification.order || payload.new);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'order_notifications' }, (payload) => {
        if (payload.new.is_acknowledged) setUnacknowledgedAlerts((prev) => prev.filter((n) => n.id !== payload.new.id));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.new.status === 'processing') setUnacknowledgedAlerts((prev) => prev.filter((n) => n.order_id !== payload.new.id));
        setPendingOrdersCount((prev) => Math.max(0, prev + (payload.new.status === 'pending' ? 1 : -1)));
        setRefreshSignal((prev) => prev + 1);
      }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [isAdmin, loadNotifications, notifyBrowser, startAlertLoop]);

  useEffect(() => {
    if (skipInitialAlarmRef.current) {
      skipInitialAlarmRef.current = false;
      return;
    }
    if (unacknowledgedAlerts.length > 0) startAlertLoop();
    else stopAlertLoop();
  }, [unacknowledgedAlerts.length, startAlertLoop, stopAlertLoop]);

  const acknowledgeAlert = useCallback(async (notificationId: string) => {
    const acknowledgedAt = new Date().toISOString();
    setUnacknowledgedAlerts((prev) => prev.filter((n) => n.id !== notificationId));
    await supabase.from('order_notifications').update({ is_acknowledged: true, acknowledged_by: user?.id || null, acknowledged_at: acknowledgedAt }).eq('id', notificationId);
  }, [user?.id]);

  const viewAlert = useCallback(async (notification: AdminNotification) => {
    await acknowledgeAlert(notification.id);
    window.location.assign(`/admin/orders?order=${encodeURIComponent(notification.order_id)}`);
  }, [acknowledgeAlert]);

  const dismissIncomingOrder = useCallback(() => setLatestIncomingOrder(null), []);
  const testAlert = useCallback(() => { playSingleAlert(); }, [playSingleAlert]);
  const stopTestAlert = useCallback(() => { if (unacknowledgedAlerts.length === 0) stopAlertLoop(); }, [unacknowledgedAlerts.length, stopAlertLoop]);

  const value = useMemo<AdminContextValue>(() => ({ dateRangeType, dateRange, setDateRangeType, pendingOrdersCount, unacknowledgedAlerts, latestIncomingOrder, acknowledgeAlert, viewAlert, dismissIncomingOrder, refreshSignal, alertSettings, updateAlertSettings, testAlert, stopTestAlert }), [dateRangeType, dateRange, setDateRangeType, pendingOrdersCount, unacknowledgedAlerts, latestIncomingOrder, acknowledgeAlert, viewAlert, dismissIncomingOrder, refreshSignal, alertSettings, updateAlertSettings, testAlert, stopTestAlert]);
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdminContext() {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdminContext must be used within an AdminProvider');
  return context;
}
