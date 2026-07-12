import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { getRangeForPreset, type DateRangePreset, type DateRange } from '../utils/dateRanges';

export type DateRangeType = DateRangePreset;
export type { DateRange };

const STORAGE_KEY_TYPE = 'admin_date_range_type';
const STORAGE_KEY_CUSTOM = 'admin_date_range_custom';

interface AlertSettings {
  sound_url: string;
  volume: number;
  repeat_interval_sec: number;
  is_muted: boolean;
  enable_browser_notifications: boolean;
}

const DEFAULT_SETTINGS: AlertSettings = {
  sound_url: '/restaurant-bell.mp3',
  volume: 100,
  repeat_interval_sec: 10,
  is_muted: false,
  enable_browser_notifications: true
};

interface AdminContextValue {
  dateRangeType: DateRangeType;
  dateRange: DateRange;
  setDateRangeType: (type: DateRangeType, customRange?: DateRange) => void;
  pendingOrdersCount: number;
  unacknowledgedAlerts: any[];
  latestIncomingOrder: any | null;
  acknowledgeAlert: (orderId: string) => Promise<void>;
  dismissIncomingOrder: () => void;
  refreshSignal: number;
  alertSettings: AlertSettings;
  updateAlertSettings: (newSettings: Partial<AlertSettings>) => Promise<void>;
  testAlert: () => void;
  stopTestAlert: () => void;
}

