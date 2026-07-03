import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { getRangeForPreset, type DateRangePreset, type DateRange } from '../utils/dateRanges';

export type DateRangeType = DateRangePreset;
export type { DateRange };

const STORAGE_KEY_TYPE = 'admin_date_range_type';
const STORAGE_KEY_CUSTOM = 'admin_date_range_custom';

interface AdminContextValue {
  dateRangeType: DateRangeType;
  dateRange: DateRange;
  setDateRangeType: (type: DateRangeType, customRange?: DateRange) => void;
  pendingOrdersCount: number;
  unacknowledgedAlerts: any[];
  acknowledgeAlert: (orderId: string) => void;
  refreshSignal: number;
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
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [refreshSignal, setRefreshSignal] = useState(0);

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

  const playAlert = useCallback(() => {
    try {
      if (!audioContext) {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        if (Ctx) {
          const ctx = new Ctx();
          setAudioContext(ctx);
          playOscillator(ctx);
        }
      } else {
        if (audioContext.state === 'suspended') {
          audioContext.resume();
        }
        playOscillator(audioContext);
      }
    } catch (err) {
      console.warn("Audio play failed:", err);
    }
  }, [audioContext]);

  const playOscillator = (ctx: AudioContext) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.setValueAtTime(1108.73, ctx.currentTime + 0.1); // C#6
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  };

  const loadPendingOrders = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
        
      if (!error && count !== null) {
        setPendingOrdersCount(count);
      }
    } catch (err) {
      console.error('Error fetching pending orders:', err);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      loadPendingOrders();
    }
  }, [isAdmin, loadPendingOrders]);

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
          setUnacknowledgedAlerts((prev) => [...prev, payload.new]);
          setRefreshSignal((prev) => prev + 1);
          playAlert();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        () => {
          // Re-evaluate pending count on status change
          loadPendingOrders();
          setRefreshSignal((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [isAdmin, loadPendingOrders, playAlert]);

  const acknowledgeAlert = useCallback((orderId: string) => {
    setUnacknowledgedAlerts((prev) => prev.filter((a) => a.id !== orderId));
  }, []);

  const value = useMemo<AdminContextValue>(() => ({
    dateRangeType,
    dateRange,
    setDateRangeType,
    pendingOrdersCount,
    unacknowledgedAlerts,
    acknowledgeAlert,
    refreshSignal,
  }), [dateRangeType, dateRange, setDateRangeType, pendingOrdersCount, unacknowledgedAlerts, acknowledgeAlert, refreshSignal]);

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdminContext() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdminContext must be used within an AdminProvider');
  }
  return context;
}
