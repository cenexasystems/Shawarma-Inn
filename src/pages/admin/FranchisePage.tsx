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
        <h2 className="font-bebas text-5xl tracking-[2px] uppercase text-gray-900">Franchise Leads</h2>
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
          className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-colors shadow-sm"
        >
          Export CSV
        </button>
      </header>

      {error && <div className="text-red-400 bg-red-400/10 p-4 rounded-xl text-sm border border-red-400/20">{error}</div>}

      <div className="bg-white border border-gray-200 rounded-2xl overflow-x-auto shadow-sm">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-[2px] border-b border-gray-200">
            <tr>
              <th className="p-4 text-left font-bold">Date</th>
              <th className="p-4 text-left font-bold">Name</th>
              <th className="p-4 text-left font-bold">Contact</th>
              <th className="p-4 text-left font-bold">City</th>
              <th className="p-4 text-left font-bold">Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && leads.length === 0 ? (
              [...Array(3)].map((_, i) => (
                <tr key={`skel-${i}`} className="animate-pulse">
                  <td className="p-4"><div className="h-5 w-24 bg-gray-200 rounded" /></td>
                  <td className="p-4"><div className="h-5 w-32 bg-gray-200 rounded" /></td>
                  <td className="p-4"><div className="h-5 w-28 bg-gray-200 rounded mb-1" /><div className="h-4 w-32 bg-gray-100 rounded" /></td>
                  <td className="p-4"><div className="h-5 w-24 bg-gray-200 rounded" /></td>
                  <td className="p-4"><div className="h-5 w-48 bg-gray-200 rounded" /></td>
                </tr>
              ))
            ) : leads.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500 font-medium">No franchise leads found.</td></tr>
            ) : leads.map(lead => (
              <tr key={lead.id} className="hover:bg-gray-50 transition-colors align-top">
                <td className="p-4 text-xs text-gray-500 whitespace-nowrap font-medium">{new Date(lead.created_at).toLocaleString()}</td>
                <td className="p-4 font-bold text-gray-900">{lead.name}</td>
                <td className="p-4">
                  <div className="text-gray-900 font-medium">{lead.phone}</div>
                  <div className="text-xs text-gray-500">{lead.email}</div>
                </td>
                <td className="p-4 text-gray-700 font-medium">{lead.city || '-'}</td>
                <td className="p-4 text-xs text-gray-600 max-w-[300px]">{lead.message || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
