import { useState, type ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';
import AdminSidebar from './AdminSidebar';
import AdminTopBar from './AdminTopBar';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  // Auth guard disabled — will be re-enabled when Supabase admin roles are connected

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex">
      <AdminSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
        userLabel={user?.name || user?.email || 'Admin'}
        roleLabel={user?.role || 'admin'}
        onLogout={logout}
      />
      <div className="flex-1 min-w-0">
        <AdminTopBar />
        <div className="p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
