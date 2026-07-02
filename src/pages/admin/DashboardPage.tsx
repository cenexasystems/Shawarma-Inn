import { useEffect, useState } from 'react';
import {
  Package,
  Users,
  Tag,
  Star,
  TrendingUp,
  IndianRupee,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  AlertCircle,
  Download
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

const COLORS = ['#ef8f2f', '#dc2626', '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    case 'accepted': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    case 'processing': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    case 'preparing': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
    case 'ready': return 'text-[#ef8f2f] bg-[#ef8f2f]/10 border-[#ef8f2f]/20';
    case 'in_transit': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
    case 'completed': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    case 'cancelled': return 'text-[var(--red)] bg-[var(--red)]/10 border-[var(--red)]/20';
    default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
  }
};

const StatCard = ({ title, value, icon: Icon, trend, colorClass }: any) => (
  <div className="group bg-[#181818] border border-white/5 rounded-2xl p-6 flex items-center justify-between transition-all duration-300 hover:border-white/20 hover:bg-[#1c1c1c] hover:-translate-y-1 shadow-lg hover:shadow-2xl">
    <div>
      <p className="text-[11px] uppercase tracking-[2px] text-white/50 group-hover:text-white/70 transition-colors">{title}</p>
      <h3 className="font-bebas text-5xl mt-2 tracking-wide group-hover:scale-[1.02] transition-transform origin-left">{value}</h3>
      {trend && <p className="text-xs text-green-400 mt-2">{trend}</p>}
    </div>
    <div className={`p-4 rounded-xl bg-black/40 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-inner ${colorClass}`}>
      <Icon size={24} />
    </div>
  </div>
);

