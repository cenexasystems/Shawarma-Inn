import { useStoreSettings } from '../context/SettingsContext';

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
  delivery_charge: '0',
  packing_charge: '0',
  instagram_url: '',
  youtube_url: '',
  swiggy_url: import.meta.env.VITE_SWIGGY_URL || '',
  zomato_url: import.meta.env.VITE_ZOMATO_URL || '',
  min_order_value: '0',
};

export function usePublicSettings() {
  const { settings: storeSettings, loading } = useStoreSettings();
  const settings: PublicSettings = {
    ...DEFAULT_SETTINGS,
    whatsapp_number: storeSettings.whatsapp_number || DEFAULT_SETTINGS.whatsapp_number,
    instagram_url: storeSettings.social_links.instagram,
    gst_percentage: String(storeSettings.gst_percentage),
  };

  // Direct orders never add packing or delivery fees.
  const deliveryCharge = 0;
  const packingCharge = 0;
  const gstEnabled = false;
  const gstPercentage = Number(storeSettings.gst_percentage) || 0;
  const minOrderValue = 0;

  return {
    settings,
    loading,
    gstEnabled,
    gstActive: false,
    gstPercentage,
    deliveryCharge,
    packingCharge,
    minOrderValue,
  };
}
