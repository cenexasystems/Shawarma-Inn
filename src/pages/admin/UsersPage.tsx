import { useEffect, useState } from 'react';
import { User, Search, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

interface Profile {
  id: string;
  name: string | null;
  phone: string | null;
  email?: string | null;
  role: string;
  status: string;
  last_login: string | null;
  created_at: string;
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [users, setUsers] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      // In a real app with Supabase, we join with auth.users if possible, or store emails in profiles.
      // Assuming email might not be in profiles initially, but we can list profiles.
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers((data as Profile[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();

    const channel = supabase
      .channel('public:profiles:admin-users')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profiles' },
        (payload) => {
          setUsers((prev) => [payload.new as Profile, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          setUsers((prev) => prev.map((u) => (u.id === payload.new.id ? { ...u, ...(payload.new as Profile) } : u)));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'profiles' },
        (payload) => {
          setUsers((prev) => prev.filter((u) => u.id !== (payload.old as { id: string }).id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleRole = async (userId: string, currentRole: string) => {
    if (userId === currentUser?.id) {
      alert("You cannot change your own role.");
      return;
    }
    
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Are you sure you want to change this user to ${newRole}?`)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId);
        
      if (error) throw error;
      
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update role');
    }
  };

  const toggleStatus = async (userId: string, currentStatus: string) => {
    if (userId === currentUser?.id) {
      alert("You cannot disable your own account.");
      return;
    }
    
    const newStatus = currentStatus === 'disabled' ? 'active' : 'disabled';
    if (!confirm(`Are you sure you want to ${newStatus === 'disabled' ? 'disable' : 'enable'} this user?`)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', userId);
        
      if (error) throw error;
      
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const filteredUsers = users.filter(u => 
    (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.phone || '').includes(searchQuery)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-bebas text-5xl tracking-[2px] uppercase text-gray-900">Admin & Users</h2>
          <p className="text-gray-500 text-sm mt-1">Manage system administrators, roles, and access.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-[#183025] transition-colors placeholder:text-gray-400 shadow-sm"
          />
        </div>
      </header>

      {error && <div className="text-red-400 bg-red-400/10 p-4 rounded-xl text-sm border border-red-400/20">{error}</div>}

      <div className="bg-white border border-gray-200 rounded-2xl overflow-x-auto shadow-sm">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-[2px] border-b border-gray-200">
            <tr>
              <th className="p-4 text-left font-bold">User Details</th>
              <th className="p-4 text-center font-bold">Status</th>
              <th className="p-4 text-center font-bold">Role</th>
              <th className="p-4 text-center font-bold">Joined Date</th>
              <th className="p-4 text-right font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && users.length === 0 ? (
              [...Array(3)].map((_, i) => (
                <tr key={`skel-${i}`} className="animate-pulse">
                  <td className="p-4"><div className="h-5 w-32 bg-gray-200 rounded mb-2" /></td>
                  <td className="p-4"><div className="h-5 w-24 bg-gray-200 rounded mx-auto" /></td>
                  <td className="p-4"><div className="h-5 w-16 bg-gray-200 rounded mx-auto" /></td>
                  <td className="p-4"><div className="h-5 w-24 bg-gray-200 rounded mx-auto" /></td>
                  <td className="p-4"><div className="h-5 w-24 bg-gray-200 rounded ml-auto" /></td>
                </tr>
              ))
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500 font-medium">No users found.</td></tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-gray-900 flex items-center gap-2">
                      {u.name || 'Unknown User'} 
                      {u.id === currentUser?.id && <span className="text-[10px] bg-[#183025]/10 text-[#183025] px-2 py-0.5 rounded-full border border-[#183025]/20 font-bold">You</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 font-medium">{u.phone || 'No phone'}</div>
                    <div className="text-[10px] text-gray-400 font-mono mt-1">{u.id}</div>
                  </td>
                  <td className="p-4 text-center">
                     {(u.status || 'active') === 'active' ? (
                       <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-bold tracking-wider border border-green-200 shadow-sm">
                         <CheckCircle size={12} /> ACTIVE
                       </span>
                     ) : (
                       <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold tracking-wider border border-gray-200 shadow-sm">
                         <XCircle size={12} /> DISABLED
                       </span>
                     )}
                  </td>
                  <td className="p-4 text-center">
                    {u.role === 'admin' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-bold tracking-wider border border-red-200 shadow-sm">
                        <ShieldAlert size={12} /> ADMIN
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold tracking-wider border border-gray-200 shadow-sm">
                        <User size={12} /> USER
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-center text-xs text-gray-500 font-medium">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => toggleStatus(u.id, u.status || 'active')}
                      disabled={u.id === currentUser?.id}
                      className="text-[11px] font-bold tracking-[1px] uppercase px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-gray-700 shadow-sm"
                    >
                      {(u.status || 'active') === 'active' ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => toggleRole(u.id, u.role)}
                      disabled={u.id === currentUser?.id}
                      className={`text-[11px] font-bold tracking-[1px] uppercase px-4 py-2 rounded-lg border transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-sm ${
                        u.role === 'admin' 
                          ? 'border-red-200 text-red-600 hover:bg-red-50' 
                          : 'border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {u.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
