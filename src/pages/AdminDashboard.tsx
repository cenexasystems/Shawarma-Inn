import { useEffect, useState, useMemo, useRef } from 'react';
import {
  LayoutDashboard,
  MessageCircle,
  Package,
  Users,
  Tag,
  Star,
  Briefcase,
  TrendingUp,
  IndianRupee,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  EyeOff,
  LogOut,
  ChevronDown,
  Edit2,
  Trash2,
  Settings,
  Bell,
  Activity,
  Truck,
  AlertCircle,
  UserCircle,
  Copy,
  ExternalLink,
  FolderTree
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { resolveMenuImage, getRecoveryImage } from '../utils/menuImages';
import { apiRequest } from '../lib/api';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

type TabKey = 'overview' | 'whatsapp' | 'products' | 'categories' | 'users' | 'coupons' | 'reviews' | 'franchise_leads' | 'settings' | 'activity_log';

const COLORS = ['#ef8f2f', '#dc2626', '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'];
const ADMIN_ORDER_STATUSES = ['pending', 'accepted', 'processing', 'preparing', 'ready', 'in_transit', 'completed', 'cancelled'];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending', accepted: 'Accepted', processing: 'Processing',
  preparing: 'Preparing', ready: 'Ready', in_transit: 'In Transit',
  completed: 'Completed', cancelled: 'Cancelled',
};

const emptyMenuItem = {
  name: '',
  price: '',
  category: '',
  image_url: '',
  is_bestseller: false,
  is_active: true,
};

const emptyCategory = {
  name: '',
  display_order: '0',
  is_active: true,
};

const emptyCoupon = {
  code: '',
  discount_type: 'percentage' as 'percentage' | 'fixed',
  discount_value: '',
  min_order_value: '',
  max_discount: '',
  expiry_date: '',
  usage_limit: '',
};

