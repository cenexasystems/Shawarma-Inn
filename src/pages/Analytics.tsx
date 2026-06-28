import { useEffect, useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import { apiRequest } from '../lib/api';

type DateRange = 'today' | '7days' | '30days';

const COLORS = ['#f97316', '#22c55e', '#f59e0b', '#14b8a6', '#a855f7', '#ef4444'];

function getDateRange(range: DateRange): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = fmt(now);

  if (range === 'today') return { dateFrom: today, dateTo: today };

  const past = new Date(now);
  past.setDate(now.getDate() - (range === '7days' ? 6 : 29));
  return { dateFrom: fmt(past), dateTo: today };
}

export default function Analytics() {
  const [dateRange, setDateRange] = useState<DateRange>('7days');
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const { dateFrom, dateTo } = getDateRange(dateRange);
      const qs = `dateFrom=${dateFrom}&dateTo=${dateTo}`;
      const [analyticsRes, summaryRes, fullRes] = await Promise.all([
        apiRequest<any>(`/admin/analytics?${qs}`),
        apiRequest<any>('/admin/dashboard/summary'),
        apiRequest<any>(`/admin/analytics/full?${qs}`).catch(() => null),
      ]);
      // Merge full analytics data into analytics object for richer charts
      setAnalytics({ ...analyticsRes, ...(fullRes || {}) });
      setSummary(summaryRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [dateRange]);

  const kpiData = useMemo(() => {
    if (!analytics) return [];
    const totalRevenue = (analytics.revenueByDay as any[]).reduce((s: number, d: any) => s + Number(d.revenue), 0);
    const totalOrders = (analytics.revenueByDay as any[]).reduce((s: number, d: any) => s + Number(d.orders), 0);
    const avgValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const itemsSold = (analytics.topProducts as any[]).reduce((s: number, p: any) => s + Number(p.qty), 0);
    return [
      { label: 'Total Revenue', value: totalRevenue, format: 'currency', icon: '💰', color: '#f97316' },
      { label: 'Total Orders', value: totalOrders, format: 'number', icon: '📦', color: '#22c55e' },
      { label: 'Avg Order Value', value: avgValue, format: 'currency', icon: '📊', color: '#f59e0b' },
      { label: 'Items Sold', value: itemsSold, format: 'number', icon: '🛍️', color: '#14b8a6' },
    ];
  }, [analytics]);

  const orderTypeData = useMemo(() => {
    if (!analytics?.ordersByType) return [];
    return (analytics.ordersByType as any[]).map((row: any) => ({
      name: row.delivery_type === 'home_delivery' ? 'Home Delivery' : 'Store Pickup',
      value: Number(row.orders),
    }));
  }, [analytics]);

  const hourlyData = useMemo(() => {
    if (!analytics?.ordersByHour) return [];
    return (analytics.ordersByHour as any[]).map((row: any) => ({
      hour: `${String(row.hour).padStart(2, '0')}:00`,
      orders: Number(row.orders),
      revenue: Number(row.revenue),
    }));
  }, [analytics]);

  const exportCSV = () => {
    if (!analytics?.revenueByDay?.length) { alert('No data to export'); return; }
    const headers = ['Date', 'Revenue', 'Orders'];
    const rows = (analytics.revenueByDay as any[]).map((d: any) => [d.day, d.revenue, d.orders]);
    const csv = [headers, ...rows].map(row => row.map((c: any) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `analytics-${dateRange}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-bebas text-6xl tracking-[3px] uppercase text-[#f97316]">Analytics</h1>
            <p className="text-white/60 text-sm mt-2">Live database dashboard — completed orders only</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['today', '7days', '30days'] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                  dateRange === range ? 'bg-[#f97316] text-black' : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {range === 'today' ? 'Today' : range === '7days' ? '7 Days' : '30 Days'}
              </button>
            ))}
            <button
              onClick={exportCSV}
              className="px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider bg-white/10 text-white/70 hover:bg-white/20 transition-all"
            >
              📥 Export CSV
            </button>
            <button
              onClick={() => { void loadData(); }}
              disabled={loading}
              className="px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider bg-white/10 text-white/70 hover:bg-white/20 transition-all disabled:opacity-40"
            >
              {loading ? '...' : '↻ Refresh'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl mb-6">{error}</div>
        )}

        {loading && !analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />)}
          </div>
        )}

        {/* KPI Cards */}
        {kpiData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {kpiData.map((kpi, idx) => (
              <div key={idx} className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <span style={{ fontSize: '32px' }}>{kpi.icon}</span>
                  <span className="text-xs text-white/40 uppercase tracking-widest">{dateRange === 'today' ? 'Today' : dateRange === '7days' ? '7d' : '30d'}</span>
                </div>
                <p className="text-white/60 text-xs uppercase tracking-widest mb-2">{kpi.label}</p>
                <p style={{ color: kpi.color }} className="font-bebas text-4xl tracking-widest">
                  {kpi.format === 'currency' ? `₹${Math.round(kpi.value).toLocaleString('en-IN')}` : kpi.value.toLocaleString('en-IN')}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Admin summary cards */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Today's Revenue", value: `₹${Number(summary.cards.todaysRevenue).toLocaleString('en-IN')}`, color: '#22c55e' },
              { label: "Today's Orders", value: summary.cards.todaysOrders, color: '#f97316' },
              { label: 'Pending Orders', value: summary.cards.pendingOrders, color: '#f59e0b' },
              { label: 'Monthly Revenue', value: `₹${Number(summary.cards.monthlyRevenue).toLocaleString('en-IN')}`, color: '#14b8a6' },
            ].map((card, i) => (
              <div key={i} className="bg-[#1a1a1a] rounded-xl border border-white/5 p-4">
                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">{card.label}</p>
                <p className="font-bebas text-3xl" style={{ color: card.color }}>{card.value}</p>
              </div>
            ))}
          </div>
        )}

        {analytics && (
          <>
            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
              <div className="lg:col-span-2 bg-[#1a1a1a] rounded-2xl border border-white/10 p-6">
                <h2 className="font-bebas text-2xl tracking-widest uppercase text-white mb-4">Revenue Trend (Completed Orders)</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={analytics.revenueByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" style={{ fontSize: '11px' }} />
                    <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: '11px' }} />
                    <Tooltip
                      contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.2)' }}
                      formatter={(v: unknown) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} dot={{ fill: '#f97316' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-6">
                <h2 className="font-bebas text-2xl tracking-widest uppercase text-white mb-4">Order Types</h2>
                {orderTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={orderTypeData} cx="50%" cy="50%" labelLine={false} label={false} outerRadius={76} dataKey="value">
                        {orderTypeData.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend verticalAlign="bottom" formatter={(v) => <span style={{ color: 'rgba(255,255,255,0.85)' }}>{String(v)}</span>} />
                      <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.2)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-white/30 text-sm">No order data for this range</div>
                )}
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
              <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-6">
                <h2 className="font-bebas text-2xl tracking-widest uppercase text-white mb-4">Top Selling Items</h2>
                {analytics.topProducts?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.topProducts.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 160 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis type="number" stroke="rgba(255,255,255,0.5)" style={{ fontSize: '11px' }} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        stroke="rgba(255,255,255,0.5)"
                        width={150}
                        style={{ fontSize: '10px' }}
                        tickFormatter={(v: string) => v.length > 20 ? v.slice(0, 20) + '…' : v}
                      />
                      <Tooltip
                        contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.2)' }}
                        formatter={(v: any) => [`${v} sold`, 'Quantity']}
                      />
                      <Bar dataKey="qty" fill="#f97316" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-white/30 text-sm">No product data</div>
                )}
              </div>

              <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-6">
                <h2 className="font-bebas text-2xl tracking-widest uppercase text-white mb-4">Orders by Hour</h2>
                {hourlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="hour" stroke="rgba(255,255,255,0.5)" style={{ fontSize: '10px' }} />
                      <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: '11px' }} />
                      <Tooltip
                        contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.2)' }}
                        formatter={(v: any, name: any) => [name === 'revenue' ? `₹${Number(v).toLocaleString('en-IN')}` : v, name === 'revenue' ? 'Revenue' : 'Orders']}
                      />
                      <Legend />
                      <Bar dataKey="orders" fill="#22c55e" name="Orders" />
                      <Bar dataKey="revenue" fill="#f97316" name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-white/30 text-sm">No hourly data</div>
                )}
              </div>
            </div>

            {/* Revenue by Week stacked area */}
            <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-6 mb-8">
              <h2 className="font-bebas text-2xl tracking-widest uppercase text-white mb-4">Daily Order Volume</h2>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={analytics.revenueByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" style={{ fontSize: '11px' }} />
                  <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: '11px' }} />
                  <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.2)' }} />
                  <Legend />
                  <Area type="monotone" dataKey="orders" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} name="Orders" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Coupon Analytics */}
            {analytics.couponAnalytics?.length > 0 && (
              <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-6 mb-8">
                <h2 className="font-bebas text-2xl tracking-widest uppercase text-white mb-4">Coupon Performance</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead className="text-[10px] uppercase tracking-widest text-white/40 border-b border-white/10">
                      <tr>
                        <th className="p-3 text-left">Code</th>
                        <th className="p-3 text-center">Uses</th>
                        <th className="p-3 text-right">Total Discount</th>
                        <th className="p-3 text-right">Revenue Generated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {(analytics.couponAnalytics as any[]).map((c: any) => (
                        <tr key={c.coupon_code} className="hover:bg-white/5">
                          <td className="p-3 font-bebas text-xl text-[#f97316] tracking-widest">{c.coupon_code}</td>
                          <td className="p-3 text-center">{c.uses}</td>
                          <td className="p-3 text-right text-red-400">-₹{Number(c.total_discount).toLocaleString('en-IN')}</td>
                          <td className="p-3 text-right text-green-400">₹{Number(c.revenue_with_coupon).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Customer Analytics */}
            {analytics.customerAnalytics && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Total Customers', value: analytics.customerAnalytics.totalCustomers, color: '#f97316' },
                  { label: 'New Customers', value: analytics.customerAnalytics.newCustomers, color: '#22c55e' },
                  { label: 'Returning Customers', value: analytics.customerAnalytics.returningCustomers, color: '#14b8a6' },
                  { label: 'Repeat Order Rate', value: `${analytics.customerAnalytics.repeatOrderRate}%`, color: '#a855f7' },
                ].map((stat, i) => (
                  <div key={i} className="bg-[#1a1a1a] rounded-xl border border-white/5 p-4">
                    <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">{stat.label}</p>
                    <p className="font-bebas text-3xl" style={{ color: stat.color }}>{stat.value}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
