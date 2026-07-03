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
          <h2 className="font-bebas text-5xl tracking-[3px] uppercase">Admin & Users</h2>
          <p className="text-white/50 text-sm mt-1">Manage system administrators, roles, and access.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f] transition-colors"
          />
        </div>
      </header>

      {error && <div className="text-red-400 bg-red-400/10 p-4 rounded-xl text-sm border border-red-400/20">{error}</div>}

      <div className="bg-[#181818] border border-white/5 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-black/40 text-white/50 text-[10px] uppercase tracking-[2px]">
            <tr>
              <th className="p-4 text-left font-medium">User Details</th>
              <th className="p-4 text-center font-medium">Status</th>
              <th className="p-4 text-center font-medium">Role</th>
              <th className="p-4 text-center font-medium">Joined Date</th>
              <th className="p-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading && users.length === 0 ? (
              [...Array(3)].map((_, i) => (
                <tr key={`skel-${i}`} className="animate-pulse">
                  <td className="p-4"><div className="h-5 w-32 bg-white/10 rounded mb-2" /></td>
                  <td className="p-4"><div className="h-5 w-24 bg-white/10 rounded mx-auto" /></td>
                  <td className="p-4"><div className="h-5 w-16 bg-white/10 rounded mx-auto" /></td>
                  <td className="p-4"><div className="h-5 w-24 bg-white/10 rounded mx-auto" /></td>
                  <td className="p-4"><div className="h-5 w-24 bg-white/10 rounded ml-auto" /></td>
                </tr>
              ))
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-white/40">No users found.</td></tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="font-semibold flex items-center gap-2">
                      {u.name || 'Unknown User'} 
                      {u.id === currentUser?.id && <span className="text-[10px] bg-[#ef8f2f]/20 text-[#ef8f2f] px-2 py-0.5 rounded-full border border-[#ef8f2f]/30">You</span>}
                    </div>
                    <div className="text-xs text-white/50">{u.phone || 'No phone'}</div>
                    <div className="text-[10px] text-white/30 font-mono mt-1">{u.id}</div>
                  </td>
                  <td className="p-4 text-center">
                     {(u.status || 'active') === 'active' ? (
                       <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-xs font-bold tracking-wider">
                         <CheckCircle size={14} /> ACTIVE
                       </span>
                     ) : (
                       <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-500/10 text-gray-400 rounded-full text-xs font-bold tracking-wider">
                         <XCircle size={14} /> DISABLED
                       </span>
                     )}
                  </td>
                  <td className="p-4 text-center">
                    {u.role === 'admin' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-xs font-bold tracking-wider">
                        <ShieldAlert size={14} /> ADMIN
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 text-white/60 rounded-full text-xs font-bold tracking-wider">
                        <User size={14} /> USER
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-center text-xs text-white/60">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => toggleStatus(u.id, u.status || 'active')}
                      disabled={u.id === currentUser?.id}
                      className="text-[11px] font-bold tracking-[1px] uppercase px-4 py-2 rounded-lg border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-white/70"
                    >
                      {(u.status || 'active') === 'active' ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => toggleRole(u.id, u.role)}
                      disabled={u.id === currentUser?.id}
                      className={`text-[11px] font-bold tracking-[1px] uppercase px-4 py-2 rounded-lg border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                        u.role === 'admin' 
                          ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' 
                          : 'border-white/10 text-white hover:bg-white/10'
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
