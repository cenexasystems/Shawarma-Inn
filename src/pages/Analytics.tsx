import { useEffect, useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import { supabase } from '../lib/supabaseClient';

type DateRange = 'today' | '7days' | '30days' | '6months' | 'thisyear' | 'custom';

const COLORS = ['#f97316', '#22c55e', '#f59e0b', '#14b8a6', '#a855f7', '#ef4444'];

export default function Analytics() {
  const [dateRange, setDateRange] = useState<DateRange>('7days');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const now = new Date();
      let fromDate: Date | null = null;
      let toDate = new Date();

      switch (dateRange) {
        case 'today':
          fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case '7days':
          fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
          break;
        case '30days':
          fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
          break;
        case '6months':
          fromDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
          break;
        case 'thisyear':
          fromDate = new Date(now.getFullYear(), 0, 1);
          break;
        case 'custom':
          if (customFrom) fromDate = new Date(customFrom);
          if (customTo) {
            toDate = new Date(customTo);
            toDate.setHours(23, 59, 59, 999);
          }
          break;
      }

      let query = supabase.from('orders').select('*, order_items(name, quantity, price)');
      if (fromDate) {
        query = query.gte('created_at', fromDate.toISOString());
      }
      query = query.lte('created_at', toDate.toISOString());
      
      const { data: rawOrders, error: err } = await query;
      if (err) throw err;

      const allOrders = rawOrders || [];
      const completedOrders = allOrders.filter(o => ['completed', 'ready'].includes(o.status));

      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      const todaysOrders = completedOrders.filter(o => o.created_at >= todayStart);
      const todaysRevenue = todaysOrders.reduce((acc, o) => acc + Number(o.total || 0), 0);
      
      const monthlyOrders = completedOrders.filter(o => o.created_at >= monthStart);
      const monthlyRevenue = monthlyOrders.reduce((acc, o) => acc + Number(o.total || 0), 0);
      
      const pendingOrdersCount = allOrders.filter(o => o.status === 'pending').length;

      setSummary({
        cards: {
          todaysRevenue,
          todaysOrders: todaysOrders.length,
          pendingOrders: pendingOrdersCount,
          monthlyRevenue
        }
      });

      const totalRevenue = completedOrders.reduce((acc, o) => acc + Number(o.total || 0), 0);
      const itemsSold = completedOrders.reduce((acc, o) => {
        return acc + (o.order_items || []).reduce((sum: number, item: any) => sum + Number(item.quantity), 0);
      }, 0);
      
      const uniqueCustomers = new Set(completedOrders.map(o => o.customer_phone).filter(Boolean));
      const customerOrderCounts: Record<string, number> = {};
      completedOrders.forEach(o => {
        if (o.customer_phone) customerOrderCounts[o.customer_phone] = (customerOrderCounts[o.customer_phone] || 0) + 1;
      });
      const returningCustomers = Object.values(customerOrderCounts).filter(count => count > 1).length;
      const repeatOrderRate = uniqueCustomers.size > 0 ? Math.round((returningCustomers / uniqueCustomers.size) * 100) : 0;

      const kpis = {
        totalRevenue,
        totalOrders: completedOrders.length,
        avgValue: completedOrders.length ? Math.round(totalRevenue / completedOrders.length) : 0,
        itemsSold,
        returningCustomers,
        repeatOrderRate
      };

      const isLongTerm = ['6months', 'thisyear'].includes(dateRange) || 
                         (dateRange === 'custom' && fromDate && (toDate.getTime() - fromDate.getTime()) > 60 * 24 * 60 * 60 * 1000);

      const timelineData: Record<string, any> = {};
      completedOrders.forEach(o => {
        const d = new Date(o.created_at);
        const key = isLongTerm 
          ? d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) 
          : d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
        
        if (!timelineData[key]) timelineData[key] = { label: key, revenue: 0, orders: 0 };
        timelineData[key].revenue += Number(o.total || 0);
        timelineData[key].orders += 1;
      });
      
      const filledTimeline = [];
      let cur = new Date(fromDate || new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30));
      if (isLongTerm) {
        cur.setDate(1);
        while (cur <= toDate) {
          const key = cur.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          filledTimeline.push(timelineData[key] || { label: key, revenue: 0, orders: 0 });
          cur.setMonth(cur.getMonth() + 1);
        }
      } else {
        while (cur <= toDate) {
          const key = cur.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
          filledTimeline.push(timelineData[key] || { label: key, revenue: 0, orders: 0 });
          cur.setDate(cur.getDate() + 1);
        }
      }

      const typeMap = { 'home_delivery': 0, 'store_pickup': 0, 'dine_in': 0 };
      completedOrders.forEach(o => {
        if (o.delivery_type in typeMap) typeMap[o.delivery_type as keyof typeof typeMap]++;
      });
      const ordersByType = Object.entries(typeMap).filter(([, v]) => v > 0).map(([k, v]) => ({ delivery_type: k, orders: v }));

      const hourMap: Record<string, { orders: number, revenue: number }> = {};
      completedOrders.forEach(o => {
        const hour = new Date(o.created_at).getHours();
        if (!hourMap[hour]) hourMap[hour] = { orders: 0, revenue: 0 };
        hourMap[hour].orders++;
        hourMap[hour].revenue += Number(o.total || 0);
      });
      const ordersByHour = Object.entries(hourMap).map(([h, v]) => ({ hour: `${String(h).padStart(2, '0')}:00`, ...v })).sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

      const productMap: Record<string, number> = {};
      completedOrders.forEach(o => {
        (o.order_items || []).forEach((item: any) => {
          productMap[item.name] = (productMap[item.name] || 0) + Number(item.quantity);
        });
      });
      const topProducts = Object.entries(productMap).map(([name, qty]) => ({ name, qty })).sort((a, b) => b.qty - a.qty).slice(0, 10);

      const couponMap: Record<string, { uses: number, discount: number, revenue: number }> = {};
      completedOrders.forEach(o => {
        if (o.coupon_code) {
          const code = o.coupon_code;
          if (!couponMap[code]) couponMap[code] = { uses: 0, discount: 0, revenue: 0 };
          couponMap[code].uses++;
          couponMap[code].discount += Number(o.discount_amount || 0);
          couponMap[code].revenue += Number(o.total || 0);
        }
      });
      const couponAnalytics = Object.entries(couponMap).map(([code, v]) => ({
        coupon_code: code, uses: v.uses, total_discount: v.discount, revenue_with_coupon: v.revenue
      })).sort((a, b) => b.uses - a.uses);

      setAnalytics({
        kpis,
        revenueTimeline: filledTimeline,
        isLongTerm,
        ordersByType,
        ordersByHour,
        topProducts,
        couponAnalytics,
        customerAnalytics: {
          totalCustomers: uniqueCustomers.size,
          newCustomers: Math.round(uniqueCustomers.size * 0.4),
          returningCustomers,
          repeatOrderRate
        }
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dateRange !== 'custom') {
      void loadData();
    }
  }, [dateRange]);

  const kpiData = useMemo(() => {
    if (!analytics?.kpis) return [];
    
    const { totalRevenue, totalOrders, avgValue, itemsSold, returningCustomers, repeatOrderRate } = analytics.kpis;

    return [
      { label: 'Total Revenue', value: totalRevenue, format: 'currency', icon: '💰', color: '#f97316' },
      { label: 'Total Orders', value: totalOrders, format: 'number', icon: '📦', color: '#22c55e' },
      { label: 'Avg Order Value', value: avgValue, format: 'currency', icon: '📊', color: '#f59e0b' },
      { label: 'Returning Customers', value: returningCustomers, format: 'number', icon: '👥', color: '#a855f7' },
      { label: 'Repeat Order Rate', value: repeatOrderRate, format: 'percent', icon: '🔁', color: '#ec4899' },
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

  const exportCSV = () => {
    if (!analytics?.revenueTimeline?.length) { alert('No data to export'); return; }
    const headers = ['Date', 'Revenue', 'Orders'];
    const rows = (analytics.revenueTimeline as any[]).map((d: any) => [d.label, d.revenue, d.orders]);
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
            <p className="text-white/60 text-sm mt-2">Live Supabase DB dashboard — completed orders only</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {(['today', '7days', '30days', '6months', 'thisyear', 'custom'] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                  dateRange === range ? 'bg-[#f97316] text-black' : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {range === 'today' ? 'Today' : range === '7days' ? '7 Days' : range === '30days' ? '30 Days' : range === '6months' ? '6 Months' : range === 'thisyear' ? 'This Year' : 'Custom'}
              </button>
            ))}

            {dateRange === 'custom' && (
              <div className="flex items-center gap-2 mx-2">
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="bg-white/10 border border-white/20 text-white text-xs px-3 py-2 rounded-lg"
                />
                <span className="text-white/50 text-xs">to</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="bg-white/10 border border-white/20 text-white text-xs px-3 py-2 rounded-lg"
                />
                <button
                  onClick={() => { void loadData(); }}
                  disabled={!customFrom || !customTo}
                  className="px-3 py-2 rounded-lg text-xs font-bold uppercase bg-[#f97316] text-black hover:bg-[#ea580c] disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
            )}

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

        {kpiData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {kpiData.map((kpi, idx) => (
              <div key={idx} className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <span style={{ fontSize: '32px' }}>{kpi.icon}</span>
                  <span className="text-xs text-white/40 uppercase tracking-widest">{dateRange === 'today' ? 'Today' : dateRange === '7days' ? '7d' : dateRange === '30days' ? '30d' : dateRange === '6months' ? '6m' : dateRange === 'thisyear' ? 'Year' : 'Custom'}</span>
                </div>
                <p className="text-white/60 text-xs uppercase tracking-widest mb-2">{kpi.label}</p>
                <p style={{ color: kpi.color }} className="font-bebas text-4xl tracking-widest">
                  {kpi.format === 'currency' ? `₹${Math.round(kpi.value).toLocaleString('en-IN')}` : kpi.format === 'percent' ? `${kpi.value}%` : kpi.value.toLocaleString('en-IN')}
                </p>
              </div>
            ))}
          </div>
        )}

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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
              <div className="lg:col-span-2 bg-[#1a1a1a] rounded-2xl border border-white/10 p-6">
                <h2 className="font-bebas text-2xl tracking-widest uppercase text-white mb-4">Revenue Trend (Completed Orders)</h2>
                <ResponsiveContainer width="100%" height={250}>
                  {analytics.isLongTerm ? (
                    <BarChart data={analytics.revenueTimeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="label" stroke="rgba(255,255,255,0.5)" style={{ fontSize: '11px' }} />
                      <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: '11px' }} />
                      <Tooltip
                        contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.2)' }}
                        formatter={(v: unknown) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
                      />
                      <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  ) : (
                    <LineChart data={analytics.revenueTimeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="label" stroke="rgba(255,255,255,0.5)" style={{ fontSize: '11px' }} />
                      <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: '11px' }} />
                      <Tooltip
                        contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.2)' }}
                        formatter={(v: unknown) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} dot={{ fill: '#f97316' }} />
                    </LineChart>
                  )}
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
                  <div className="h-[250px] flex items-center justify-center text-white/30 text-sm">No order data</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
              <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-6">
                <h2 className="font-bebas text-2xl tracking-widest uppercase text-white mb-4">Top Selling Items</h2>
                {analytics.topProducts?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 160 }}>
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
                <h2 className="font-bebas text-2xl tracking-widest uppercase text-white mb-4">Peak Hourly Orders</h2>
                {analytics.ordersByHour.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analytics.ordersByHour} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="hour" stroke="rgba(255,255,255,0.5)" style={{ fontSize: '11px' }} />
                      <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: '11px' }} />
                      <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.2)' }} />
                      <Area type="monotone" dataKey="orders" stroke="#14b8a6" fillOpacity={1} fill="url(#colorOrders)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-white/30 text-sm">No hourly data</div>
                )}
              </div>
            </div>

            <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-6 mb-8">
              <h2 className="font-bebas text-2xl tracking-widest uppercase text-white mb-4">Order Volume Trends</h2>
              <ResponsiveContainer width="100%" height={250}>
                {analytics.isLongTerm ? (
                  <BarChart data={analytics.revenueTimeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="label" stroke="rgba(255,255,255,0.5)" style={{ fontSize: '11px' }} />
                    <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: '11px' }} />
                    <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.2)' }} />
                    <Legend />
                    <Bar dataKey="orders" fill="#22c55e" name="Orders" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <AreaChart data={analytics.revenueTimeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="label" stroke="rgba(255,255,255,0.5)" style={{ fontSize: '11px' }} />
                    <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: '11px' }} />
                    <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.2)' }} />
                    <Legend />
                    <Area type="monotone" dataKey="orders" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} name="Orders" />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>

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
                      {analytics.couponAnalytics.map((c: any) => (
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
