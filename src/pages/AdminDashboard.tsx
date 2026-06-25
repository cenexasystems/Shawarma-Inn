import { useEffect, useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
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
  Trash2
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
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

type TabKey = 'overview' | 'whatsapp' | 'products' | 'users' | 'coupons' | 'reviews' | 'franchise_leads';

const COLORS = ['#ef8f2f', '#dc2626', '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'];
const ADMIN_ORDER_STATUSES = ['pending', 'processing', 'in_transit', 'completed', 'cancelled'];

const emptyMenuItem = {
  name: '',
  price: '',
  category: '',
  image_url: '',
  is_bestseller: false,
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

  const tokenRequired = token || '';

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
        const menuRes = await apiRequest<any>('/admin/menu-items', { token: tokenRequired });
        setMenuItems(menuRes.items || []);
      } else if (tab === 'users') {
        const custRes = await apiRequest<any>(`/admin/customers?search=${encodeURIComponent(customerSearch)}`, { token: tokenRequired });
        setCustomers(custRes.customers || []);
      } else if (tab === 'coupons') {
        const coupRes = await apiRequest<any>('/admin/coupons', { token: tokenRequired });
        setCoupons(coupRes.coupons || []);
      } else if (tab === 'reviews') {
        const revRes = await apiRequest<any>('/reviews?limit=100', { token: tokenRequired });
        setReviews(revRes.reviews || []);
      } else if (tab === 'franchise_leads') {
        const leadRes = await apiRequest<any>('/admin/franchise-leads', { token: tokenRequired });
        setLeads(leadRes.leads || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [tab, orderSearch, orderStatusFilter, customerSearch]);

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

  // Bypassing auth checks for all users to view admin dashboard
  // if (!user) return <Navigate to="/admin/login" replace />;
  // if (user.role !== 'admin') return <Navigate to="/" replace />;

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
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#141414] border-r border-white/5 flex flex-col shrink-0">
        <div className="p-6 border-b border-white/5">
          <h1 className="font-bebas text-3xl tracking-[2px] text-[#ef8f2f]">Shawarma Inn</h1>
          <p className="text-[10px] text-white/40 uppercase tracking-[2px]">Admin Portal</p>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <button onClick={() => setTab('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${tab === 'overview' ? 'bg-[#ef8f2f] text-black font-semibold' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button onClick={() => setTab('whatsapp')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${tab === 'whatsapp' ? 'bg-[#ef8f2f] text-black font-semibold' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
            <MessageCircle size={18} /> WhatsApp Orders
          </button>
          <button onClick={() => setTab('products')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${tab === 'products' ? 'bg-[#ef8f2f] text-black font-semibold' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
            <Package size={18} /> Menu Management
          </button>
          <button onClick={() => setTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${tab === 'users' ? 'bg-[#ef8f2f] text-black font-semibold' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
            <Users size={18} /> Customers
          </button>
          <button onClick={() => setTab('coupons')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${tab === 'coupons' ? 'bg-[#ef8f2f] text-black font-semibold' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
            <Tag size={18} /> Coupons
          </button>
          <button onClick={() => setTab('reviews')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${tab === 'reviews' ? 'bg-[#ef8f2f] text-black font-semibold' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
            <Star size={18} /> Reviews
          </button>
          <button onClick={() => setTab('franchise_leads')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${tab === 'franchise_leads' ? 'bg-[#ef8f2f] text-black font-semibold' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
            <Briefcase size={18} /> Franchise Leads
          </button>
        </nav>
        <div className="p-4 border-t border-white/5">
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-gradient-to-br from-[#101010] to-[#141414]">
        {loading && <div className="text-white/50 text-sm mb-4 animate-pulse">Loading data...</div>}
        {error && <div className="text-red-400 bg-red-400/10 p-4 rounded-xl text-sm mb-4 border border-red-400/20">{error}</div>}

        {/* OVERVIEW TAB */}
        {tab === 'overview' && summary && analytics && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <header>
              <h2 className="font-bebas text-5xl tracking-[3px] uppercase">Business Overview</h2>
              <p className="text-sm text-white/50 mt-1">Real-time metrics calculated securely from completed orders.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Today's Revenue" value={`₹${summary.cards.todaysRevenue.toLocaleString()}`} icon={IndianRupee} colorClass="text-green-400" />
              <StatCard title="Today's Orders" value={summary.cards.todaysOrders} icon={Package} colorClass="text-[#ef8f2f]" />
              <StatCard title="Pending Orders" value={summary.cards.pendingOrders} icon={Clock} colorClass="text-yellow-400" />
              <StatCard title="Monthly Revenue" value={`₹${summary.cards.monthlyRevenue.toLocaleString()}`} icon={TrendingUp} colorClass="text-blue-400" />
            </div>

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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <div className="bg-[#181818] border border-white/5 rounded-2xl p-6 overflow-hidden">
                <h3 className="text-[11px] uppercase tracking-[2px] text-white/50 mb-4">Top Selling Products</h3>
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
              </div>
              <div className="bg-[#181818] border border-white/5 rounded-2xl p-6 overflow-hidden">
                <h3 className="text-[11px] uppercase tracking-[2px] text-white/50 mb-4">Recent Orders</h3>
                <div className="space-y-4">
                  {summary.recentOrders?.slice(0, 5).map((o: any) => (
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
              </div>
            </div>
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
                  {orders.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-white/40">No orders found.</td></tr>
                  ) : orders.map(order => (
                    <tr key={order.id} className="hover:bg-white/5 transition-colors">
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
                <input type="text" placeholder="Category" value={menuForm.category} onChange={e => setMenuForm({...menuForm, category: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f]" />
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
                        <button onClick={() => { setEditingMenuId(item.id); setMenuForm({ name: item.name, price: String(item.price), category: item.category, image_url: item.image_url || '', is_bestseller: !!item.is_bestseller, is_active: !!item.is_active }); }} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDeleteMenu(item.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors text-red-400">
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
                  <div className="text-xs text-white/50 mb-6 space-y-1">
                    {c.min_order_value > 0 && <p>Min Order: ₹{c.min_order_value}</p>}
                    {c.max_discount > 0 && c.discount_type === 'percentage' && <p>Max Discount: ₹{c.max_discount}</p>}
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
        {tab === 'franchise_leads' && (
          <div className="space-y-6 animate-in fade-in duration-500">
             <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="font-bebas text-5xl tracking-[3px] uppercase">Franchise Leads</h2>
              <button onClick={() => window.open('/api/admin/franchise-leads/export?format=csv&token=' + tokenRequired)} className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full text-sm font-bold uppercase tracking-wider transition-colors">
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
      </main>
    </div>
  );
}
