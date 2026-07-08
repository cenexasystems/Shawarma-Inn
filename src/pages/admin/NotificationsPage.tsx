import { useEffect, useState } from 'react';
import { Bell, CheckCircle, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

export default function NotificationsPage() {
 const { isAdmin, user } = useAuth();
 
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState('');
 
 const [notifications, setNotifications] = useState<any[]>([]);

 const loadData = async () => {
 if (!isAdmin || !user) return;
 setLoading(true);
 setError('');
 try {
 const { data, error } = await supabase
 .from('notifications')
 .select('*')
 .or(`target_user_id.eq.${user.id},target_user_id.is.null`)
 .order('created_at', { ascending: false })
 .limit(50);
 
 if (error) throw error;
 setNotifications(data || []);
 } catch (err) {
 setError(err instanceof Error ? err.message : 'Failed to load notifications');
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 void loadData();
 
 if (!isAdmin || !user) return;
 const channel = supabase
 .channel('public:notifications')
 .on(
 'postgres_changes',
 { event: 'INSERT', schema: 'public', table: 'notifications' },
 (payload) => {
 if (!payload.new.target_user_id || payload.new.target_user_id === user.id) {
 setNotifications(prev => [payload.new, ...prev]);
 }
 }
 )
 .subscribe();
 
 return () => {
 supabase.removeChannel(channel);
 };
 }, [isAdmin, user]);

 const markAsRead = async (id: string) => {
 try {
 await supabase.from('notifications').update({ is_read: true }).eq('id', id);
 setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
 } catch (err) {
 console.error(err);
 }
 };

 const markAllAsRead = async () => {
 try {
 await supabase.from('notifications').update({ is_read: true }).in('id', notifications.map(n => n.id));
 setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
 } catch (err) {
 console.error(err);
 }
 };

 const deleteNotification = async (id: string) => {
 try {
 await supabase.from('notifications').delete().eq('id', id);
 setNotifications(prev => prev.filter(n => n.id !== id));
 } catch (err) {
 console.error(err);
 }
 };

 return (
 <div className="space-y-[24px] animate-in fade-in duration-500 relative z-10 p-[32px] ">
 <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <h2 className="font-[700] text-[42px] leading-[1.05] tracking-[-0.03em] text-erp-text">Notifications</h2>
 <p className="text-[#64748B] text-[17px] font-[400] mt-[12px]">System alerts, new orders, and administrative messages.</p>
 </div>
 {notifications.some(n => !n.is_read) && (
 <button 
 onClick={markAllAsRead}
 className="bg-white hover:bg-[#FAFBFC] border border-erp-border text-erp-text px-[16px] h-[42px] rounded-[16px] text-[14px] font-[600] transition-colors flex items-center gap-2 shadow-sm"
 >
 <CheckCircle size={14} /> Mark All Read
 </button>
 )}
 </header>

 {error && <div className="text-red-400 bg-red-400/10 p-4 rounded-xl text-sm border border-red-400/20">{error}</div>}

 {loading && notifications.length === 0 ? (
 <div className="space-y-3">
 {[...Array(5)].map((_, i) => (
 <div key={i} className="bg-white border border-erp-border rounded-[22px] p-[24px] animate-pulse flex gap-[16px]">
 <div className="w-10 h-10 bg-gray-100 rounded-full" />
 <div className="flex-1 space-y-2">
 <div className="h-4 w-1/4 bg-gray-100 rounded" />
 <div className="h-3 w-1/2 bg-gray-100 rounded" />
 </div>
 </div>
 ))}
 </div>
 ) : notifications.length === 0 ? (
 <div className="bg-white border border-erp-border rounded-[24px] p-[64px] text-center shadow-erp">
 <Bell size={40} className="mx-auto mb-4 text-erp-muted/30" />
 <p className="text-erp-muted text-[13px] uppercase tracking-[0.12em] font-[600]">You're all caught up!</p>
 </div>
 ) : (
 <div className="space-y-3">
 {notifications.map((notif: any) => (
 <div 
 key={notif.id} 
 className={`bg-white border rounded-[22px] p-[24px] transition-all flex items-start gap-[20px] relative overflow-hidden group shadow-erp ${notif.is_read ? 'border-erp-border opacity-70 grayscale' : 'border-erp-border'}`}
 >
 {!notif.is_read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-erp-primary" />}
 
 <div className={`w-[42px] h-[42px] rounded-full flex items-center justify-center shrink-0 border ${notif.type === 'order' ? 'bg-erp-warning/10 text-erp-warning border-erp-warning/20' : notif.type === 'system' ? 'bg-erp-danger/10 text-erp-danger border-erp-danger/20' : 'bg-erp-blue/10 text-erp-blue border-erp-blue/20'}`}>
 <Bell size={20} />
 </div>
 
 <div className="flex-1 min-w-0 pt-1">
 <div className="flex items-center justify-between mb-1">
 <h4 className="font-[600] text-erp-text text-[15px]">{notif.title}</h4>
 <span className="text-[12px] text-erp-muted">{new Date(notif.created_at).toLocaleString()}</span>
 </div>
 <p className="text-[14px] text-erp-muted mb-3">{notif.message}</p>
 
 {!notif.is_read && (
 <button onClick={() => markAsRead(notif.id)} className="text-[12px] font-[600] uppercase tracking-[0.08em] text-erp-primary hover:text-erp-text transition-colors">
 Mark as Read
 </button>
 )}
 </div>

 <button 
 onClick={() => deleteNotification(notif.id)}
 className="opacity-0 group-hover:opacity-100 p-2 text-erp-muted hover:text-erp-danger hover:bg-erp-danger/10 rounded-[16px] transition-all"
 >
 <Trash2 size={16} />
 </button>
 </div>
 ))}
 </div>
 )}
 </div>
 );
}