export default function DashboardPage() {
  const { token } = useAuth();
  const tokenRequired = token || '';
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  const loadData = async () => {
    if (!tokenRequired) return;
    setLoading(true);
    setError('');
    try {
      const [sumRes, anRes] = await Promise.all([
        apiRequest<any>('/admin/dashboard/summary', { token: tokenRequired }),
        apiRequest<any>('/admin/analytics', { token: tokenRequired }),
      ]);
      setSummary(sumRes);
      setAnalytics(anRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    const interval = setInterval(() => { void loadData(); }, 30000);
    return () => clearInterval(interval);
  }, [tokenRequired]);

  const categoryData = analytics?.categoryDistribution || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex items-start justify-between">
        <div>
          <h2 className="font-bebas text-5xl tracking-[3px] uppercase">Business Overview</h2>
          <p className="text-sm text-white/50 mt-1">Real-time metrics calculated securely from completed orders.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          {loading && <div className="text-xs text-white/30 animate-pulse">Refreshing…</div>}
          <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/admin/reports/export?type=orders&format=csv', {
                      headers: { Authorization: `Bearer ${tokenRequired}` }
                    });
                    if (!res.ok) throw new Error('Export failed');
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `orders-export-${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                  } catch (err) {
                    alert('Failed to export orders');
                  }
                }}
                className="px-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-[2px] text-white/70 hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
              >
                <Download size={14} /> Export Orders
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/admin/reports/export?type=revenue&format=csv', {
                      headers: { Authorization: `Bearer ${tokenRequired}` }
                    });
                    if (!res.ok) throw new Error('Export failed');
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `revenue-export-${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                  } catch (err) {
                    alert('Failed to export revenue');
                  }
                }}
                className="px-4 py-2 bg-[var(--red)]/10 border border-[var(--red)]/20 rounded-xl text-xs font-bold uppercase tracking-[2px] text-[var(--red)] hover:bg-[var(--red)]/20 transition-all flex items-center gap-2"
              >
                <Download size={14} /> Export Revenue
              </button>
        </div>
      </header>

      {error && <div className="text-red-400 bg-red-400/10 p-4 rounded-xl text-sm border border-red-400/20">{error}</div>}

      {/* Live Operations Status Strip */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Pending', value: summary.cards.pendingOrders, color: 'border-red-500/40 bg-red-500/10 hover:bg-red-500/20', dot: 'bg-red-500', icon: AlertCircle },
            { label: 'Processing', value: summary.cards.processingOrders, color: 'border-yellow-500/40 bg-yellow-500/10 hover:bg-yellow-500/20', dot: 'bg-yellow-400', icon: Clock },
            { label: 'In Transit', value: summary.cards.inTransitOrders, color: 'border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20', dot: 'bg-purple-400', icon: Truck },
            { label: 'Completed Today', value: summary.cards.completedToday, color: 'border-green-500/40 bg-green-500/10 hover:bg-green-500/20', dot: 'bg-green-400', icon: CheckCircle },
            { label: 'Cancelled Today', value: summary.cards.cancelledToday, color: 'border-gray-500/30 bg-gray-500/10 hover:bg-gray-500/20', dot: 'bg-gray-400', icon: XCircle },
          ].map(({ label, value, color, dot }) => (
            <div key={label} className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 cursor-default ${color}`}>
              <span className={`w-3 h-3 rounded-full flex-shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.5)] ${dot} ${label === 'Pending' && value > 0 ? 'animate-ping shadow-red-500' : ''}`} />
              <div>
                <p className="text-[10px] uppercase tracking-[1.5px] text-white/60 font-medium">{label}</p>
                <p className="font-bebas text-4xl leading-none mt-1 text-white shadow-black drop-shadow-md">{value ?? 0}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading skeleton */}
      {!summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#181818] border border-white/5 rounded-2xl p-6 animate-pulse">
              <div className="h-3 w-24 bg-white/10 rounded mb-3" />
              <div className="h-10 w-16 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      )}

      {summary && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Today's Revenue" value={`₹${summary.cards.todaysRevenue.toLocaleString()}`} icon={IndianRupee} colorClass="text-green-400" />
            <StatCard title="Today's Orders" value={summary.cards.todaysOrders} icon={Package} colorClass="text-[#ef8f2f]" />
            <StatCard title="Avg Order Value" value={`₹${summary.cards.avgOrderValue?.toLocaleString() ?? 0}`} icon={TrendingUp} colorClass="text-blue-400" />
            <StatCard title="Monthly Revenue" value={`₹${summary.cards.monthlyRevenue.toLocaleString()}`} icon={IndianRupee} colorClass="text-purple-400" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="New / Returning" value={`${summary.cards.newCustomersToday} / ${summary.cards.returningCustomers}`} icon={Users} colorClass="text-pink-400" />
            <StatCard title="Peak Hour" value={summary.cards.peakOrderingTime} icon={Clock} colorClass="text-yellow-400" />
            <StatCard title="Best Seller (Mo)" value={summary.cards.bestSellingProduct} icon={Star} colorClass="text-orange-400" />
            <StatCard title="Coupons / Leads" value={`${summary.cards.couponUsageToday} / ${summary.cards.franchiseEnquiries}`} icon={Tag} colorClass="text-indigo-400" />
          </div>
        </>
      )}

      {analytics && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#181818] border border-white/5 rounded-2xl p-6">
          <h3 className="text-[11px] uppercase tracking-[2px] text-white/50 mb-6">Revenue Trend (30 Days)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="day" stroke="#ffffff50" tick={{ fontSize: 12 }} />
                <YAxis stroke="#ffffff50" tick={{ fontSize: 12 }} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#101010', borderColor: '#ffffff20', color: '#fff' }} />
                <Line type="monotone" dataKey="revenue" stroke="#ef8f2f" strokeWidth={3} dot={{ r: 4, fill: '#101010', stroke: '#ef8f2f', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-[#181818] border border-white/5 rounded-2xl p-6">
          <h3 className="text-[11px] uppercase tracking-[2px] text-white/50 mb-6">Revenue by Category</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                  {categoryData.map((_: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: '#101010', borderColor: '#ffffff20', color: '#fff' }} formatter={(val: any) => `₹${Number(val).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {categoryData.slice(0, 5).map((entry: any, index: number) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs text-white/70">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                {entry.name}
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      {analytics && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#181818] border border-white/5 rounded-2xl p-6 overflow-hidden">
          <h3 className="text-[11px] uppercase tracking-[2px] text-white/50 mb-4">Top Selling Products</h3>
          {analytics.topProducts?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-white/20">
              <TrendingUp size={32} className="mb-2 opacity-30" />
              <p className="text-sm">No sales data yet</p>
            </div>
          ) : (
          <div className="space-y-4">
            {analytics.topProducts?.slice(0, 5).map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between group p-3 hover:bg-white/5 rounded-xl transition-colors">
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xs text-white/40">{p.qty} sold</p>
                </div>
                <p className="text-[#ef8f2f] font-bebas text-xl">₹{p.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>
          )}
        </div>
        <div className="bg-[#181818] border border-white/5 rounded-2xl p-6 overflow-hidden">
          <h3 className="text-[11px] uppercase tracking-[2px] text-white/50 mb-4">Recent Orders</h3>
          {(!summary?.recentOrders?.length) ? (
            <div className="flex flex-col items-center justify-center h-32 text-white/20">
              <Package size={32} className="mb-2 opacity-30" />
              <p className="text-sm">No orders yet</p>
            </div>
          ) : (
          <div className="space-y-4">
            {summary?.recentOrders?.slice(0, 5).map((o: any) => (
              <div key={o.id} className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                <div>
                  <p className="font-semibold text-sm">#{o.order_number} - {o.customer_name || 'Guest'}</p>
                  <p className="text-xs text-white/40 mt-1">{new Date(o.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bebas text-xl text-[#ef8f2f]">₹{o.total.toLocaleString()}</p>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${getStatusColor(o.status)}`}>
                    {o.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
