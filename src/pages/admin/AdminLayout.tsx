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
  Video
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { apiRequest } from '../../lib/api';

export default function AdminLayout() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifIdRef = useRef(0);

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
    const es = new EventSource(`/api/events?token=${encodeURIComponent(tokenRequired)}`);
    
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
      <aside className="w-full md:w-64 bg-[#141414] border-r border-white/5 flex flex-col shrink-0 relative z-50">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div>
            <h1 className="font-bebas text-3xl tracking-[2px] text-[#ef8f2f]">Shawarma Inn</h1>
            <p className="text-[10px] text-white/40 uppercase tracking-[2px]">Admin Portal</p>
          </div>
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
          {NAV_ITEMS.map(({ key, path, icon: Icon, label }) => {
            const isActive = path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(path);
            return (
              <button
                key={key}
                onClick={() => navigate(path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                  isActive
                    ? 'bg-[#ef8f2f] text-black font-semibold'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={18} /> {label}
              </button>
            );
          })}
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
          <button onClick={() => { logout(); navigate('/admin/login'); }} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-[#101010] to-[#141414] p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
