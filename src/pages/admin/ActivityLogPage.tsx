import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

export default function ActivityLogPage() {
  const { token } = useAuth();
  const tokenRequired = token || '';
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [activityLog, setActivityLog] = useState<any[]>([]);

  const loadData = async () => {
    if (!tokenRequired) return;
    setLoading(true);
    setError('');
    try {
      const actRes = await apiRequest<any>('/admin/activity', { token: tokenRequired });
      setActivityLog(actRes.logs || actRes.activity || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activity log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [tokenRequired]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header>
        <h2 className="font-bebas text-5xl tracking-[3px] uppercase">Activity Log</h2>
        <p className="text-sm text-white/50 mt-1">Admin actions and system events, newest first.</p>
      </header>

      {error && <div className="text-red-400 bg-red-400/10 p-4 rounded-xl text-sm border border-red-400/20">{error}</div>}

      {loading && activityLog.length === 0 ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-[#181818] border border-white/5 rounded-xl p-4 animate-pulse flex gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-48 bg-white/10 rounded" />
                <div className="h-2 w-32 bg-white/10 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : activityLog.length === 0 ? (
        <div className="bg-[#181818] border border-white/5 rounded-2xl p-16 text-center">
          <Activity size={40} className="mx-auto mb-3 text-white/20" />
          <p className="text-white/40">No activity logged yet.</p>
        </div>
      ) : (
        <div className="bg-[#181818] border border-white/5 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-black/40 text-white/50 text-[10px] uppercase tracking-[2px]">
              <tr>
                <th className="p-4 text-left font-medium">Timestamp</th>
                <th className="p-4 text-left font-medium">Admin</th>
                <th className="p-4 text-left font-medium">Action</th>
                <th className="p-4 text-left font-medium">Entity</th>
                <th className="p-4 text-left font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {activityLog.map((log: any, i: number) => (
                <tr key={log.id ?? i} className="hover:bg-white/5 transition-colors align-top">
                  <td className="p-4 text-xs text-white/40 whitespace-nowrap">
                    {new Date(log.created_at || log.timestamp).toLocaleString()}
                  </td>
                  <td className="p-4 text-xs text-white/70">{log.admin_email || log.admin_name || 'System'}</td>
                  <td className="p-4">
                    <span className="inline-block px-2 py-0.5 bg-[#ef8f2f]/10 text-[#ef8f2f] text-[10px] uppercase tracking-wider rounded font-semibold">
                      {log.action || '—'}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-white/80">
                    {log.entity_type || '—'}
                    {log.entity_id ? <span className="text-white/40 text-xs ml-1">#{log.entity_id}</span> : null}
                  </td>
                  <td className="p-4 text-xs text-white/40 max-w-[300px] truncate">{log.details || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
