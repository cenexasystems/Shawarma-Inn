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
    <div className="space-y-6 animate-in fade-in duration-500 relative z-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-manrope font-[800] text-[46px] leading-[1.05] tracking-[-0.03em]">Notifications</h2>
          <p className="text-white/50 text-sm mt-1">System alerts, new orders, and administrative messages.</p>
        </div>
        {notifications.some(n => !n.is_read) && (
          <button 
            onClick={markAllAsRead}
            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[2px] transition-colors flex items-center gap-2"
          >
            <CheckCircle size={14} /> Mark All Read
          </button>
        )}
      </header>

      {error && <div className="text-red-400 bg-red-400/10 p-4 rounded-xl text-sm border border-red-400/20">{error}</div>}

      {loading && notifications.length === 0 ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-[#181818] border border-white/5 rounded-2xl p-6 animate-pulse flex gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/4 bg-white/10 rounded" />
                <div className="h-3 w-1/2 bg-white/10 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-[#181818] border border-white/5 rounded-2xl p-16 text-center shadow-xl">
          <Bell size={40} className="mx-auto mb-4 text-white/20" />
          <p className="text-white/40 text-sm uppercase tracking-[2px] font-bold">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif: any) => (
            <div 
              key={notif.id} 
              className={`bg-[#181818] border rounded-2xl p-6 transition-all flex items-start gap-5 relative overflow-hidden group ${notif.is_read ? 'border-white/5 opacity-70 grayscale' : 'border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.05)]'}`}
            >
              {!notif.is_read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ef8f2f]" />}
              
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border ${notif.type === 'order' ? 'bg-[#ef8f2f]/10 text-[#ef8f2f] border-[#ef8f2f]/20' : notif.type === 'system' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                <Bell size={20} />
              </div>
              
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-white text-base">{notif.title}</h4>
                  <span className="text-[10px] text-white/40 uppercase tracking-[1px]">{new Date(notif.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm text-white/70 mb-3">{notif.message}</p>
                
                {!notif.is_read && (
                  <button onClick={() => markAsRead(notif.id)} className="text-[10px] font-bold uppercase tracking-[2px] text-[#ef8f2f] hover:text-white transition-colors">
                    Mark as Read
                  </button>
                )}
              </div>

              <button 
                onClick={() => deleteNotification(notif.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
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
