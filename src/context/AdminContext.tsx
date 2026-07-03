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
    // Loud kitchen-alarm siren: 4 two-tone bursts at full volume,
    // doubled an octave up, run through a compressor so it stays
    // loud without clipping.
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-12, ctx.currentTime);
    compressor.ratio.setValueAtTime(12, ctx.currentTime);
    compressor.connect(ctx.destination);

    const master = ctx.createGain();
    master.gain.setValueAtTime(1.0, ctx.currentTime);
    master.connect(compressor);

    const BURSTS = 4;
    const BURST_LEN = 0.55;
    const GAP = 0.18;

    for (let i = 0; i < BURSTS; i++) {
      const start = ctx.currentTime + i * (BURST_LEN + GAP);
      const end = start + BURST_LEN;

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.0001, start);
      gainNode.gain.exponentialRampToValueAtTime(1.0, start + 0.02);
      gainNode.gain.setValueAtTime(1.0, end - 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, end);
      gainNode.connect(master);

      // Main two-tone siren (A5 <-> E6)
      const osc = ctx.createOscillator();
      osc.type = 'square';
      for (let t = 0; t < BURST_LEN; t += 0.12) {
        osc.frequency.setValueAtTime(t % 0.24 < 0.12 ? 880 : 1318.5, start + t);
      }
      osc.connect(gainNode);
      osc.start(start);
      osc.stop(end);

      // Octave-up layer for extra cut-through
      const oscHigh = ctx.createOscillator();
      oscHigh.type = 'sawtooth';
      for (let t = 0; t < BURST_LEN; t += 0.12) {
        oscHigh.frequency.setValueAtTime(t % 0.24 < 0.12 ? 1760 : 2637, start + t);
      }
      const highGain = ctx.createGain();
      highGain.gain.setValueAtTime(0.6, start);
      oscHigh.connect(highGain);
      highGain.connect(gainNode);
      oscHigh.start(start);
      oscHigh.stop(end);
    }
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
