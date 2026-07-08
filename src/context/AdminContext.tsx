import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { getRangeForPreset, type DateRangePreset, type DateRange } from '../utils/dateRanges';

export type DateRangeType = DateRangePreset;
export type { DateRange };

const STORAGE_KEY_TYPE = 'admin_date_range_type';
const STORAGE_KEY_CUSTOM = 'admin_date_range_custom';

interface KDSSettings {
  sound_url: string;
  volume: number;
  repeat_interval_sec: number;
  is_muted: boolean;
  enable_browser_notifications: boolean;
}

const DEFAULT_SETTINGS: KDSSettings = {
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
  acknowledgeAlert: (orderId: string) => Promise<void>;
  refreshSignal: number;
  kdsSettings: KDSSettings;
  updateKDSSettings: (newSettings: Partial<KDSSettings>) => Promise<void>;
  testAlert: () => void;
  stopTestAlert: () => void;
}

const AdminContext = createContext<AdminContextValue | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { isAdmin, user } = useAuth();

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
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [kdsSettings, setKdsSettings] = useState<KDSSettings>(DEFAULT_SETTINGS);
  const kdsSettingsRef = useRef<KDSSettings>(DEFAULT_SETTINGS);

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

  const fetchKDSSettings = useCallback(async () => {
    try {
      const stored = localStorage.getItem('kds_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        setKdsSettings(parsed);
        kdsSettingsRef.current = parsed;
      }
    } catch (err) {
      console.error('Error parsing local KDS settings', err);
    }
  }, []);

  const updateKDSSettings = useCallback(async (newSettings: Partial<KDSSettings>) => {
    const updated = { ...kdsSettings, ...newSettings };
    setKdsSettings(updated);
    kdsSettingsRef.current = updated;
    localStorage.setItem('kds_settings', JSON.stringify(updated));
  }, [kdsSettings]);

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
        
        if (unacked.length > 0) {
          startAlertLoop();
        } else {
          stopAlertLoop();
        }
      }
    } catch (err) {
      console.error('Error fetching pending orders:', err);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchKDSSettings();
      loadPendingOrders();
    }
    return () => stopAlertLoop();
  }, [isAdmin, fetchKDSSettings, loadPendingOrders]);

  // Handle browser notification permissions
  useEffect(() => {
    if (isAdmin && kdsSettings.enable_browser_notifications) {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [isAdmin, kdsSettings.enable_browser_notifications]);

  // Audio playing logic
  const playSingleAlert = useCallback(() => {
    const settings = kdsSettingsRef.current;
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
    
    let playCount = 1;

    // Start repeating
    const settings = kdsSettingsRef.current;
    if (settings.repeat_interval_sec > 0) {
      loopIntervalRef.current = window.setInterval(() => {
        playCount++;
        if (playCount > 3) {
          if (loopIntervalRef.current) clearInterval(loopIntervalRef.current);
          return;
        }
        playSingleAlert();
      }, settings.repeat_interval_sec * 1000);
    }
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
    if (kdsSettings.enable_browser_notifications && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('New Order Received!', {
        body: `Order #${order.id.split('-')[0]} from ${order.customer_name || 'Guest'}`,
        icon: '/favicon.svg'
      });
    }
  }, [kdsSettings.enable_browser_notifications]);

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

  const testAlert = useCallback(() => {
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
    acknowledgeAlert,
    refreshSignal,
    kdsSettings,
    updateKDSSettings,
    testAlert,
    stopTestAlert
  }), [
    dateRangeType, dateRange, setDateRangeType, pendingOrdersCount, 
    unacknowledgedAlerts, acknowledgeAlert, refreshSignal, 
    kdsSettings, updateKDSSettings, testAlert, stopTestAlert
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
