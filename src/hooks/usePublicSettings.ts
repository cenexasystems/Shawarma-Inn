import { useState, useEffect, useRef } from 'react';
import { useSupabaseAuth } from '../lib/runtime';

export interface PublicSettings {
  restaurant_name: string;
  tagline: string;
  whatsapp_number: string;
  opening_hours: string;
  days_open: string;
  gst_enabled: string;
  gst_percentage: string;
  prices_include_gst: string;
  delivery_charge: string;
  packing_charge: string;
  instagram_url: string;
  youtube_url: string;
  swiggy_url: string;
  zomato_url: string;
  min_order_value: string;
}

const DEFAULT_SETTINGS: PublicSettings = {
  restaurant_name: 'Shawarma Inn',
  tagline: 'Authentic Flavors, Every Bite',
  whatsapp_number: import.meta.env.VITE_OWNER_WHATSAPP || '6382877479',
  opening_hours: '11:00 AM – 11:00 PM',
  days_open: 'Monday – Sunday',
  gst_enabled: 'false',
  gst_percentage: '0',
  prices_include_gst: 'false',
  delivery_charge: import.meta.env.VITE_DELIVERY_CHARGE ?? '40',
  packing_charge: import.meta.env.VITE_PACKING_CHARGE ?? '10',
  instagram_url: '',
  youtube_url: '',
  swiggy_url: import.meta.env.VITE_SWIGGY_URL || '',
  zomato_url: import.meta.env.VITE_ZOMATO_URL || '',
  min_order_value: '0',
};

// Module-level cache shared across hook instances
let cached: PublicSettings | null = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 1000; // 1 minute (was 5 min — SSE now handles instant invalidation)

async function fetchSettings(): Promise<PublicSettings | null> {
  try {
    const r = await fetch('/api/settings');
    if (!r.ok) return null;
    const data = await r.json();
    if (data?.settings) {
      return { ...DEFAULT_SETTINGS, ...data.settings } as PublicSettings;
    }
    return null;
  } catch {
    return null;
  }
}

export function usePublicSettings() {
  const [settings, setSettings] = useState<PublicSettings>(cached ?? DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(!cached);
  const sseRef = useRef<EventSource | null>(null);

  const load = async () => {
    const fresh = await fetchSettings();
    if (fresh) {
      cached = fresh;
      cacheTime = Date.now();
      setSettings(fresh);
    }
    setLoading(false);
  };

  useEffect(() => {
    // In Supabase auth mode there is no local Express server — use defaults
    if (useSupabaseAuth) { setLoading(false); return; }

    const now = Date.now();
    if (cached && now - cacheTime < CACHE_TTL) {
      setSettings(cached);
      setLoading(false);
    } else {
      void load();
    }

    // Subscribe to settings_updated SSE for immediate cache invalidation
    const es = new EventSource('/api/events');
    sseRef.current = es;

    es.addEventListener('settings_updated', () => {
      // Force refresh immediately
      cached = null;
      cacheTime = 0;
      void load();
    });

    return () => {
      es.close();
      sseRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gstEnabled = settings.gst_enabled === 'true';
  const gstPercentage = Number(settings.gst_percentage) || 5;
  const deliveryCharge = Number(settings.delivery_charge) || 0;
  const packingCharge = Number(settings.packing_charge) || 0;
  const minOrderValue = Number(settings.min_order_value) || 0;
  const gstActive = gstEnabled;

  return {
    settings,
    loading,
    gstEnabled,
    gstActive,
    gstPercentage,
    deliveryCharge,
    packingCharge,
    minOrderValue,
  };
}
