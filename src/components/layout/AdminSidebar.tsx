import {
  BarChart2,
  ClipboardList,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  UtensilsCrossed,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: 'POS', to: '/pos', icon: ShoppingCart },
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
  { label: 'Analytics', to: '/admin/analytics', icon: BarChart2 },
  { label: 'Menu', to: '/admin/menu', icon: UtensilsCrossed },
  { label: 'Orders', to: '/admin/orders', icon: ClipboardList },
  { label: 'Inventory', to: '/admin/inventory', icon: Package },
  { label: 'Staff', to: '/admin/staff', icon: Users },
  { label: 'Settings', to: '/admin/settings', icon: Settings },
];

export default function AdminSidebar({
  collapsed,
  onToggle,
  userLabel,
  roleLabel,
  onLogout,
}: {
  collapsed: boolean;
  onToggle: () => void;
  userLabel: string;
  roleLabel: string;
  onLogout: () => void;
}) {
  const location = useLocation();

  return (
    <aside
      className={`sticky top-0 h-screen border-r border-white/10 bg-[#121212] transition-all duration-300 ${collapsed ? 'w-[60px]' : 'w-[220px]'}`}
    >
      <div className="h-full flex flex-col">
        <div className="px-3 py-4 border-b border-white/10">
          {collapsed ? (
            <div className="h-10 flex items-center justify-center text-xl">🔥</div>
          ) : (
            <>
              <p className="font-bebas text-3xl tracking-[2px] text-[#f97316] leading-none">SHAWARMA INN</p>
              <p className="text-[11px] uppercase tracking-[1.5px] text-white/50 mt-1">POS System</p>
            </>
          )}
        </div>

        <nav className="flex-1 px-2 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.to ||
              (item.to !== '/admin' && location.pathname.startsWith(item.to));

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`group flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-all ${
                  isActive
                    ? 'border-l-2 border-[#f97316] bg-[#f97316]/10 text-[#f97316]'
                    : 'text-white/70 hover:bg-[#f97316]/10 hover:text-white'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t border-white/10 space-y-2">
          {!collapsed && (
            <div className="px-2 py-1 rounded-lg bg-black/30 border border-white/10">
              <p className="text-xs font-semibold truncate">{userLabel}</p>
              <p className="text-[11px] uppercase text-white/50 tracking-wide">{roleLabel}</p>
            </div>
          )}

          <button
            onClick={onLogout}
            className="w-full rounded-lg border border-white/15 px-2 py-2 text-xs uppercase tracking-wide text-white/75 hover:text-white hover:border-white/30"
            title={collapsed ? 'Logout' : undefined}
          >
            {collapsed ? '↪' : 'Logout'}
          </button>

          <button
            onClick={onToggle}
            className="w-full rounded-lg bg-[#1d1d1d] border border-white/10 px-2 py-2 text-xs text-white/70 hover:text-white"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="inline-flex items-center justify-center gap-1">
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              {!collapsed && 'Collapse'}
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
