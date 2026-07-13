export const STORAGE_KEYS = {
  orders: 'shawarmainn_orders',
  menu: 'shawarmainn_menu',
  staff: 'shawarmainn_staff',
  shifts: 'shawarmainn_shifts',
  inventory: 'shawarmainn_inventory',
  restocks: 'shawarmainn_restock_history',
  config: 'shawarmainn_config',
  unreadAlerts: 'shawarmainn_unread_alerts',
} as const;

export function readLocalStorage<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    if (!value) return fallback;
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function writeLocalStorage<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export interface AppConfig {
  restaurantName: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
  logoDataUrl: string;
  taxRate: number;
  currencySymbol: string;
  discountEnabled: boolean;
  defaultOrderType: 'dine-in' | 'takeaway' | 'delivery';
  receiptFooter: string;
  darkMode: boolean;
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
}

export const defaultConfig: AppConfig = {
  restaurantName: 'SHAWARMA INN',
  address: 'Mathur, Chennai',
  phone: '+91 XXXXX XXXXX',
  email: 'sharath.creator2210@gmail.com',
  gstin: 'GSTIN-PLACEHOLDER',
  logoDataUrl: '',
  taxRate: 5,
  currencySymbol: 'Rs',
  discountEnabled: true,
  defaultOrderType: 'dine-in',
  receiptFooter: 'Thank you for dining with us!',
  darkMode: true,
  accentColor: '#f97316',
  fontSize: 'medium',
};

export function getAppConfig(): AppConfig {
  const stored = readLocalStorage<AppConfig | null>(STORAGE_KEYS.config, null);
  return {
    ...defaultConfig,
    ...(stored || {}),
  };
}

export interface AlertItem {
  id: string;
  level: 'warning' | 'info';
  message: string;
  createdAt: number;
}

export function buildSystemAlerts(): AlertItem[] {
  const now = Date.now();
  const alerts: AlertItem[] = [];

  const inventory = readLocalStorage<Array<{ id: string | number; name: string; stock: number; minStock: number }>>(
    STORAGE_KEYS.inventory,
    [],
  );
  const outCount = inventory.filter((item) => item.stock <= 0).length;
  const lowCount = inventory.filter((item) => item.stock > 0 && item.stock < item.minStock).length;

  if (outCount > 0) {
    alerts.push({
      id: 'out-of-stock',
      level: 'warning',
      message: `${outCount} item(s) are out of stock`,
      createdAt: now - 1000,
    });
  }

  if (lowCount > 0) {
    alerts.push({
      id: 'low-stock',
      level: 'warning',
      message: `${lowCount} item(s) are low on stock`,
      createdAt: now - 2000,
    });
  }

  const orders = readLocalStorage<Array<{ id: string; status: string; timestamp: number }>>(STORAGE_KEYS.orders, []);
  const pendingCount = orders.filter((order) => order.status === 'PENDING').length;
  if (pendingCount > 0) {
    alerts.push({
      id: 'pending-orders',
      level: 'info',
      message: `${pendingCount} pending order(s) need attention`,
      createdAt: now - 3000,
    });
  }

  return alerts.sort((a, b) => b.createdAt - a.createdAt).slice(0, 10);
}
