import { useEffect, useState } from 'react';
import { User, Search, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';

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
 <div className="min-h-screen bg-erp-bg px-4 py-5 font-inter sm:px-6 sm:py-6 lg:p-8">
 <PageHeader 
 title="Admin & Users"
 subtitle="Manage system administrators, roles, and access."
 />

 {error && <div className="text-erp-danger bg-erp-danger/10 p-4 rounded-[12px] text-sm border border-erp-danger/20 mb-6">{error}</div>}

 <Card className="mb-6 p-4 sm:mb-8">
 <div className="relative w-full md:w-96">
 <Input
 icon={Search}
 placeholder="Search users..."
 value={searchQuery}
 onChange={e => setSearchQuery(e.target.value)}
 />
 </div>
 </Card>

 <Card noPadding className="overflow-hidden">
 <div className="grid gap-3 p-4 md:hidden">
 {loading && users.length === 0 ? (
 [...Array(3)].map((_, i) => (
 <div key={i} className="h-[172px] animate-pulse rounded-[20px] border border-erp-border bg-gray-50/50" />
 ))
 ) : filteredUsers.length === 0 ? (
 <div className="rounded-[20px] border border-dashed border-erp-border bg-white p-6 text-center text-erp-muted">
 No users found.
 </div>
 ) : (
 filteredUsers.map((u) => (
 <article key={u.id} className="rounded-[20px] border border-erp-border bg-white p-4 shadow-sm">
 <div className="min-w-0">
 <div className="flex flex-wrap items-center gap-2">
 <h3 className="truncate text-[15px] font-[700] text-erp-text">{u.name || 'Unknown User'}</h3>
 {u.id === currentUser?.id && <span className="rounded-full border border-erp-primary/20 bg-erp-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[1px] text-erp-primary">You</span>}
 </div>
 <p className="mt-1 text-[12px] text-erp-muted">{u.phone || 'No phone'}</p>
 <p className="mt-1 text-[12px] text-erp-muted">{u.email || 'No email'}</p>
 </div>
 <div className="mt-4 flex flex-wrap gap-2">
 {(u.status || 'active') === 'active' ? (
 <span className="inline-flex items-center gap-1.5 rounded-full border border-erp-success/20 bg-erp-success/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[1px] text-erp-success">
 <CheckCircle size={12} /> ACTIVE
 </span>
 ) : (
 <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[1px] text-erp-muted">
 <XCircle size={12} /> DISABLED
 </span>
 )}
 {u.role === 'admin' ? (
 <span className="inline-flex items-center gap-1.5 rounded-full border border-erp-danger/20 bg-erp-danger/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[1px] text-erp-danger">
 <ShieldAlert size={12} /> ADMIN
 </span>
 ) : (
 <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[1px] text-erp-muted">
 <User size={12} /> USER
 </span>
 )}
 </div>
 <p className="mt-3 text-[12px] text-erp-muted">Joined {new Date(u.created_at).toLocaleDateString()}</p>
 <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
 <Button
 variant="outline"
 size="sm"
 onClick={() => toggleStatus(u.id, u.status || 'active')}
 disabled={u.id === currentUser?.id}
 >
 {(u.status || 'active') === 'active' ? 'Disable' : 'Enable'}
 </Button>
 <Button
 variant={u.role === 'admin' ? 'danger' : 'outline'}
 size="sm"
 onClick={() => toggleRole(u.id, u.role)}
 disabled={u.id === currentUser?.id}
 >
 {u.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
 </Button>
 </div>
 </article>
 ))
 )}
 </div>
 <div className="hidden md:block">
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>User Details</TableHead>
 <TableHead className="text-center">Status</TableHead>
 <TableHead className="text-center">Role</TableHead>
 <TableHead className="text-center">Joined Date</TableHead>
 <TableHead className="text-right">Actions</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {loading && users.length === 0 ? (
 [...Array(3)].map((_, i) => (
 <TableRow key={`skel-${i}`} className="animate-pulse">
 <TableCell><div className="h-5 w-32 bg-gray-200 rounded mb-2" /></TableCell>
 <TableCell><div className="h-5 w-24 bg-gray-200 rounded mx-auto" /></TableCell>
 <TableCell><div className="h-5 w-16 bg-gray-200 rounded mx-auto" /></TableCell>
 <TableCell><div className="h-5 w-24 bg-gray-200 rounded mx-auto" /></TableCell>
 <TableCell><div className="h-5 w-24 bg-gray-200 rounded ml-auto" /></TableCell>
 </TableRow>
 ))
 ) : filteredUsers.length === 0 ? (
 <TableRow><TableCell colSpan={5} className="p-16 text-center text-erp-muted font-medium">No users found.</TableCell></TableRow>
 ) : (
 filteredUsers.map((u) => (
 <TableRow key={u.id}>
 <TableCell>
 <div className="font-bold text-erp-text flex items-center gap-2">
 {u.name || 'Unknown User'} 
 {u.id === currentUser?.id && <span className="text-[10px] bg-erp-primary/10 text-erp-primary px-2 py-0.5 rounded-full border border-erp-primary/20 font-bold uppercase tracking-[1px]">You</span>}
 </div>
 <div className="text-xs text-erp-muted mt-0.5 font-medium">{u.phone || 'No phone'}</div>
 </TableCell>
 <TableCell className="text-center">
 {(u.status || 'active') === 'active' ? (
 <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-erp-success/10 text-erp-success rounded-full text-[10px] font-bold tracking-[1px] border border-erp-success/20 uppercase">
 <CheckCircle size={12} /> ACTIVE
 </span>
 ) : (
 <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-erp-muted rounded-full text-[10px] font-bold tracking-[1px] border border-gray-200 uppercase">
 <XCircle size={12} /> DISABLED
 </span>
 )}
 </TableCell>
 <TableCell className="text-center">
 {u.role === 'admin' ? (
 <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-erp-danger/10 text-erp-danger rounded-full text-[10px] font-bold tracking-[1px] border border-erp-danger/20 uppercase">
 <ShieldAlert size={12} /> ADMIN
 </span>
 ) : (
 <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-erp-muted rounded-full text-[10px] font-bold tracking-[1px] border border-gray-200 uppercase">
 <User size={12} /> USER
 </span>
 )}
 </TableCell>
 <TableCell className="text-center text-[13px] text-erp-muted font-medium">
 {new Date(u.created_at).toLocaleDateString()}
 </TableCell>
 <TableCell className="text-right">
 <div className="flex justify-end gap-2">
 <Button
 variant="outline"
 size="sm"
 onClick={() => toggleStatus(u.id, u.status || 'active')}
 disabled={u.id === currentUser?.id}
 >
 {(u.status || 'active') === 'active' ? 'Disable' : 'Enable'}
 </Button>
 <Button
 variant={u.role === 'admin' ? 'danger' : 'outline'}
 size="sm"
 onClick={() => toggleRole(u.id, u.role)}
 disabled={u.id === currentUser?.id}
 >
 {u.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
 </Button>
 </div>
 </TableCell>
 </TableRow>
 ))
 )}
 </TableBody>
 </Table>
 </div>
 </Card>
 </div>
 );
}
