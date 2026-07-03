import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

export default function ActivityLogPage() {
  const { isAdmin } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [activityLog, setActivityLog] = useState<any[]>([]);

  const loadData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select(`
          id, action, entity, entity_id, details, created_at,
          profiles(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);
        
      if (error) throw error;
      setActivityLog(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activity log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [isAdmin]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative z-10">
      <header>
        <h2 className="font-bebas text-5xl tracking-[3px] uppercase">Activity Log</h2>
        <p className="text-white/50 text-sm mt-1">Audit trail of admin actions and system events (latest 100).</p>
      </header>

      {error && <div className="text-red-400 bg-red-400/10 p-4 rounded-xl text-sm border border-red-400/20">{error}</div>}

      {loading && activityLog.length === 0 ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-[#181818] border border-white/5 rounded-2xl p-4 animate-pulse flex gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-48 bg-white/10 rounded" />
                <div className="h-2 w-32 bg-white/10 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : activityLog.length === 0 ? (
        <div className="bg-[#181818] border border-white/5 rounded-2xl p-16 text-center shadow-xl">
          <Activity size={40} className="mx-auto mb-4 text-white/20" />
          <p className="text-white/40 text-sm uppercase tracking-[2px] font-bold">No activity logged yet.</p>
        </div>
      ) : (
        <div className="bg-[#181818] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-sm min-w-[800px] border-collapse">
            <thead className="bg-black/40 text-white/50 text-[10px] uppercase tracking-[2px]">
              <tr>
                <th className="p-5 text-left font-medium">Timestamp</th>
                <th className="p-5 text-left font-medium">Admin</th>
                <th className="p-5 text-left font-medium">Action</th>
                <th className="p-5 text-left font-medium">Entity</th>
                <th className="p-5 text-left font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {activityLog.map((log: any, i: number) => (
                <tr key={log.id ?? i} className="hover:bg-white/[0.03] transition-colors align-top group">
                  <td className="p-5 text-xs text-white/40 whitespace-nowrap">
                    <span className="font-bold text-white/60">{new Date(log.created_at).toLocaleDateString()}</span>
                    <br />
                    <span className="text-[10px] uppercase tracking-[1px]">{new Date(log.created_at).toLocaleTimeString()}</span>
                  </td>
                  <td className="p-5 text-xs text-white/70">
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-[#ef8f2f]/10 text-[#ef8f2f] flex items-center justify-center font-bebas text-sm border border-[#ef8f2f]/20">
                         {log.profiles?.full_name ? log.profiles.full_name.charAt(0).toUpperCase() : 'S'}
                       </div>
                       <div>
                         <p className="font-bold text-white">{log.profiles?.full_name || 'System'}</p>
                         <p className="text-[9px] uppercase tracking-[1px] text-white/40">{log.profiles?.email || 'Auto'}</p>
                       </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className="inline-block px-3 py-1 bg-[#ef8f2f]/10 text-[#ef8f2f] text-[9px] uppercase tracking-[2px] rounded border border-[#ef8f2f]/20 font-bold">
                      {log.action || '—'}
                    </span>
                  </td>
                  <td className="p-5 text-sm text-white/80">
                    <span className="font-bold capitalize">{log.entity || '—'}</span>
                    {log.entity_id ? <p className="text-white/30 text-[9px] font-mono mt-1 break-all max-w-[150px]">{log.entity_id}</p> : null}
                  </td>
                  <td className="p-5 text-xs text-white/50 max-w-[300px]">
                    <div className="bg-black/40 border border-white/5 p-3 rounded-xl max-h-[80px] overflow-y-auto custom-scrollbar">
                       {typeof log.details === 'object' ? (
                          <pre className="text-[10px] font-mono text-white/60">{JSON.stringify(log.details, null, 2)}</pre>
                       ) : (
                          <span>{log.details || '—'}</span>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
