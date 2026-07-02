import { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageCircle,
  Package,
  Users,
  Tag,
  Star,
  Briefcase,
  Settings,
  Bell,
  Activity,
  UserCircle,
  LogOut,
  FolderTree,
  Video,
  BarChart3,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { apiRequest } from '../../lib/api';

export default function AdminLayout() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const notifIdRef = useRef(0);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  const tokenRequired = token || '';

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const notifRes = await apiRequest<any>('/admin/notifications', { token: tokenRequired });
        setNotifications(notifRes || []);
      } catch (err) {}
    };
    if (tokenRequired) {
      void fetchNotifs();
    }
  }, [tokenRequired]);

  useEffect(() => {
    if (!tokenRequired) return;
    const es = new EventSource(`/api/admin/events?token=${encodeURIComponent(tokenRequired)}`);
    
    es.addEventListener('new_order', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data || '{}');
        const id = ++notifIdRef.current;
        setNotifications((prev) => [
          { id, message: `New Order #${data.orderNumber} from ${data.customerName || 'Guest'}`, type: 'new_order', created_at: new Date().toISOString(), is_read: 0 },
          ...prev.slice(0, 49),
        ]);
        playNewOrderBeep();
      } catch {}
    });

    es.addEventListener('order_status', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data || '{}');
        const id = ++notifIdRef.current;
        setNotifications((prev) => [
          { id, message: `Order #${data.orderNumber} status changed to ${data.status}`, type: 'status_update', created_at: new Date().toISOString(), is_read: 0 },
          ...prev.slice(0, 49),
        ]);
      } catch {}
    });

    return () => es.close();
  }, [tokenRequired]);

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

  const handleMarkNotificationRead = async (id: number) => {
    try {
      await apiRequest(`/admin/notifications/${id}/read`, { method: 'POST', token: tokenRequired });
    } catch {}
  };

  const NAV_ITEMS = [
    { key: 'overview', path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { key: 'orders', path: '/admin/orders', icon: MessageCircle, label: 'WhatsApp Orders' },
    { key: 'menu', path: '/admin/menu', icon: Package, label: 'Menu Management' },
    { key: 'categories', path: '/admin/categories', icon: FolderTree, label: 'Categories' },
    { key: 'customers', path: '/admin/customers', icon: Users, label: 'Customers' },
    { key: 'coupons', path: '/admin/coupons', icon: Tag, label: 'Coupons' },
    { key: 'reviews', path: '/admin/reviews', icon: Star, label: 'Reviews' },
    { key: 'franchise', path: '/admin/franchise', icon: Briefcase, label: 'Franchise Leads' },
    { key: 'videos', path: '/admin/videos', icon: Video, label: 'Videos' },
    { key: 'activity', path: '/admin/activity', icon: Activity, label: 'Activity Log' },
    { key: 'reports', path: '/admin/reports', icon: BarChart3, label: 'Reports' },
    { key: 'users', path: '/admin/users', icon: Users, label: 'Admin Access' },
    { key: 'settings', path: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden font-body selection:bg-[#ef8f2f] selection:text-black">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-[60] lg:hidden backdrop-blur-sm" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 ${collapsed ? 'lg:w-20' : 'lg:w-64'} bg-[#0a0a0a]/90 backdrop-blur-2xl border-r border-white/[0.05] flex flex-col shrink-0 z-[70] transition-all duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="border-b border-white/5">
          <div className={`flex items-center pt-4 px-4 ${collapsed ? 'justify-center' : 'justify-between'}`}>
            <button
              onClick={() => setCollapsed((v) => !v)}
              className="hidden lg:flex p-2 rounded-lg hover:bg-[#d62b2b]/10 text-white/50 hover:text-[#ff3a3a] transition-colors shrink-0"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            </button>
            {!collapsed && (
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
              <div className="absolute top-full right-0 mt-3 w-80 bg-[#121212]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.7)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-gradient-to-r from-[#ef8f2f]/10 to-transparent">
                  <span className="text-xs font-bold uppercase tracking-[2px] text-[#ef8f2f]">Notifications</span>
                  {notifications.some((n) => !n.is_read) && (
                    <button
                      onClick={() => {
                        notifications.filter((n) => !n.is_read).forEach(n => handleMarkNotificationRead(n.id));
                        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
                      }}
                      className="text-[10px] text-white/50 hover:text-white transition-colors uppercase tracking-[1px]"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                  {notifications.length === 0 ? (
                    <div className="p-8 flex flex-col items-center justify-center text-center">
                      <Bell size={24} className="text-white/10 mb-3" />
                      <p className="text-white/30 text-sm font-medium">All caught up!</p>
                      <p className="text-white/20 text-xs mt-1">No new notifications</p>
                    </div>
                  ) : notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (!n.is_read) handleMarkNotificationRead(n.id);
                        setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, is_read: 1 } : x));
                      }}
                      className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors group ${n.is_read ? 'opacity-60 bg-transparent' : 'bg-white/[0.02]'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] ${n.type === 'new_order' ? 'bg-[#ef8f2f] shadow-[#ef8f2f]' : 'bg-blue-400 shadow-blue-400'}`} />
                        <div className="flex-1">
                          <p className={`text-xs ${n.is_read ? 'text-white/60' : 'text-white/90 font-medium group-hover:text-white'}`}>{n.message}</p>
                          <p className="text-[10px] text-white/40 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          )}
          </div>
          {!collapsed && (
            <div className="px-5 pt-3 pb-5">
              <h1 className="font-bebas text-4xl tracking-[2px] leading-none hero-brand">Shawarma Inn</h1>
              <p className="text-[10px] text-white/40 uppercase tracking-[2px] mt-2">Admin Portal</p>
            </div>
          )}
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ key, path, icon: Icon, label }) => {
            const isActive = path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(path);
            return (
              <button
                key={key}
                onClick={() => navigate(path)}
                title={collapsed ? label : undefined}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-300 relative group ${collapsed ? 'justify-center' : ''} ${
                  isActive
                    ? 'bg-[#d62b2b]/10 text-white font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                    : 'text-white/50 hover:bg-white/[0.04] hover:text-white/90'
                }`}
              >
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/5 bg-[#d62b2b] rounded-r-full shadow-[0_0_10px_#d62b2b]" />}
                <Icon size={18} className="shrink-0" /> {!collapsed && label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/5 space-y-3">
          {user && !collapsed && (
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-[#d62b2b]/20 border border-[#d62b2b]/30 flex items-center justify-center flex-shrink-0">
                <UserCircle size={16} className="text-[#ff3a3a]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white/80 truncate">{(user as any).name || 'Admin'}</p>
                <p className="text-[10px] text-white/40 truncate">{(user as any).email || ''}</p>
              </div>
            </div>
          )}
          <button
            onClick={() => { logout(); navigate('/admin/login'); }}
            title={collapsed ? 'Logout' : undefined}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all"
          >
            <LogOut size={16} /> {!collapsed && 'Logout'}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -m-2 text-white/70 hover:text-white" aria-label="Open menu">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="font-bebas text-xl hero-brand tracking-[2px] uppercase">Shawarma Inn</h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0a0a0a] to-[#121212] p-4 md:p-8 relative">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#ef8f2f]/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="relative z-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
