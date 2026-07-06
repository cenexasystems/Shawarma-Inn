import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, MessageCircle, Package, Users, Tag, Star, 
  Briefcase, Settings, BellRing, Bell, Activity, UserCircle, 
  LogOut, FolderTree, Video, BarChart3, PanelLeftClose, PanelLeftOpen,
  Store
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAdminContext } from '../../context/AdminContext';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { unacknowledgedAlerts, acknowledgeAlert } = useAdminContext();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  const NAV_ITEMS = [
    { key: 'overview', path: '/admin', icon: Store, label: 'Operations Center' },
    { key: 'whatsapp', path: '/admin/whatsapp', icon: MessageCircle, label: 'WhatsApp Center' },
    { key: 'menu', path: '/admin/menu', icon: Package, label: 'Menu Management' },
    { key: 'categories', path: '/admin/categories', icon: FolderTree, label: 'Categories' },
    { key: 'coupons', path: '/admin/coupons', icon: Tag, label: 'Coupons' },
    { key: 'reviews', path: '/admin/reviews', icon: Star, label: 'Reviews' },
    { key: 'media', path: '/admin/media', icon: Video, label: 'Media Library' },
    { key: 'analytics', path: '/admin/analytics', icon: BarChart3, label: 'Business Analytics' },
    { key: 'team', path: '/admin/team', icon: Users, label: 'Team Management' },
    { key: 'settings', path: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen bg-erp-bg text-erp-text overflow-hidden font-inter">
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#111111]/40 z-[60] lg:hidden backdrop-blur-sm" 
            onClick={() => setSidebarOpen(false)} 
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        animate={{ width: collapsed ? 80 : 280 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
        className={`fixed inset-y-0 left-0 bg-white border-r border-erp-border flex flex-col shrink-0 z-[70] lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform lg:transition-none`}
      >
        {/* Floating Sidebar Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-[14px] top-[32px] w-[28px] h-[28px] bg-white border border-erp-border rounded-full shadow-sm flex items-center justify-center text-erp-muted hover:text-erp-text hover:bg-gray-50 hover:scale-110 transition-all hidden lg:flex z-50 cursor-pointer"
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>

        {/* Logo Section */}
        <div className="flex flex-col items-center justify-center pt-[32px] pb-[24px] border-b border-erp-border relative min-h-[120px] transition-all">
          <div className="w-[48px] h-[48px] bg-erp-primary rounded-[12px] flex items-center justify-center text-white font-manrope font-[800] text-[20px] shadow-sm mb-[12px] shrink-0">
            SI
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
              <h1 className="font-manrope text-[18px] font-[800] text-erp-text tracking-tight leading-none">Shawarma Inn</h1>
              <p className="font-inter text-[11px] font-[700] text-erp-muted uppercase tracking-widest mt-[4px]">Operating System</p>
            </motion.div>
          )}
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 py-[24px] px-[16px] space-y-[4px] overflow-y-auto">
          {NAV_ITEMS.map(({ key, path, icon: Icon, label }) => {
            const isActive = path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(path);
            return (
              <button
                key={key}
                onClick={() => navigate(path)}
                title={collapsed ? label : undefined}
                className="w-full relative group"
              >
                {isActive && (
                  <motion.div layoutId="sidebar-active" className="absolute inset-0 bg-erp-primary rounded-[12px] shadow-sm" transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />
                )}
                <div className={`relative flex items-center gap-[16px] px-[16px] py-[12px] rounded-[12px] text-[15px] transition-all duration-200 font-inter font-[600] ${collapsed ? 'justify-center' : ''} ${
                  isActive ? 'text-white' : 'text-erp-muted group-hover:bg-erp-bg group-hover:text-erp-text'
                }`}>
                  <motion.div whileHover={{ scale: isActive ? 1 : 1.1 }} className="shrink-0 flex items-center justify-center">
                    <Icon size={22} />
                  </motion.div>
                  {!collapsed && <span className="truncate">{label}</span>}
                </div>
              </button>
            );
          })}
        </nav>
        
        {/* Profile Section */}
        <div className="p-[16px] border-t border-erp-border bg-erp-bg/50">
          {!collapsed && user && (
            <div className="flex items-center gap-[12px] px-[8px] mb-[16px]">
              <div className="w-[40px] h-[40px] rounded-full bg-white border border-erp-border flex items-center justify-center shrink-0 shadow-sm">
                <UserCircle size={22} className="text-erp-muted" />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-[700] font-inter text-erp-text truncate">{(user as any).name || 'Admin User'}</p>
                <p className="text-[12px] font-[500] font-inter text-erp-muted truncate">{(user as any).email || ''}</p>
              </div>
            </div>
          )}
          <button
            onClick={() => { logout(); navigate('/admin/login'); }}
            title={collapsed ? 'Logout' : undefined}
            className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-[12px] px-[16px] py-[12px] rounded-[12px] font-inter text-[14px] font-[700] text-erp-danger hover:bg-erp-danger/10 transition-colors group`}
          >
            <motion.div whileHover={{ scale: 1.1 }}><LogOut size={20} className="shrink-0" /></motion.div>
            {!collapsed && 'Sign Out'}
          </button>
        </div>
      </motion.aside>

      <div className="flex-1 flex flex-col min-w-0 h-screen">
        {/* Top Toolbar */}
        <header className="h-[64px] flex items-center justify-between px-[32px] bg-white border-b border-erp-border shrink-0 z-50">
          <div className="flex items-center gap-[12px] lg:hidden">
            <button onClick={() => setSidebarOpen(true)} className="p-[8px] -ml-[8px] text-erp-muted hover:text-erp-text">
              <svg className="w-[24px] h-[24px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          
          <div className="hidden lg:flex items-center gap-[16px]">
            <div className="flex items-center gap-[8px] px-[12px] py-[6px] bg-erp-success/10 text-erp-success rounded-full">
              <Store size={14} />
              <span className="text-[12px] font-[700] uppercase tracking-[1px]">Accepting Orders</span>
            </div>
          </div>
          
          <div className="flex items-center gap-[24px]">
            <div className="relative">
              <button
                onClick={() => setShowNotifications((v) => !v)}
                className={`relative p-[8px] rounded-full transition-colors ${unacknowledgedAlerts.length > 0 ? 'bg-erp-danger/10 text-erp-danger' : 'text-erp-muted hover:bg-erp-bg hover:text-erp-text'}`}
              >
                <Bell size={20} className={unacknowledgedAlerts.length > 0 ? 'animate-pulse' : ''} />
                {unacknowledgedAlerts.length > 0 && (
                  <span className="absolute top-[2px] right-[2px] w-[8px] h-[8px] bg-erp-danger rounded-full border-[2px] border-white" />
                )}
              </button>
              
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="absolute top-[calc(100%+12px)] right-0 w-[360px] bg-white border border-erp-border rounded-erp shadow-erp overflow-hidden z-50"
                  >
                    <div className="px-[24px] py-[16px] border-b border-erp-border bg-erp-bg flex justify-between items-center">
                      <span className="text-[12px] font-[700] uppercase tracking-[1px] text-erp-muted">Live Alerts</span>
                      <span className="text-[11px] font-[700] bg-white px-2 py-0.5 rounded-full border border-erp-border">{unacknowledgedAlerts.length}</span>
                    </div>
                    <div className="max-h-[320px] overflow-y-auto">
                      {unacknowledgedAlerts.length === 0 ? (
                        <div className="p-[32px] flex flex-col items-center justify-center text-center">
                          <Bell size={32} className="text-gray-200 mb-[16px]" />
                          <p className="text-erp-muted text-[14px] font-[500]">System operational.</p>
                        </div>
                      ) : unacknowledgedAlerts.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => acknowledgeAlert(n.id)}
                          className="p-[16px] border-b border-erp-border cursor-pointer hover:bg-erp-bg transition-colors"
                        >
                          <div className="flex items-start gap-[12px]">
                            <div className="mt-[6px] shrink-0 w-[8px] h-[8px] rounded-full bg-erp-danger animate-pulse" />
                            <div className="flex-1">
                              <p className="text-[14px] text-erp-text font-[600]">New Order: {n.customer_name || 'Guest'}</p>
                              <p className="text-[12px] text-erp-muted mt-[4px] capitalize">{n.status}</p>
                              <button className="text-[12px] font-[700] text-erp-primary mt-[8px] uppercase tracking-[1px]">Acknowledge</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto relative bg-erp-bg">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