const AdminContext = createContext<AdminContextValue | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();

  const [dateRangeType, setDateRangeTypeState] = useState<DateRangeType>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_TYPE) as DateRangeType | null;
    return stored || 'today';
  });

  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const storedType = localStorage.getItem(STORAGE_KEY_TYPE) as DateRangeType | null;
    if (storedType === 'custom') {
      const storedCustom = localStorage.getItem(STORAGE_KEY_CUSTOM);
      if (storedCustom) {
        try {
          return JSON.parse(storedCustom) as DateRange;
        } catch {
          // fall through to default
        }
      }
    }
    return getRangeForPreset(storedType || 'today');
  });

  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [unacknowledgedAlerts, setUnacknowledgedAlerts] = useState<any[]>([]);
  const [latestIncomingOrder, setLatestIncomingOrder] = useState<any | null>(null);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [alertSettings, setAlertSettings] = useState<AlertSettings>(DEFAULT_SETTINGS);
  const alertSettingsRef = useRef<AlertSettings>(DEFAULT_SETTINGS);

  // Audio setup
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loopIntervalRef = useRef<number | null>(null);

  const setDateRangeType = useCallback((type: DateRangeType, customRange?: DateRange) => {
    setDateRangeTypeState(type);
    localStorage.setItem(STORAGE_KEY_TYPE, type);

    if (type === 'custom' && customRange) {
      setDateRange(customRange);
      localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(customRange));
      return;
    }

    setDateRange(getRangeForPreset(type));
  }, []);

  const fetchAlertSettings = useCallback(async () => {
    try {
      const stored = localStorage.getItem('admin_alert_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        setAlertSettings(parsed);
        alertSettingsRef.current = parsed;
      }
    } catch (err) {
      console.error('Error parsing local admin alert settings', err);
    }
  }, []);

  const updateAlertSettings = useCallback(async (newSettings: Partial<AlertSettings>) => {
    const updated = { ...alertSettings, ...newSettings };
    setAlertSettings(updated);
    alertSettingsRef.current = updated;
    localStorage.setItem('admin_alert_settings', JSON.stringify(updated));
  }, [alertSettings]);

  const loadPendingOrders = useCallback(async () => {
    if (!isAdmin) return;
    try {
      // 24 hour lookback for unacknowledged orders failsafe
      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() - 24);

      const { data, count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('status', 'pending');
        
      if (!error && data) {
        setPendingOrdersCount(count || 0);
        
        // Find unacknowledged orders from the last 24h
        const unacked = data.filter(o => !o.acknowledged_at && new Date(o.created_at) > yesterday);
        setUnacknowledgedAlerts(unacked);
        
        // Existing pending orders are shown without replaying an alert when
        // an admin opens or refreshes a page.
      }
    } catch (err) {
      console.error('Error fetching pending orders:', err);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchAlertSettings();
      loadPendingOrders();
    }
    return () => stopAlertLoop();
  }, [isAdmin, fetchAlertSettings, loadPendingOrders]);

  // Handle browser notification permissions
  useEffect(() => {
    if (isAdmin && alertSettings.enable_browser_notifications) {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [isAdmin, alertSettings.enable_browser_notifications]);

  // Audio playing logic
  const playSingleAlert = useCallback(() => {
    const settings = alertSettingsRef.current;
    if (settings.is_muted) return;
    
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;
    
    // Set src if different
    if (audio.src !== settings.sound_url && !audio.src.endsWith(settings.sound_url)) {
      audio.src = settings.sound_url;
    }
    
    audio.volume = settings.volume / 100;
    
    audio.play().catch(err => {
      console.warn("Audio play failed (maybe require user interaction first):", err);
    });
  }, []);

  const startAlertLoop = useCallback(() => {
    // Play immediately
    playSingleAlert();
    
    // Clear any existing loop
    if (loopIntervalRef.current) {
      clearInterval(loopIntervalRef.current);
    }
    
    // One loud sound per new order. Repeating alerts are intentionally removed.
  }, [playSingleAlert]);

  const stopAlertLoop = useCallback(() => {
    if (loopIntervalRef.current) {
      clearInterval(loopIntervalRef.current);
      loopIntervalRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  const triggerBrowserNotification = useCallback((order: any) => {
    if (alertSettings.enable_browser_notifications && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('New Order Received!', {
        body: `Order #${order.id.split('-')[0]} from ${order.customer_name || 'Guest'}`,
        icon: '/favicon.svg'
      });
    }
  }, [alertSettings.enable_browser_notifications]);

  useEffect(() => {
    if (!isAdmin) return;

    // Supabase Realtime subscription
    const subscription = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          setPendingOrdersCount((prev) => prev + 1);
          setUnacknowledgedAlerts((prev) => {
            const newAlerts = [...prev, payload.new];
            // Restart loop if we just got a new order
            setLatestIncomingOrder(payload.new);
            startAlertLoop();
            triggerBrowserNotification(payload.new);
            return newAlerts;
          });
          setRefreshSignal((prev) => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          // Re-evaluate pending count on status change
          // Also if an order is acknowledged remotely, we should remove it from alerts
          setUnacknowledgedAlerts(prev => {
            const filtered = prev.filter(a => a.id !== payload.new.id || !payload.new.acknowledged_at);
            if (filtered.length === 0) {
              stopAlertLoop();
            }
            return filtered;
          });
          loadPendingOrders();
          setRefreshSignal((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [isAdmin, loadPendingOrders, startAlertLoop, stopAlertLoop, triggerBrowserNotification]);

  const acknowledgeAlert = useCallback(async (orderId: string) => {
    // Optimistic UI update
    setUnacknowledgedAlerts((prev) => {
      const next = prev.filter((a) => a.id !== orderId);
      if (next.length === 0) {
        stopAlertLoop();
      }
      return next;
    });

    try {
      await supabase
        .from('orders')
        .update({ acknowledged_at: new Date().toISOString() })
        .eq('id', orderId);
    } catch (err) {
      console.error('Failed to acknowledge order:', err);
    }
  }, [stopAlertLoop]);

  const dismissIncomingOrder = useCallback(() => {
    setLatestIncomingOrder(null);
  }, []);

  const testAlert = useCallback(() => {
    const enabled = { ...alertSettingsRef.current, is_muted: false, volume: 100 };
    alertSettingsRef.current = enabled;
    setAlertSettings(enabled);
    localStorage.setItem('admin_alert_settings', JSON.stringify(enabled));
    startAlertLoop();
  }, [startAlertLoop]);
  
  const stopTestAlert = useCallback(() => {
    if (unacknowledgedAlerts.length === 0) {
      stopAlertLoop();
    }
  }, [unacknowledgedAlerts.length, stopAlertLoop]);

  const value = useMemo<AdminContextValue>(() => ({
    dateRangeType,
    dateRange,
    setDateRangeType,
    pendingOrdersCount,
    unacknowledgedAlerts,
    latestIncomingOrder,
    acknowledgeAlert,
    dismissIncomingOrder,
    refreshSignal,
    alertSettings,
    updateAlertSettings,
    testAlert,
    stopTestAlert
  }), [
    dateRangeType, dateRange, setDateRangeType, pendingOrdersCount, 
    unacknowledgedAlerts, latestIncomingOrder, acknowledgeAlert, dismissIncomingOrder, refreshSignal, 
    alertSettings, updateAlertSettings, testAlert, stopTestAlert
  ]);

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdminContext() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdminContext must be used within an AdminProvider');
  }
  return context;
}
