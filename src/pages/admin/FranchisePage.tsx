import { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

export default function FranchisePage() {
  const { token } = useAuth();
  const tokenRequired = token || '';
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [leads, setLeads] = useState<any[]>([]);

  const loadData = async () => {
    if (!tokenRequired) return;
    setLoading(true);
    setError('');
    try {
      const leadRes = await apiRequest<any>('/admin/franchise-leads', { token: tokenRequired });
      setLeads(leadRes.leads || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load franchise leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [tokenRequired]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="font-bebas text-5xl tracking-[3px] uppercase">Franchise Leads</h2>
        <button
          onClick={async () => {
            try {
              const res = await fetch('/api/admin/franchise-leads/export?format=csv', {
                headers: { Authorization: `Bearer ${tokenRequired}` },
              });
              if (!res.ok) { alert('Export failed'); return; }
              const blob = await res.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'franchise-leads.csv';
              a.click();
              window.URL.revokeObjectURL(url);
            } catch (err) {
              alert('Failed to export leads');
            }
          }}
          className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full text-sm font-bold uppercase tracking-wider transition-colors"
        >
          Export CSV
        </button>
      </header>

      {error && <div className="text-red-400 bg-red-400/10 p-4 rounded-xl text-sm border border-red-400/20">{error}</div>}

      <div className="bg-[#181818] border border-white/5 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-black/40 text-white/50 text-[10px] uppercase tracking-[2px]">
            <tr>
              <th className="p-4 text-left font-medium">Date</th>
              <th className="p-4 text-left font-medium">Name</th>
              <th className="p-4 text-left font-medium">Contact</th>
              <th className="p-4 text-left font-medium">City</th>
              <th className="p-4 text-left font-medium">Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading && leads.length === 0 ? (
              [...Array(3)].map((_, i) => (
                <tr key={`skel-${i}`} className="animate-pulse">
                  <td className="p-4"><div className="h-5 w-24 bg-white/10 rounded" /></td>
                  <td className="p-4"><div className="h-5 w-32 bg-white/10 rounded" /></td>
                  <td className="p-4"><div className="h-5 w-28 bg-white/10 rounded mb-1" /><div className="h-4 w-32 bg-white/5 rounded" /></td>
                  <td className="p-4"><div className="h-5 w-24 bg-white/10 rounded" /></td>
                  <td className="p-4"><div className="h-5 w-48 bg-white/10 rounded" /></td>
                </tr>
              ))
            ) : leads.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-white/40">No franchise leads found.</td></tr>
            ) : leads.map(lead => (
              <tr key={lead.id} className="hover:bg-white/5 transition-colors align-top">
                <td className="p-4 text-xs text-white/50 whitespace-nowrap">{new Date(lead.created_at).toLocaleString()}</td>
                <td className="p-4 font-semibold">{lead.name}</td>
                <td className="p-4">
                  <div className="text-white/90">{lead.phone}</div>
                  <div className="text-xs text-white/50">{lead.email}</div>
                </td>
                <td className="p-4 text-white/70">{lead.city || '-'}</td>
                <td className="p-4 text-xs text-white/70 max-w-[300px]">{lead.message || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
