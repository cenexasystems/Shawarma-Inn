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
 .from('activity_log')
 .select(`
 id, event_type, entity_type, entity_id, payload, created_at,
 profiles(name)
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
 <h2 className="font-manrope font-[800] text-[46px] leading-[1.05] tracking-[-0.03em] text-gray-900">Activity Log</h2>
 <p className="text-gray-500 text-sm mt-1">Audit trail of admin actions and system events (latest 100).</p>
 </header>

 {error && <div className="text-red-400 bg-red-400/10 p-4 rounded-xl text-sm border border-red-400/20">{error}</div>}

 {loading && activityLog.length === 0 ? (
 <div className="space-y-3">
 {[...Array(8)].map((_, i) => (
 <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 animate-pulse flex gap-4 shadow-sm">
 <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
 <div className="flex-1 space-y-2">
 <div className="h-3 w-48 bg-gray-200 rounded" />
 <div className="h-2 w-32 bg-gray-200 rounded" />
 </div>
 </div>
 ))}
 </div>
 ) : activityLog.length === 0 ? (
 <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center shadow-sm">
 <Activity size={40} className="mx-auto mb-4 text-gray-400" />
 <p className="text-gray-500 text-sm uppercase tracking-[2px] font-bold">No activity logged yet.</p>
 </div>
 ) : (
 <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
 <table className="w-full text-sm min-w-[800px] border-collapse">
 <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-[2px] border-b border-gray-200">
 <tr>
 <th className="p-5 text-left font-bold">Timestamp</th>
 <th className="p-5 text-left font-bold">Admin</th>
 <th className="p-5 text-left font-bold">Action</th>
 <th className="p-5 text-left font-bold">Entity</th>
 <th className="p-5 text-left font-bold">Details</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {activityLog.map((log: any, i: number) => (
 <tr key={log.id ?? i} className="hover:bg-gray-50 transition-colors align-top group">
 <td className="p-5 text-xs text-gray-400 whitespace-nowrap">
 <span className="font-bold text-gray-500">{new Date(log.created_at).toLocaleDateString()}</span>
 <br />
 <span className="text-[10px] uppercase tracking-[1px]">{new Date(log.created_at).toLocaleTimeString()}</span>
 </td>
 <td className="p-5 text-xs text-gray-700">
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 rounded-full bg-[#183025]/10 text-[#183025] flex items-center justify-center font-bebas text-sm border border-[#183025]/20">
 {log.profiles?.name ? log.profiles.name.charAt(0).toUpperCase() : 'S'}
 </div>
 <div>
 <p className="font-bold text-gray-900">{log.profiles?.name || 'System'}</p>
 </div>
 </div>
 </td>
 <td className="p-5">
 <span className="inline-block px-3 py-1 bg-[#183025]/10 text-[#183025] text-[9px] uppercase tracking-[2px] rounded border border-[#183025]/20 font-bold">
 {log.event_type || '—'}
 </span>
 </td>
 <td className="p-5 text-sm text-gray-900">
 <span className="font-bold capitalize">{log.entity_type || '—'}</span>
 {log.entity_id ? <p className="text-gray-400 text-[9px] font-mono mt-1 break-all max-w-[150px]">{log.entity_id}</p> : null}
 </td>
 <td className="p-5 text-xs text-gray-500 max-w-[300px]">
 <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl max-h-[80px] overflow-y-auto custom-scrollbar">
 {typeof log.payload === 'object' ? (
 <pre className="text-[10px] font-mono text-gray-600">{JSON.stringify(log.payload, null, 2)}</pre>
 ) : (
 <span>{log.payload || '—'}</span>
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
