import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface SettingsData {
  whatsapp_number: string;
  delivery_charges: number;
  gst_percentage: number;
  business_hours: {
    openingTime: string;
    closingTime: string;
    isClosed: boolean;
  };
  social_links: {
    instagram: string;
    facebook: string;
    twitter: string;
  };
  seo: {
    title: string;
    description: string;
    keywords: string;
  };
}

export const DEFAULT_SETTINGS: SettingsData = {
  whatsapp_number: '',
  delivery_charges: 0,
  gst_percentage: 5,
  business_hours: { openingTime: '11:00', closingTime: '23:00', isClosed: false },
  social_links: { instagram: '', facebook: '', twitter: '' },
  seo: { title: 'Shawarma Inn', description: 'Best Shawarma in town', keywords: 'shawarma, food' }
};

interface SettingsContextValue {
  settings: SettingsData;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'global')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching global settings:', error);
      }
      
      if (data) {
        // Merge with defaults to ensure all keys exist
        setSettings({ ...DEFAULT_SETTINGS, ...data });
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSettings();
    
    // Subscribe to real-time changes
    const channel = supabase
      .channel('settings_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settings', filter: 'id=eq.global' },
        (payload) => {
          if (payload.new) {
            setSettings({ ...DEFAULT_SETTINGS, ...(payload.new as any) });
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useStoreSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useStoreSettings must be used within a SettingsProvider');
  }
  return context;
}