export default function AdminDashboard() {
  const { user, token, logout } = useAuth();
  const [tab, setTab] = useState<TabKey>('overview');

  // Global State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Overview Data
  const [summary, setSummary] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  // Menu Data
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [menuForm, setMenuForm] = useState(emptyMenuItem);
  const [editingMenuId, setEditingMenuId] = useState<number | null>(null);

  // Orders Data
  const [orders, setOrders] = useState<any[]>([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');

  // Customers Data
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');

  // Coupons Data
  const [coupons, setCoupons] = useState<any[]>([]);
  const [couponForm, setCouponForm] = useState(emptyCoupon);
  const [editingCouponId, setEditingCouponId] = useState<number | null>(null);

  // Reviews Data
  const [reviews, setReviews] = useState<any[]>([]);

  // Franchise Leads Data
  const [leads, setLeads] = useState<any[]>([]);

  // Settings Data
  const [settingsRows, setSettingsRows] = useState<Array<{key: string; value: string; label: string; type: string; section: string}>>([]);
  const [settingsDraft, setSettingsDraft] = useState<Record<string, string>>({});
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Notification center
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const [categories, setCategories] = useState<any[]>([]);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const notifIdRef = useRef(0);

  // Activity log
  const [activityLog, setActivityLog] = useState<any[]>([]);

  const tokenRequired = token || '';

  // Order Drawer (Phase 3)
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [drawerHistory, setDrawerHistory] = useState<any[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);

  const openOrderDrawer = async (order: any) => {
    setSelectedOrder(order);
    setDrawerLoading(true);
    try {
      const res = await apiRequest<{ order: any; history: any[] }>(`/admin/orders/${order.id}`, { token: tokenRequired });
      setSelectedOrder(res.order);
      setDrawerHistory(res.history || []);
    } catch { /* use existing order data */ }
    setDrawerLoading(false);
  };

  const closeOrderDrawer = () => {
    setSelectedOrder(null);
    setDrawerHistory([]);
  };


  const loadData = async () => {
    if (!tokenRequired) return;
    setLoading(true);
    setError('');
    try {
      if (tab === 'overview') {
        const [sumRes, anRes, menuRes] = await Promise.all([
          apiRequest<any>('/admin/dashboard/summary', { token: tokenRequired }),
          apiRequest<any>('/admin/analytics', { token: tokenRequired }),
          apiRequest<any>('/admin/menu-items', { token: tokenRequired }),
        ]);
        setSummary(sumRes);
        setAnalytics(anRes);
        setMenuItems(menuRes.items || []);
      } else if (tab === 'whatsapp') {
        const ordRes = await apiRequest<any>(
          `/admin/orders?search=${encodeURIComponent(orderSearch)}&status=${encodeURIComponent(orderStatusFilter)}`,
          { token: tokenRequired }
        );
        setOrders(ordRes.orders || []);
      } else if (tab === 'products') {
        const [menuRes, catRes] = await Promise.all([
          apiRequest<any>('/admin/menu-items', { token: tokenRequired }),
          apiRequest<any>('/admin/categories', { token: tokenRequired }),
        ]);
        setMenuItems(menuRes.items || []);
        setCategories(catRes || []);
      } else if (tab === 'categories') {
        const catRes = await apiRequest<any>('/admin/categories', { token: tokenRequired });
        setCategories(catRes || []);
      } else if (tab === 'users') {
        const custRes = await apiRequest<any>(`/admin/customers?search=${encodeURIComponent(customerSearch)}`, { token: tokenRequired });
        setCustomers(custRes.customers || []);
      } else if (tab === 'coupons') {
        const coupRes = await apiRequest<any>('/admin/coupons', { token: tokenRequired });
        setCoupons(coupRes.coupons || []);
      } else if (tab === 'reviews') {
        const revRes = await apiRequest<any>('/admin/reviews', { token: tokenRequired });
        setReviews(revRes.reviews || []);
      } else if (tab === 'franchise_leads') {
        const leadRes = await apiRequest<any>('/admin/franchise-leads', { token: tokenRequired });
        setLeads(leadRes.leads || []);
      } else if (tab === 'settings') {
        const settRes = await apiRequest<any>('/admin/settings', { token: tokenRequired });
        const rows = settRes.settings || [];
        setSettingsRows(rows);
        setSettingsDraft(Object.fromEntries(rows.map((r: any) => [r.key, r.value ?? ''])));
      } else if (tab === 'activity_log') {
        const actRes = await apiRequest<any>('/admin/activity', { token: tokenRequired });
        setActivityLog(actRes.logs || actRes.activity || []);
      }

      // Always load notifications
      const notifRes = await apiRequest<any>('/admin/notifications', { token: tokenRequired });
      setNotifications(notifRes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [tab, orderSearch, orderStatusFilter, customerSearch]);

  // Auto-refresh every 30 seconds as fallback
  useEffect(() => {
    if (tab !== 'overview' && tab !== 'whatsapp') return;
    const interval = setInterval(() => { void loadData(); }, 30000);
    return () => clearInterval(interval);
  }, [tab, orderSearch, orderStatusFilter]);

  // Web Audio beep for new orders
  const playNewOrderBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch { /* AudioContext unavailable */ }
  };

  const addNotification = (message: string, type: string) => {
    const id = ++notifIdRef.current;
    setNotifications((prev) => [
      { id, message, type, time: new Date().toLocaleTimeString(), read: false },
      ...prev.slice(0, 49),
    ]);
  };

  // SSE realtime: reload overview/orders tabs when new order or status change arrives
  const sseRef = useRef<EventSource | null>(null);
  useEffect(() => {
    if (!tokenRequired) return;
    // Pass token as query param since EventSource cannot send Authorization headers
    const es = new EventSource(`/api/admin/events?token=${encodeURIComponent(tokenRequired)}`);
    sseRef.current = es;

    const reload = () => {
      if (tab === 'overview' || tab === 'whatsapp') void loadData();
    };

    es.addEventListener('new_order', (e: any) => {
      reload();
      playNewOrderBeep();
      try {
        const data = JSON.parse(e.data || '{}');
        addNotification(`New order #${data.orderNumber || '—'} from ${data.customerName || 'Guest'} — ₹${data.total || 0}`, 'new_order');
      } catch {
        addNotification('New order received', 'new_order');
      }
    });

    es.addEventListener('order_status', (e: any) => {
      reload();
      // If the drawer is open for this order, refresh it
      if (selectedOrder) {
        try {
          const data = JSON.parse(e.data || '{}');
          if (String(data.orderId) === String(selectedOrder.id)) {
            void openOrderDrawer(selectedOrder);
          }
        } catch { /* ignore */ }
      }
      try {
        const data = JSON.parse(e.data || '{}');
        addNotification(
          `Order #${data.orderNumber || '—'} → ${STATUS_LABELS[data.status] || data.status}`,
          'status_change',
        );
      } catch {
        addNotification('Order status updated', 'status_change');
      }
    });

    es.addEventListener('customer_registered', (e: any) => {
      if (tab === 'overview' || tab === 'users') void loadData();
      try {
        const data = JSON.parse(e.data || '{}');
        addNotification(`New customer registered: ${data.name || data.email || 'Guest'}`, 'user_registered');
      } catch {
        addNotification('New customer registered', 'user_registered');
      }
    });

    es.addEventListener('franchise_lead_created', (e: any) => {
      if (tab === 'overview' || tab === 'franchise_leads') void loadData();
      try {
        const data = JSON.parse(e.data || '{}');
        addNotification(`New franchise lead from ${data.name || 'someone'} in ${data.city || 'unknown location'}`, 'lead_created');
      } catch {
        addNotification('New franchise lead received', 'lead_created');
      }
    });

    es.addEventListener('review_submitted', (e: any) => {
      if (tab === 'overview' || tab === 'reviews') void loadData();
      try {
        const data = JSON.parse(e.data || '{}');
        addNotification(`New ${data.rating}★ review from ${data.name || 'a customer'}`, 'review_submitted');
      } catch {
        addNotification('New review submitted', 'review_submitted');
      }
    });

    es.addEventListener('coupon_created', (e: any) => {
      if (tab === 'coupons') void loadData();
      try {
        const data = JSON.parse(e.data || '{}');
        addNotification(`New coupon created: ${data.code || 'unknown'}`, 'coupon_created');
      } catch { /* ignore */ }
    });

    es.addEventListener('menu_updated', () => {
      if (tab === 'products') void loadData();
      addNotification('Menu was updated', 'menu_updated');
    });

    return () => {
      es.close();
      sseRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, tokenRequired]);

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try {
      await apiRequest('/admin/settings', {
        method: 'PUT',
        token: tokenRequired,
        body: { settings: settingsDraft },
      });
      void loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSettingsSaving(false);
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      await apiRequest(`/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        token: tokenRequired,
        body: { status: newStatus },
      });
      void loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleMenuSubmit = async () => {
    try {
      const payload = {
        name: menuForm.name,
        price: Number(menuForm.price),
        category: menuForm.category,
        image_url: menuForm.image_url,
        is_bestseller: menuForm.is_bestseller,
        is_active: menuForm.is_active,
      };
      if (editingMenuId) {
        await apiRequest(`/admin/menu-items/${editingMenuId}`, {
          method: 'PUT',
          token: tokenRequired,
          body: payload,
        });
      } else {
        await apiRequest('/admin/menu-items', {
          method: 'POST',
          token: tokenRequired,
          body: payload,
        });
      }
      setMenuForm(emptyMenuItem);
      setEditingMenuId(null);
      void loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save menu item');
    }
  };

  const handleDeleteMenu = async (id: number) => {
    if (!window.confirm('Delete this menu item?')) return;
    try {
      await apiRequest(`/admin/menu-items/${id}`, { method: 'DELETE', token: tokenRequired });
      void loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete menu item');
    }
  };

  const handleToggleMenuVisibility = async (id: number) => {
    try {
      await apiRequest(`/admin/menu-items/${id}/hide`, { method: 'PATCH', token: tokenRequired });
      void loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to toggle visibility');
    }
  };

  const handleDuplicateMenu = async (id: number) => {
    try {
      await apiRequest(`/admin/menu-items/${id}/duplicate`, { method: 'POST', token: tokenRequired });
      void loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to duplicate menu item');
    }
  };

  const handleCategorySubmit = async () => {
    try {
      if (editingCategoryId) {
        await apiRequest(`/admin/categories/${editingCategoryId}`, {
          method: 'PUT',
          token: tokenRequired,
          body: categoryForm,
        });
      } else {
        await apiRequest('/admin/categories', {
          method: 'POST',
          token: tokenRequired,
          body: categoryForm,
        });
      }
      setCategoryForm(emptyCategory);
      setEditingCategoryId(null);
      void loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save category');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('Delete this category? Menu items using this category will not be deleted but may not display properly.')) return;
    try {
      await apiRequest(`/admin/categories/${id}`, { method: 'DELETE', token: tokenRequired });
      void loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete category');
    }
  };

  const handleMarkNotificationRead = async (id: number) => {
    try {
      await apiRequest(`/admin/notifications/${id}/read`, { method: 'PUT', token: tokenRequired });
      void loadData();
    } catch (err) {
      // fail silently
    }
  };

  const handleCouponSubmit = async () => {
    try {
      const payload = {
        code: couponForm.code,
        discount_type: couponForm.discount_type,
        discount_value: Number(couponForm.discount_value),
        min_order_value: Number(couponForm.min_order_value),
        max_discount: couponForm.max_discount ? Number(couponForm.max_discount) : null,
        expiry_date: couponForm.expiry_date || null,
        usage_limit: couponForm.usage_limit ? Number(couponForm.usage_limit) : null,
      };
      if (editingCouponId) {
        await apiRequest(`/admin/coupons/${editingCouponId}`, { method: 'PUT', token: tokenRequired, body: payload });
      } else {
        await apiRequest('/admin/coupons', { method: 'POST', token: tokenRequired, body: payload });
      }
      setCouponForm(emptyCoupon);
      setEditingCouponId(null);
      void loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save coupon');
    }
  };

  const handleDeleteCoupon = async (id: number) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await apiRequest(`/admin/coupons/${id}`, { method: 'DELETE', token: tokenRequired });
      void loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete coupon');
    }
  };

  const handleToggleCoupon = async (id: number) => {
    try {
      await apiRequest(`/admin/coupons/${id}/disable`, { method: 'PATCH', token: tokenRequired });
      void loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to toggle coupon');
    }
  };

  const handleToggleReviewVisibility = async (id: number) => {
    try {
      await apiRequest(`/admin/reviews/${id}/hide`, { method: 'PATCH', token: tokenRequired });
      void loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to toggle review visibility');
    }
  };

  const handleDeleteReview = async (id: number) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await apiRequest(`/admin/reviews/${id}`, { method: 'DELETE', token: tokenRequired });
      void loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete review');
    }
  };

  // Category Revenue processing
  const categoryData = useMemo(() => {
    if (!analytics || !analytics.topProducts || !menuItems.length) return [];
    const catMap: Record<string, number> = {};
    const itemCatMap: Record<string, string> = {};
    menuItems.forEach((m) => { itemCatMap[m.name] = m.category; });

    analytics.topProducts.forEach((p: any) => {
      const cat = itemCatMap[p.name] || 'Other';
      catMap[cat] = (catMap[cat] || 0) + p.revenue;
    });
    return Object.entries(catMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [analytics, menuItems]);

  // Auth guard disabled — will be re-enabled when Supabase admin roles are connected

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'pending': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'processing': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'in_transit': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      case 'cancelled': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend, colorClass }: any) => (
    <div className="bg-[#181818] border border-white/5 rounded-2xl p-6 flex items-center justify-between transition-all hover:border-white/10">
      <div>
        <p className="text-[11px] uppercase tracking-[2px] text-white/50">{title}</p>
        <h3 className="font-bebas text-5xl mt-2 tracking-wide">{value}</h3>
        {trend && <p className="text-xs text-green-400 mt-2">{trend}</p>}
      </div>
      <div className={`p-4 rounded-xl bg-black/40 ${colorClass}`}>
        <Icon size={24} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#101010] text-[#f7f7f7] flex flex-col md:flex-row font-sans">
      {/* Notification dropdown */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}

      {/* Order Detail Drawer */}
      {selectedOrder && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={closeOrderDrawer}
          />
          <aside className="fixed right-0 top-0 h-full w-full max-w-lg bg-[#141414] border-l border-white/10 z-50 flex flex-col shadow-2xl overflow-y-auto">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 sticky top-0 bg-[#141414]">
              <div>
                <h3 className="font-bebas text-3xl tracking-wider text-[#ef8f2f]">Order #{selectedOrder.order_number}</h3>
                <p className="text-xs text-white/40 mt-0.5">{new Date(selectedOrder.created_at).toLocaleString()}</p>
              </div>
              <button onClick={closeOrderDrawer} className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {drawerLoading && (
              <div className="p-6 text-center text-white/30 text-sm animate-pulse">Loading order details…</div>
            )}

            {!drawerLoading && (
              <div className="flex-1 p-6 space-y-6">
                {/* Customer Info */}
                <div className="bg-black/30 border border-white/5 rounded-2xl p-5 space-y-3">
                  <h4 className="text-[10px] uppercase tracking-[2px] text-white/40 mb-3">Customer</h4>
                  <p className="font-semibold text-lg">{selectedOrder.customer_name || 'Guest'}</p>
                  {selectedOrder.customer_phone && <p className="text-sm text-white/60">{selectedOrder.customer_phone}</p>}
                  {selectedOrder.customer_email && <p className="text-xs text-white/40">{selectedOrder.customer_email}</p>}
                  {selectedOrder.delivery_address && (
                    <p className="text-xs text-white/50 border-t border-white/5 pt-3">
                      <span className="text-white/30 uppercase text-[10px] tracking-wider block mb-1">{selectedOrder.delivery_type?.replace('_', ' ')}</span>
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedOrder.delivery_address)}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-400 hover:text-blue-300 hover:underline inline-flex items-center gap-1 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {selectedOrder.delivery_address}
                      </a>
                    </p>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {selectedOrder.customer_phone && (
                    <a
                      href={`tel:${selectedOrder.customer_phone}`}
                      className="flex flex-col items-center gap-1.5 p-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-xl text-green-400 text-xs font-semibold transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      Call
                    </a>
                  )}
                  {selectedOrder.customer_phone && (
                    <a
                      href={`https://wa.me/${selectedOrder.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${selectedOrder.customer_name || ''}, your order #${selectedOrder.order_number} update:`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1.5 p-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 rounded-xl text-[#25D366] text-xs font-semibold transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      WhatsApp
                    </a>
                  )}
                  {selectedOrder.delivery_address && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedOrder.delivery_address).catch(() => {});
                        addNotification('Address copied to clipboard', 'info');
                      }}
                      className="flex flex-col items-center justify-center gap-1.5 p-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl text-blue-400 text-xs font-semibold transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      Copy Address
                    </button>
                  )}
                  <button
                    onClick={() => addNotification('Kitchen Slip printing architecture prepared.', 'info')}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 bg-gray-500/10 hover:bg-gray-500/20 border border-gray-500/20 rounded-xl text-gray-400 text-xs font-semibold transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    Kitchen Slip
                  </button>
                  <button
                    onClick={() => addNotification('Invoice printing architecture prepared.', 'info')}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 bg-gray-500/10 hover:bg-gray-500/20 border border-gray-500/20 rounded-xl text-gray-400 text-xs font-semibold transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Invoice
                  </button>
                  <button
                    onClick={async () => {
                      if (!window.confirm('Duplicate this order as a new pending order?')) return;
                      try {
                        await apiRequest(`/admin/orders/${selectedOrder.id}/duplicate`, { method: 'POST', token: tokenRequired });
                        closeOrderDrawer();
                        void loadData();
                      } catch (err) {
                        alert(err instanceof Error ? err.message : 'Failed to duplicate order');
                      }
                    }}
                    className="flex flex-col items-center gap-1.5 p-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl text-blue-400 text-xs font-semibold transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    Duplicate
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex flex-col items-center gap-1.5 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 text-xs font-semibold transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    Print
                  </button>
                  <button
                    onClick={async () => {
                      if (!window.confirm('Cancel this order?')) return;
                      await updateOrderStatus(selectedOrder.id, 'cancelled');
                      void openOrderDrawer({ ...selectedOrder, status: 'cancelled' });
                    }}
                    className="flex flex-col items-center gap-1.5 p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-400 text-xs font-semibold transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    Cancel
                  </button>
                </div>

                {/* Status Update */}
                <div className="bg-black/30 border border-white/5 rounded-2xl p-5">
                  <h4 className="text-[10px] uppercase tracking-[2px] text-white/40 mb-3">Update Status</h4>
                  <select
                    value={selectedOrder.status}
                    onChange={async (e) => {
                      await updateOrderStatus(selectedOrder.id, e.target.value);
                      setSelectedOrder((prev: any) => prev ? { ...prev, status: e.target.value } : prev);
                    }}
                    className={`w-full appearance-none px-4 py-3 border rounded-xl text-sm font-bold uppercase tracking-wider cursor-pointer outline-none transition-colors ${getStatusColor(selectedOrder.status)}`}
                  >
                    {ADMIN_ORDER_STATUSES.map((s) => (
                      <option key={s} value={s} className="bg-[#101010] text-white">{STATUS_LABELS[s] || s}</option>
                    ))}
                  </select>
                </div>

                {/* Order Items */}
                <div className="bg-black/30 border border-white/5 rounded-2xl p-5">
                  <h4 className="text-[10px] uppercase tracking-[2px] text-white/40 mb-4">Items</h4>
                  <div className="space-y-3">
                    {(selectedOrder.items || []).map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between text-sm bg-black/20 p-2 rounded-xl">
                        <div className="flex items-center gap-3">
                          <img 
                            src={resolveMenuImage({ name: item.name, category: 'Shawarma' })} 
                            onError={(e) => { e.currentTarget.src = getRecoveryImage({ name: item.name, category: 'Shawarma' }); }}
                            alt={item.name} 
                            className="w-10 h-10 object-cover rounded-lg bg-[#181818]"
                          />
                          <span className="text-white/80">{item.name} <span className="text-[#ef8f2f] ml-1 font-bold">×{item.quantity}</span></span>
                        </div>
                        <span className="font-bebas text-lg tracking-wide pr-2">₹{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-white/5 mt-4 pt-4 space-y-1.5 text-xs text-white/50">
                    {selectedOrder.discount_amount > 0 && (
                      <div className="flex justify-between text-green-400">
                        <span>Discount {selectedOrder.coupon_code ? `(${selectedOrder.coupon_code})` : ''}</span>
                        <span>-₹{Number(selectedOrder.discount_amount).toLocaleString()}</span>
                      </div>
                    )}
                    {Number(selectedOrder.gst_amount) > 0 && (
                      <div className="flex justify-between"><span>GST</span><span>₹{Number(selectedOrder.gst_amount).toLocaleString()}</span></div>
                    )}
                    {Number(selectedOrder.packing_charge) > 0 && (
                      <div className="flex justify-between"><span>Packing</span><span>₹{Number(selectedOrder.packing_charge).toLocaleString()}</span></div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-white/5 text-white font-bold text-sm">
                      <span>Total</span>
                      <span className="font-bebas text-xl text-[#ef8f2f]">₹{Number(selectedOrder.total).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4">
                    <h4 className="text-[10px] uppercase tracking-[2px] text-yellow-400/70 mb-1">Order Notes</h4>
                    <p className="text-sm text-white/70">{selectedOrder.notes}</p>
                  </div>
                )}

                {/* Status Timeline */}
                {drawerHistory.length > 0 && (
                  <div className="bg-black/30 border border-white/5 rounded-2xl p-5">
                    <h4 className="text-[10px] uppercase tracking-[2px] text-white/40 mb-4">Status Timeline</h4>
                    <div className="space-y-3">
                      {drawerHistory.map((h, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${
                              h.status === 'completed' ? 'bg-green-400' :
                              h.status === 'cancelled' ? 'bg-red-400' :
                              h.status === 'pending' ? 'bg-yellow-400' : 'bg-[#ef8f2f]'
                            }`} />
                            {i < drawerHistory.length - 1 && <div className="w-px flex-1 bg-white/10 mt-1.5 min-h-[20px]" />}
                          </div>
                          <div className="flex-1 pb-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold">{STATUS_LABELS[h.status] || h.status}</span>
                              <span className="text-[10px] text-white/30">{new Date(h.created_at).toLocaleTimeString()}</span>
                            </div>
                            {h.previous_status && (
                              <span className="text-[10px] text-white/30">from {STATUS_LABELS[h.previous_status] || h.previous_status}</span>
                            )}
                            {h.note && <p className="text-xs text-white/50 mt-0.5">{h.note}</p>}
                            {h.admin_name && <p className="text-[10px] text-white/30">by {h.admin_name}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </aside>
        </>
      )}

      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#141414] border-r border-white/5 flex flex-col shrink-0 relative z-50">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div>
            <h1 className="font-bebas text-3xl tracking-[2px] text-[#ef8f2f]">Shawarma Inn</h1>
            <p className="text-[10px] text-white/40 uppercase tracking-[2px]">Admin Portal</p>
          </div>
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications((v) => !v)}
              className="relative p-2 rounded-xl hover:bg-white/5 transition-colors text-white/50 hover:text-white"
            >
              <Bell size={18} />
              {notifications.filter((n) => !n.is_read).length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {notifications.filter((n) => !n.is_read).length > 9 ? '9+' : notifications.filter((n) => !n.is_read).length}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                  <span className="text-xs font-semibold uppercase tracking-[2px] text-white/60">Notifications</span>
                  {notifications.some((n) => !n.is_read) && (
                    <button
                      onClick={() => {
                        notifications.filter((n) => !n.is_read).forEach(n => handleMarkNotificationRead(n.id));
                        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
                      }}
                      className="text-[10px] text-[#ef8f2f] hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-white/30 text-sm">No notifications yet</div>
                  ) : notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (!n.is_read) handleMarkNotificationRead(n.id);
                        setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, is_read: 1 } : x));
                      }}
                      className={`px-4 py-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${n.is_read ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        <span className={`mt-0.5 flex-shrink-0 w-2 h-2 rounded-full ${n.type === 'new_order' ? 'bg-[#ef8f2f]' : 'bg-blue-400'}`} />
                        <div>
                          <p className="text-xs text-white/80">{n.message}</p>
                          <p className="text-[10px] text-white/30 mt-0.5">{new Date(n.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {([
            { key: 'overview', icon: LayoutDashboard, label: 'Dashboard' },
            { key: 'whatsapp', icon: MessageCircle, label: 'WhatsApp Orders' },
            { key: 'products', icon: Package, label: 'Menu Management' },
            { key: 'categories', icon: FolderTree, label: 'Categories' },
            { key: 'users', icon: Users, label: 'Customers' },
            { key: 'coupons', icon: Tag, label: 'Coupons' },
            { key: 'reviews', icon: Star, label: 'Reviews' },
            { key: 'franchise_leads', icon: Briefcase, label: 'Franchise Leads' },
            { key: 'activity_log', icon: Activity, label: 'Activity Log' },
            { key: 'settings', icon: Settings, label: 'Settings' },
          ] as Array<{ key: TabKey; icon: any; label: string }>).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${tab === key ? 'bg-[#ef8f2f] text-black font-semibold' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
            >
              <Icon size={18} /> {label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5 space-y-3">
          {user && (
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-[#ef8f2f]/20 border border-[#ef8f2f]/30 flex items-center justify-center flex-shrink-0">
                <UserCircle size={16} className="text-[#ef8f2f]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white/80 truncate">{(user as any).name || 'Admin'}</p>
                <p className="text-[10px] text-white/40 truncate">{(user as any).email || ''}</p>
              </div>
            </div>
          )}
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-gradient-to-br from-[#101010] to-[#141414]">
        {error && <div className="text-red-400 bg-red-400/10 p-4 rounded-xl text-sm mb-4 border border-red-400/20">{error}</div>}

        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex items-start justify-between">
              <div>
                <h2 className="font-bebas text-5xl tracking-[3px] uppercase">Business Overview</h2>
                <p className="text-sm text-white/50 mt-1">Real-time metrics calculated securely from completed orders.</p>
              </div>
              {loading && <div className="text-xs text-white/30 animate-pulse mt-2">Refreshing…</div>}
            </header>

            {/* Live Operations Status Strip */}
            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: 'Pending', value: summary.cards.pendingOrders, color: 'border-red-500/40 bg-red-500/5', dot: 'bg-red-500', icon: AlertCircle },
                  { label: 'Processing', value: summary.cards.processingOrders, color: 'border-yellow-500/40 bg-yellow-500/5', dot: 'bg-yellow-400', icon: Clock },
                  { label: 'In Transit', value: summary.cards.inTransitOrders, color: 'border-purple-500/40 bg-purple-500/5', dot: 'bg-purple-400', icon: Truck },
                  { label: 'Completed Today', value: summary.cards.completedToday, color: 'border-green-500/40 bg-green-500/5', dot: 'bg-green-400', icon: CheckCircle },
                  { label: 'Cancelled Today', value: summary.cards.cancelledToday, color: 'border-gray-500/30 bg-gray-500/5', dot: 'bg-gray-400', icon: XCircle },
                ].map(({ label, value, color, dot }) => (
                  <div key={label} className={`flex items-center gap-3 p-4 rounded-xl border ${color}`}>
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dot} ${label === 'Pending' && value > 0 ? 'animate-pulse' : ''}`} />
                    <div>
                      <p className="text-[10px] uppercase tracking-[1.5px] text-white/50">{label}</p>
                      <p className="font-bebas text-3xl leading-none mt-0.5">{value ?? 0}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Loading skeleton for summary cards */}
            {!summary && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-[#181818] border border-white/5 rounded-2xl p-6 animate-pulse">
                    <div className="h-3 w-24 bg-white/10 rounded mb-3" />
                    <div className="h-10 w-16 bg-white/10 rounded" />
                  </div>
                ))}
              </div>
            )}

            {summary && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="Today's Revenue" value={`₹${summary.cards.todaysRevenue.toLocaleString()}`} icon={IndianRupee} colorClass="text-green-400" />
                  <StatCard title="Today's Orders" value={summary.cards.todaysOrders} icon={Package} colorClass="text-[#ef8f2f]" />
                  <StatCard title="Avg Order Value" value={`₹${summary.cards.avgOrderValue?.toLocaleString() ?? 0}`} icon={TrendingUp} colorClass="text-blue-400" />
                  <StatCard title="Monthly Revenue" value={`₹${summary.cards.monthlyRevenue.toLocaleString()}`} icon={IndianRupee} colorClass="text-purple-400" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="New / Returning" value={`${summary.cards.newCustomersToday} / ${summary.cards.returningCustomers}`} icon={Users} colorClass="text-pink-400" />
                  <StatCard title="Peak Hour" value={summary.cards.peakOrderingTime} icon={Clock} colorClass="text-yellow-400" />
                  <StatCard title="Best Seller (Mo)" value={summary.cards.bestSellingProduct} icon={Star} colorClass="text-orange-400" />
                  <StatCard title="Coupons / Leads" value={`${summary.cards.couponUsageToday} / ${summary.cards.franchiseEnquiries}`} icon={Tag} colorClass="text-indigo-400" />
                </div>
              </>
            )}

            {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-[#181818] border border-white/5 rounded-2xl p-6">
                <h3 className="text-[11px] uppercase tracking-[2px] text-white/50 mb-6">Revenue Trend (30 Days)</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.revenueByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis dataKey="day" stroke="#ffffff50" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#ffffff50" tick={{ fontSize: 12 }} />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#101010', borderColor: '#ffffff20', color: '#fff' }} />
                      <Line type="monotone" dataKey="revenue" stroke="#ef8f2f" strokeWidth={3} dot={{ r: 4, fill: '#101010', stroke: '#ef8f2f', strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-[#181818] border border-white/5 rounded-2xl p-6">
                <h3 className="text-[11px] uppercase tracking-[2px] text-white/50 mb-6">Revenue by Category</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                        {categoryData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip contentStyle={{ backgroundColor: '#101010', borderColor: '#ffffff20', color: '#fff' }} formatter={(val: any) => `₹${Number(val).toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {categoryData.slice(0, 5).map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1.5 text-xs text-white/70">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      {entry.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            )}

            {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <div className="bg-[#181818] border border-white/5 rounded-2xl p-6 overflow-hidden">
                <h3 className="text-[11px] uppercase tracking-[2px] text-white/50 mb-4">Top Selling Products</h3>
                {analytics.topProducts?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-white/20">
                    <TrendingUp size={32} className="mb-2 opacity-30" />
                    <p className="text-sm">No sales data yet</p>
                  </div>
                ) : (
                <div className="space-y-4">
                  {analytics.topProducts?.slice(0, 5).map((p: any, i: number) => (
                    <div key={i} className="flex items-center justify-between group p-3 hover:bg-white/5 rounded-xl transition-colors">
                      <div>
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-xs text-white/40">{p.qty} sold</p>
                      </div>
                      <p className="text-[#ef8f2f] font-bebas text-xl">₹{p.revenue.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
                )}
              </div>
              <div className="bg-[#181818] border border-white/5 rounded-2xl p-6 overflow-hidden">
                <h3 className="text-[11px] uppercase tracking-[2px] text-white/50 mb-4">Recent Orders</h3>
                {(!summary?.recentOrders?.length) ? (
                  <div className="flex flex-col items-center justify-center h-32 text-white/20">
                    <Package size={32} className="mb-2 opacity-30" />
                    <p className="text-sm">No orders yet</p>
                  </div>
                ) : (
                <div className="space-y-4">
                  {summary?.recentOrders?.slice(0, 5).map((o: any) => (
                    <div key={o.id} className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                      <div>
                        <p className="font-semibold text-sm">#{o.order_number} - {o.customer_name || 'Guest'}</p>
                        <p className="text-xs text-white/40 mt-1">{new Date(o.created_at).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bebas text-xl text-[#ef8f2f]">₹{o.total.toLocaleString()}</p>
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${getStatusColor(o.status)}`}>
                          {o.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </div>
            </div>
            )}
          </div>
        )}

        {/* WHATSAPP ORDERS TAB */}
        {tab === 'whatsapp' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-bebas text-5xl tracking-[3px] uppercase">WhatsApp Orders</h2>
                <p className="text-sm text-white/50 mt-1">Manage order lifecycle. Revenue calculates only on Completed status.</p>
              </div>
            </header>

            <div className="flex flex-col md:flex-row gap-4 bg-[#181818] p-4 rounded-2xl border border-white/5">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                <input
                  type="text"
                  placeholder="Search order #, phone, or name..."
                  value={orderSearch}
                  onChange={e => setOrderSearch(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f] transition-colors"
                />
              </div>
              <div className="relative w-full md:w-64">
                <select
                  value={orderStatusFilter}
                  onChange={e => setOrderStatusFilter(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm appearance-none focus:outline-none focus:border-[#ef8f2f] transition-colors"
                >
                  <option value="">All Statuses</option>
                  {ADMIN_ORDER_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" size={16} />
              </div>
            </div>

            <div className="bg-[#181818] border border-white/5 rounded-2xl overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead className="bg-black/40 text-white/50 text-[10px] uppercase tracking-[2px]">
                  <tr>
                    <th className="p-4 text-left font-medium">Order Details</th>
                    <th className="p-4 text-left font-medium">Customer</th>
                    <th className="p-4 text-left font-medium">Items</th>
                    <th className="p-4 text-right font-medium">Total</th>
                    <th className="p-4 text-center font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading && orders.length === 0 ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={`skel-${i}`} className="animate-pulse">
                        <td className="p-4"><div className="h-6 w-20 bg-white/10 rounded mb-2" /><div className="h-4 w-32 bg-white/5 rounded" /></td>
                        <td className="p-4"><div className="h-5 w-24 bg-white/10 rounded mb-2" /><div className="h-4 w-28 bg-white/5 rounded" /></td>
                        <td className="p-4"><div className="h-6 w-32 bg-white/10 rounded" /></td>
                        <td className="p-4"><div className="h-8 w-16 bg-white/10 rounded ml-auto" /></td>
                        <td className="p-4"><div className="h-8 w-24 bg-white/10 rounded mx-auto" /></td>
                      </tr>
                    ))
                  ) : orders.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-white/40">No orders found.</td></tr>
                  ) : orders.map(order => (
                    <tr 
                      key={order.id} 
                      className="hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <td className="p-4">
                        <div className="font-bebas text-xl text-[#ef8f2f]">#{order.order_number}</div>
                        <div className="text-xs text-white/40">{new Date(order.created_at).toLocaleString()}</div>
                        <div className="text-xs mt-1 text-white/60 bg-white/5 inline-block px-2 py-0.5 rounded">{order.delivery_type.replace('_', ' ')}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold">{order.customer_name || 'Guest'}</div>
                        <div className="text-xs text-white/50">{order.customer_phone}</div>
                        {order.delivery_address && <div className="text-xs text-white/40 mt-1 max-w-[200px] truncate">{order.delivery_address}</div>}
                      </td>
                      <td className="p-4 max-w-[300px]">
                        <div className="flex flex-wrap gap-1">
                          {order.items?.map((item: any) => (
                            <span key={item.id} className="text-xs bg-black/40 border border-white/10 px-2 py-1 rounded text-white/70">
                              {item.name} <span className="text-[#ef8f2f]">x{item.quantity}</span>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-bebas text-2xl tracking-wider">₹{order.total.toLocaleString()}</div>
                        {order.discount_amount > 0 && <div className="text-[10px] text-green-400">-{order.discount_amount} (Coupon)</div>}
                      </td>
                      <td className="p-4 text-center">
                        <div className="relative inline-block text-left w-32">
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className={`w-full appearance-none px-3 py-2 border rounded-lg text-xs font-bold uppercase tracking-wider text-center cursor-pointer outline-none transition-colors ${getStatusColor(order.status)}`}
                          >
                            {ADMIN_ORDER_STATUSES.map((status) => (
                              <option key={status} value={status} className="bg-[#101010] text-white">{status.replace('_', ' ')}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" size={14} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PRODUCTS / MENU TAB */}
        {tab === 'products' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <header>
              <h2 className="font-bebas text-5xl tracking-[3px] uppercase">Menu Management</h2>
            </header>

            <div className="bg-[#181818] border border-white/5 rounded-2xl p-6">
              <h3 className="font-bebas text-2xl tracking-[2px] uppercase mb-4 text-[#ef8f2f]">{editingMenuId ? 'Edit Item' : 'Add New Item'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <input type="text" placeholder="Item Name" value={menuForm.name} onChange={e => setMenuForm({...menuForm, name: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f]" />
                <input type="number" placeholder="Price (₹)" value={menuForm.price} onChange={e => setMenuForm({...menuForm, price: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f]" />
                <select value={menuForm.category} onChange={e => setMenuForm({...menuForm, category: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f] text-white">
                  <option value="" disabled>Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
                <input type="text" placeholder="Image URL (optional)" value={menuForm.image_url} onChange={e => setMenuForm({...menuForm, image_url: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f]" />
              </div>
              <div className="flex items-center gap-6 mb-6">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-white/70 hover:text-white">
                  <input type="checkbox" checked={menuForm.is_active} onChange={e => setMenuForm({...menuForm, is_active: e.target.checked})} className="accent-[#ef8f2f] w-4 h-4" />
                  Available for Order
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-white/70 hover:text-white">
                  <input type="checkbox" checked={menuForm.is_bestseller} onChange={e => setMenuForm({...menuForm, is_bestseller: e.target.checked})} className="accent-[#ef8f2f] w-4 h-4" />
                  Mark as Bestseller
                </label>
              </div>
              <div className="flex gap-3">
                <button onClick={handleMenuSubmit} className="bg-[#ef8f2f] text-black px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-[#ef8f2f]/90 transition-colors">
                  {editingMenuId ? 'Update Item' : 'Add Item'}
                </button>
                {editingMenuId && (
                  <button onClick={() => { setEditingMenuId(null); setMenuForm(emptyMenuItem); }} className="px-6 py-3 border border-white/20 rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-white/5 transition-colors">
                    Cancel
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {menuItems.map(item => (
                <div key={item.id} className={`bg-[#181818] border rounded-2xl overflow-hidden transition-all ${item.is_active ? 'border-white/10 hover:border-white/30' : 'border-red-500/20 opacity-70'}`}>
                  {item.image_url && <div className="h-32 w-full bg-black/40"><img src={item.image_url} alt={item.name} className="w-full h-full object-cover opacity-80" /></div>}
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-lg leading-tight">{item.name}</h4>
                      {item.is_bestseller && <Star size={16} className="text-yellow-400 fill-yellow-400 shrink-0" />}
                    </div>
                    <p className="text-xs text-white/50 mb-3">{item.category}</p>
                    <p className="font-bebas text-3xl text-[#ef8f2f] mb-4">₹{item.price}</p>
                    
                    <div className="flex items-center justify-between border-t border-white/5 pt-4">
                      <button onClick={() => handleToggleMenuVisibility(item.id)} className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${item.is_active ? 'text-green-400' : 'text-red-400'}`}>
                        {item.is_active ? <><Eye size={14} /> Active</> : <><EyeOff size={14} /> Hidden</>}
                      </button>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingMenuId(item.id); setMenuForm({ name: item.name, price: String(item.price), category: item.category, image_url: item.image_url || '', is_bestseller: !!item.is_bestseller, is_active: !!item.is_active }); }} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDuplicateMenu(item.id)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white" title="Duplicate">
                          <Copy size={16} />
                        </button>
                        <a href={`/menu`} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white flex items-center justify-center" title="Preview on Website">
                          <ExternalLink size={16} />
                        </a>
                        <button onClick={() => handleDeleteMenu(item.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors text-red-400" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CATEGORIES TAB */}
        {tab === 'categories' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <header>
              <h2 className="font-bebas text-5xl tracking-[3px] uppercase">Categories</h2>
            </header>

            <div className="bg-[#181818] border border-white/5 rounded-2xl p-6">
              <h3 className="font-bebas text-2xl tracking-[2px] uppercase mb-4 text-[#ef8f2f]">{editingCategoryId ? 'Edit Category' : 'Add New Category'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <input type="text" placeholder="Category Name" value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f]" />
                <input type="number" placeholder="Display Order (e.g. 1)" value={categoryForm.display_order} onChange={e => setCategoryForm({...categoryForm, display_order: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f]" />
              </div>
              <div className="flex items-center gap-6 mb-6">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-white/70 hover:text-white">
                  <input type="checkbox" checked={categoryForm.is_active} onChange={e => setCategoryForm({...categoryForm, is_active: e.target.checked})} className="accent-[#ef8f2f] w-4 h-4" />
                  Active
                </label>
              </div>
              <div className="flex gap-3">
                <button onClick={handleCategorySubmit} className="bg-[#ef8f2f] text-black px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-[#ef8f2f]/90 transition-colors">
                  {editingCategoryId ? 'Update Category' : 'Add Category'}
                </button>
                {editingCategoryId && (
                  <button onClick={() => { setEditingCategoryId(null); setCategoryForm(emptyCategory); }} className="px-6 py-3 border border-white/20 rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-white/5 transition-colors">
                    Cancel
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {categories.map(cat => (
                <div key={cat.id} className={`bg-[#181818] border p-5 rounded-2xl transition-all ${cat.is_active ? 'border-white/10 hover:border-white/30' : 'border-red-500/20 opacity-70'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-lg leading-tight">{cat.name}</h4>
                  </div>
                  <p className="text-xs text-white/50 mb-3">Order: {cat.display_order}</p>
                  
                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${cat.is_active ? 'text-green-400' : 'text-red-400'}`}>
                      {cat.is_active ? 'Active' : 'Hidden'}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingCategoryId(cat.id); setCategoryForm({ name: cat.name, display_order: String(cat.display_order), is_active: !!cat.is_active }); }} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors text-red-400">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CUSTOMERS TAB */}
        {tab === 'users' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="font-bebas text-5xl tracking-[3px] uppercase">Customer Management</h2>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                <input
                  type="text"
                  placeholder="Search phone or name..."
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f] transition-colors"
                />
              </div>
            </header>

            <div className="bg-[#181818] border border-white/5 rounded-2xl overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="bg-black/40 text-white/50 text-[10px] uppercase tracking-[2px]">
                  <tr>
                    <th className="p-4 text-left font-medium">Customer Info</th>
                    <th className="p-4 text-center font-medium">Orders Count</th>
                    <th className="p-4 text-right font-medium">Total Spend (Completed)</th>
                    <th className="p-4 text-right font-medium">Last Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {customers.map((c, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold">{c.name || 'Unknown'}</div>
                        <div className="text-xs text-white/50">{c.phone}</div>
                        {c.email && <div className="text-xs text-white/40">{c.email}</div>}
                      </td>
                      <td className="p-4 text-center">
                        <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold">{c.order_count}</span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-bebas text-2xl text-[#ef8f2f] tracking-wider">₹{c.total_spend.toLocaleString()}</div>
                      </td>
                      <td className="p-4 text-right text-xs text-white/60">
                        {c.last_order_date ? new Date(c.last_order_date).toLocaleDateString() : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* COUPONS TAB */}
        {tab === 'coupons' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <header>
              <h2 className="font-bebas text-5xl tracking-[3px] uppercase">Coupon Management</h2>
            </header>

            <div className="bg-[#181818] border border-white/5 rounded-2xl p-6">
              <h3 className="font-bebas text-2xl tracking-[2px] uppercase mb-4 text-[#ef8f2f]">{editingCouponId ? 'Edit Coupon' : 'Create Coupon'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                <input type="text" placeholder="Code (e.g. SAVE10)" value={couponForm.code} onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})} className="lg:col-span-2 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f]" />
                <select value={couponForm.discount_type} onChange={e => setCouponForm({...couponForm, discount_type: e.target.value as any})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f]">
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
                <input type="number" placeholder="Discount Value" value={couponForm.discount_value} onChange={e => setCouponForm({...couponForm, discount_value: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f]" />
                <input type="number" placeholder="Min Order (₹)" value={couponForm.min_order_value} onChange={e => setCouponForm({...couponForm, min_order_value: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f]" />
                <input type="number" placeholder="Max Discount (₹)" value={couponForm.max_discount} onChange={e => setCouponForm({...couponForm, max_discount: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f]" disabled={couponForm.discount_type === 'fixed'} />
                <input type="date" value={couponForm.expiry_date} onChange={e => setCouponForm({...couponForm, expiry_date: e.target.value})} className="lg:col-span-2 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f] text-white/70" />
                <input type="number" placeholder="Usage Limit (optional)" value={couponForm.usage_limit} onChange={e => setCouponForm({...couponForm, usage_limit: e.target.value})} className="lg:col-span-2 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f]" />
              </div>
              <div className="flex gap-3">
                <button onClick={handleCouponSubmit} className="bg-[#ef8f2f] text-black px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-[#ef8f2f]/90 transition-colors">
                  {editingCouponId ? 'Update Coupon' : 'Create Coupon'}
                </button>
                {editingCouponId && (
                  <button onClick={() => { setEditingCouponId(null); setCouponForm(emptyCoupon); }} className="px-6 py-3 border border-white/20 rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-white/5 transition-colors">
                    Cancel
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coupons.map(c => (
                <div key={c.id} className={`bg-[#181818] border p-6 rounded-2xl transition-all ${c.is_active ? 'border-white/10 hover:border-[#ef8f2f]/50' : 'border-red-500/20 opacity-70'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bebas text-3xl tracking-widest text-[#ef8f2f]">{c.code}</h4>
                      <p className="text-sm font-semibold">{c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}</p>
                    </div>
                    <div className="text-right text-xs text-white/50">
                      <p>Uses: {c.usage_count} {c.usage_limit ? `/ ${c.usage_limit}` : ''}</p>
                      {c.expiry_date && <p>Expires: {new Date(c.expiry_date).toLocaleDateString()}</p>}
                    </div>
                  </div>
                  <div className="text-xs text-white/50 mb-4 space-y-1">
                    {c.min_order_value > 0 && <p>Min Order: ₹{c.min_order_value}</p>}
                    {c.max_discount > 0 && c.discount_type === 'percentage' && <p>Max Discount: ₹{c.max_discount}</p>}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 bg-black/40 p-3 rounded-xl mb-4 border border-white/5">
                    <div className="text-center">
                      <p className="text-[10px] uppercase text-white/40 tracking-wider">Usage</p>
                      <p className="font-bebas text-lg tracking-wider text-[#ef8f2f]">{c.total_usage || 0}</p>
                    </div>
                    <div className="text-center border-l border-r border-white/10">
                      <p className="text-[10px] uppercase text-white/40 tracking-wider">Revenue</p>
                      <p className="font-bebas text-lg tracking-wider text-green-400">₹{c.revenue_generated?.toLocaleString() || 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase text-white/40 tracking-wider">Given</p>
                      <p className="font-bebas text-lg tracking-wider text-red-400">₹{c.discount_given?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center border-t border-white/5 pt-4">
                     <button onClick={() => handleToggleCoupon(c.id)} className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${c.is_active ? 'text-green-400' : 'text-red-400'}`}>
                        {c.is_active ? <><CheckCircle size={14} /> Active</> : <><XCircle size={14} /> Disabled</>}
                      </button>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingCouponId(c.id); setCouponForm({ code: c.code, discount_type: c.discount_type, discount_value: String(c.discount_value), min_order_value: String(c.min_order_value), max_discount: c.max_discount ? String(c.max_discount) : '', expiry_date: c.expiry_date ? c.expiry_date.slice(0, 10) : '', usage_limit: c.usage_limit ? String(c.usage_limit) : '' }); }} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDeleteCoupon(c.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors text-red-400">
                          <Trash2 size={16} />
                        </button>
                      </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REVIEWS TAB */}
        {tab === 'reviews' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <header>
              <h2 className="font-bebas text-5xl tracking-[3px] uppercase">Customer Reviews</h2>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reviews.map(r => (
                <div key={r.id} className={`bg-[#181818] border p-6 rounded-2xl transition-all ${!r.is_hidden ? 'border-white/10' : 'border-white/5 opacity-50 grayscale'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center font-bebas text-xl text-[#ef8f2f]">
                        {r.avatar_url ? <img src={r.avatar_url} alt={r.name} className="w-full h-full object-cover" /> : r.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm leading-tight">{r.name}</h4>
                        <p className="text-[10px] text-white/40">{new Date(r.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className={i < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-white/70 italic mb-6">"{r.review_text}"</p>
                  
                  <div className="flex justify-end gap-2 border-t border-white/5 pt-4">
                     <button onClick={() => handleToggleReviewVisibility(r.id)} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${r.is_hidden ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'}`}>
                        {r.is_hidden ? <><Eye size={14} /> Approve</> : <><EyeOff size={14} /> Hide</>}
                      </button>
                      <button onClick={() => handleDeleteReview(r.id)} className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center gap-2">
                        <Trash2 size={14} /> Delete
                      </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FRANCHISE LEADS TAB */}
        {/* SETTINGS TAB */}
        {tab === 'settings' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-bebas text-5xl tracking-[3px] uppercase">Restaurant Settings</h2>
                <p className="text-sm text-white/50 mt-1">Configure restaurant details, pricing, and integrations.</p>
              </div>
              <button
                onClick={handleSaveSettings}
                disabled={settingsSaving}
                className="bg-[#ef8f2f] text-black px-8 py-3 rounded-full text-sm font-bold uppercase tracking-wider hover:bg-[#ef8f2f]/90 transition-colors disabled:opacity-60"
              >
                {settingsSaving ? 'Saving…' : 'Save All Changes'}
              </button>
            </header>

            {settingsRows.length === 0 ? (
              <div className="bg-[#181818] border border-white/5 rounded-2xl p-12 text-center text-white/40">
                Loading settings…
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {(['general', 'contact', 'hours', 'pricing', 'ordering', 'social'] as const).map((section) => {
                  const sectionRows = settingsRows.filter((r) => r.section === section);
                  if (!sectionRows.length) return null;
                  const sectionLabel: Record<string, string> = {
                    general: 'General', contact: 'Contact', hours: 'Operating Hours',
                    pricing: 'Pricing & Taxes', ordering: 'Ordering', social: 'Social & Delivery Links',
                  };
                  return (
                    <div key={section} className="bg-[#181818] border border-white/5 rounded-2xl p-6">
                      <h3 className="text-[11px] uppercase tracking-[2px] text-[#ef8f2f] mb-5 font-semibold">
                        {sectionLabel[section] || section}
                      </h3>
                      <div className="space-y-4">
                        {sectionRows.map((row) => (
                          <div key={row.key}>
                            <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">
                              {row.label}
                            </label>
                            {row.type === 'boolean' ? (
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => setSettingsDraft((d) => ({
                                    ...d,
                                    [row.key]: d[row.key] === 'true' ? 'false' : 'true',
                                  }))}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settingsDraft[row.key] === 'true' ? 'bg-[#ef8f2f]' : 'bg-white/10'}`}
                                >
                                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${settingsDraft[row.key] === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                                <span className="text-sm text-white/70">
                                  {settingsDraft[row.key] === 'true' ? 'Enabled' : 'Disabled'}
                                </span>
                              </div>
                            ) : (
                              <input
                                type={row.type === 'number' ? 'number' : row.type === 'url' ? 'url' : 'text'}
                                value={settingsDraft[row.key] ?? ''}
                                onChange={(e) => setSettingsDraft((d) => ({ ...d, [row.key]: e.target.value }))}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f] transition-colors"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* FRANCHISE LEADS TAB */}
        {tab === 'franchise_leads' && (
          <div className="space-y-6 animate-in fade-in duration-500">
             <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="font-bebas text-5xl tracking-[3px] uppercase">Franchise Leads</h2>
              <button
                onClick={async () => {
                  const res = await fetch('/api/admin/franchise-leads/export?format=csv', {
                    headers: { Authorization: `Bearer ${tokenRequired}` },
                  });
                  if (!res.ok) { alert('Export failed'); return; }
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'franchise-leads.csv';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full text-sm font-bold uppercase tracking-wider transition-colors"
              >
                Export CSV
              </button>
            </header>

            <div className="bg-[#181818] border border-white/5 rounded-2xl overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead className="bg-black/40 text-white/50 text-[10px] uppercase tracking-[2px]">
                  <tr>
                    <th className="p-4 text-left font-medium">Date</th>
                    <th className="p-4 text-left font-medium">Name</th>
                    <th className="p-4 text-left font-medium">Contact</th>
                    <th className="p-4 text-left font-medium">City</th>
                    <th className="p-4 text-left font-medium">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {leads.map(lead => (
                    <tr key={lead.id} className="hover:bg-white/5 transition-colors align-top">
                      <td className="p-4 text-xs text-white/50 whitespace-nowrap">{new Date(lead.created_at).toLocaleString()}</td>
                      <td className="p-4 font-semibold">{lead.name}</td>
                      <td className="p-4">
                        <div className="text-white/90">{lead.phone}</div>
                        <div className="text-xs text-white/50">{lead.email}</div>
                      </td>
                      <td className="p-4 text-white/70">{lead.city || '-'}</td>
                      <td className="p-4 text-xs text-white/70 max-w-[300px]">{lead.message || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ACTIVITY LOG TAB */}
        {tab === 'activity_log' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <header>
              <h2 className="font-bebas text-5xl tracking-[3px] uppercase">Activity Log</h2>
              <p className="text-sm text-white/50 mt-1">Admin actions and system events, newest first.</p>
            </header>

            {loading ? (
              <div className="space-y-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-[#181818] border border-white/5 rounded-xl p-4 animate-pulse flex gap-4">
                    <div className="w-10 h-10 bg-white/10 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-48 bg-white/10 rounded" />
                      <div className="h-2 w-32 bg-white/10 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activityLog.length === 0 ? (
              <div className="bg-[#181818] border border-white/5 rounded-2xl p-16 text-center">
                <Activity size={40} className="mx-auto mb-3 text-white/20" />
                <p className="text-white/40">No activity logged yet.</p>
              </div>
            ) : (
              <div className="bg-[#181818] border border-white/5 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-black/40 text-white/50 text-[10px] uppercase tracking-[2px]">
                    <tr>
                      <th className="p-4 text-left font-medium">Timestamp</th>
                      <th className="p-4 text-left font-medium">Admin</th>
                      <th className="p-4 text-left font-medium">Action</th>
                      <th className="p-4 text-left font-medium">Entity</th>
                      <th className="p-4 text-left font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {activityLog.map((log: any, i: number) => (
                      <tr key={log.id ?? i} className="hover:bg-white/5 transition-colors align-top">
                        <td className="p-4 text-xs text-white/40 whitespace-nowrap">
                          {new Date(log.created_at || log.timestamp).toLocaleString()}
                        </td>
                        <td className="p-4 text-xs text-white/70">{log.admin_email || log.admin_name || 'System'}</td>
                        <td className="p-4">
                          <span className="inline-block px-2 py-0.5 bg-[#ef8f2f]/10 text-[#ef8f2f] text-[10px] uppercase tracking-wider rounded font-semibold">
                            {log.action || '—'}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-white/80">
                          {log.entity_type || '—'}
                          {log.entity_id ? <span className="text-white/40 text-xs ml-1">#{log.entity_id}</span> : null}
                        </td>
                        <td className="p-4 text-xs text-white/40 max-w-[300px] truncate">{log.details || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
