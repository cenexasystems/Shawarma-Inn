import { useEffect, useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePOSOrders } from '../hooks/usePOSOrders';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import type { Order } from '../components/RecentOrders';

type DateRange = 'today' | '7days' | '30days' | 'custom';

const COLORS = ['#f97316', '#22c55e', '#f59e0b', '#14b8a6', '#a855f7', '#ef4444'];

export default function Analytics() {
  const { user } = useAuth();
  const { orders: posOrders, source } = usePOSOrders();
  const [animated, setAnimated] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>('7days');

  // Convert POSOrder to Order format for compatibility
  const orders: Order[] = useMemo(() => {
    return posOrders.map((order): Order => ({
      id: order.id,
      itemsText: order.items.map(i => `${i.name} (${i.quantity})`).join(', '),
      total: order.total,
      status: (order.status.toUpperCase() === 'PAID' ? 'PAID' : 'PENDING') as 'PAID' | 'PENDING',
      timestamp: new Date(order.createdAt).getTime(),
      items: order.items.map(i => ({ name: i.name, qty: i.quantity })),
      subtotal: Number.isFinite(Number(order.subtotal))
        ? Number(order.subtotal)
        : order.items.reduce((sum, i) => sum + i.subtotal, 0),
      discount: Number.isFinite(Number(order.discount)) ? Number(order.discount) : 0,
      tax: Number.isFinite(Number(order.tax))
        ? Number(order.tax)
        : order.total - order.items.reduce((sum, i) => sum + i.subtotal, 0),
      orderType: (order.orderType || 'dine-in') as 'dine-in' | 'takeaway' | 'delivery',
    }));
  }, [posOrders]);

  useEffect(() => {
    setAnimated(true);
  }, []);

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    if (orders.length === 0) return [];

    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
      default:
        return orders;
    }

    return orders.filter((o) => Number.isFinite(o.timestamp) && o.timestamp >= startDate.getTime());
  }, [orders, dateRange]);

  // Calculate KPI data
  const kpiData = useMemo(() => {
    if (filteredOrders.length === 0) {
      return [
        { label: "Today's Revenue", value: 0, change: 0, icon: '💰', color: '#f97316' },
        { label: 'Total Orders', value: 0, change: 0, icon: '📦', color: '#22c55e' },
        { label: 'Avg Order Value', value: 0, change: 0, icon: '📊', color: '#f59e0b' },
        { label: 'Items Sold', value: 0, change: 0, icon: '🛍️', color: '#14b8a6' },
      ];
    }

    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = filteredOrders.length;
    const avgValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const itemsSold = filteredOrders.reduce(
      (sum, o) => sum + o.items.reduce((s, i) => s + i.qty, 0),
      0,
    );

    // Mock yesterday's data for comparison
    const yesterdayRevenue = totalRevenue * 0.88;
    const yesterdayOrders = Math.round(totalOrders * 0.92);
    const yesterdayAvg = totalOrders > 0 ? yesterdayRevenue / yesterdayOrders : 0;
    const yesterdayItems = Math.round(itemsSold * 0.95);

    return [
      {
        label: "Today's Revenue",
        value: totalRevenue,
        change: ((totalRevenue - yesterdayRevenue) / yesterdayRevenue) * 100,
        icon: '💰',
        color: '#f97316',
      },
      {
        label: 'Total Orders',
        value: totalOrders,
        change: ((totalOrders - yesterdayOrders) / yesterdayOrders) * 100,
        icon: '📦',
        color: '#22c55e',
      },
      {
        label: 'Avg Order Value',
        value: avgValue,
        change: ((avgValue - yesterdayAvg) / yesterdayAvg) * 100,
        icon: '📊',
        color: '#f59e0b',
      },
      {
        label: 'Items Sold',
        value: itemsSold,
        change: ((itemsSold - yesterdayItems) / yesterdayItems) * 100,
        icon: '🛍️',
        color: '#14b8a6',
      },
    ];
  }, [filteredOrders]);

  // Revenue over time (last 7 days or 30 days)
  const revenueChartData = useMemo(() => {
    if (filteredOrders.length === 0) {
      // Mock data for empty state
      return Array.from({ length: 7 }, (_, i) => ({
        date: `Day ${i + 1}`,
        revenue: Math.floor(Math.random() * 5000 + 2000),
      }));
    }

    // Group orders by day
    const byDay: Record<string, number> = {};
    filteredOrders.forEach((order) => {
      const date = new Date(order.timestamp);
      const key = date.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
      });
      byDay[key] = (byDay[key] || 0) + order.total;
    });

    return Object.entries(byDay)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([date, revenue]) => ({ date, revenue }));
  }, [filteredOrders]);

  // Orders by category/order type
  const categoryChartData = useMemo(() => {
    if (filteredOrders.length === 0) {
      return [
        { name: 'Dine In', value: 8 },
        { name: 'Takeaway', value: 12 },
        { name: 'Delivery', value: 5 },
      ];
    }

    const byType: Record<string, number> = { 'Dine In': 0, 'Takeaway': 0, 'Delivery': 0 };
    filteredOrders.forEach((order) => {
      const type = order.orderType === 'dine-in' ? 'Dine In' : order.orderType === 'takeaway' ? 'Takeaway' : 'Delivery';
      byType[type]++;
    });

    return Object.entries(byType).map(([name, value]) => ({ name, value }));
  }, [filteredOrders]);

  // Top 10 selling items
  const topItemsData = useMemo(() => {
    if (filteredOrders.length === 0) {
      return [
        { name: 'Chicken Shawarma', sold: 240 },
        { name: 'Lamb Shawarma', sold: 198 },
        { name: 'Mixed Grill', sold: 165 },
        { name: 'Falafel Wrap', sold: 152 },
        { name: 'Hummus Plate', sold: 128 },
        { name: 'Tabbouleh', sold: 98 },
        { name: 'Garlic Sauce', sold: 87 },
        { name: 'Shawarma Fries', sold: 76 },
        { name: 'Kebab Mix', sold: 65 },
        { name: 'Grilled Veggies', sold: 54 },
      ];
    }

    const itemCounts: Record<string, number> = {};
    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        itemCounts[item.name] = (itemCounts[item.name] || 0) + item.qty;
      });
    });

    return Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, sold]) => ({
        name: name.length > 18 ? name.substring(0, 18) + '...' : name,
        sold,
      }));
  }, [filteredOrders]);

  // Hourly heatmap data
  const heatmapData = useMemo(() => {
    const hours = Array.from({ length: 14 }, (_, i) => i + 10); // 10 AM to 11 PM
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const heatmap: Record<string, Record<number, number>> = {};

    days.forEach((day) => {
      heatmap[day] = {};
      hours.forEach((hour) => {
        if (filteredOrders.length === 0) {
          heatmap[day][hour] = Math.floor(Math.random() * 1000 + 200);
        } else {
          heatmap[day][hour] = 0;
        }
      });
    });

    if (filteredOrders.length > 0) {
      filteredOrders.forEach((order) => {
        const date = new Date(order.timestamp);
        const dayIndex = date.getDay() || 6; // Sunday is 0, make it 6
        const day = days[(dayIndex + 1) % 7]; // Adjust to Mon-Sun
        const hour = date.getHours();

        if (hours.includes(hour)) {
          heatmap[day][hour] += order.total;
        }
      });
    }

    return { days, hours, heatmap };
  }, [filteredOrders]);

  // Order status over time (stacked area)
  const statusTimelineData = useMemo(() => {
    if (filteredOrders.length === 0) {
      return Array.from({ length: 7 }, (_, i) => ({
        day: `Day ${i + 1}`,
        'Dine In': Math.floor(Math.random() * 3000 + 500),
        'Takeaway': Math.floor(Math.random() * 3000 + 500),
        'Delivery': Math.floor(Math.random() * 2000 + 300),
      }));
    }

    const byDayAndType: Record<string, Record<string, number>> = {};
    filteredOrders.forEach((order) => {
      const date = new Date(order.timestamp);
      const key = date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      const type =
        order.orderType === 'dine-in'
          ? 'Dine In'
          : order.orderType === 'takeaway'
            ? 'Takeaway'
            : 'Delivery';

      if (!byDayAndType[key]) byDayAndType[key] = { 'Dine In': 0, 'Takeaway': 0, 'Delivery': 0 };
      byDayAndType[key][type] += order.total;
    });

    return Object.entries(byDayAndType)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([day, data]) => ({ day, ...data }));
  }, [filteredOrders]);

  // Export functions
  const exportCSV = () => {
    if (filteredOrders.length === 0) {
      alert('No orders to export');
      return;
    }

    const headers = [
      'Order ID',
      'Date',
      'Time',
      'Items',
      'Subtotal',
      'Tax',
      'Discount',
      'Total',
      'Order Type',
      'Status',
    ];

    const rows = filteredOrders.map((order) => [
      order.id,
      new Date(order.timestamp).toLocaleDateString('en-IN'),
      new Date(order.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      order.itemsText,
      order.subtotal.toFixed(2),
      order.tax.toFixed(2),
      order.discount.toFixed(2),
      order.total.toFixed(2),
      order.orderType,
      order.status,
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shawarma-inn-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    if (filteredOrders.length === 0) {
      alert('No orders to print');
      return;
    }

    const reportDate = new Date().toLocaleDateString('en-IN');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Shawarma Inn Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; background: white; }
          h1, h2 { color: #d32f2f; margin-bottom: 10px; }
          h1 { border-bottom: 3px solid #d32f2f; padding-bottom: 10px; }
          .kpi-box { display: inline-block; width: 23%; margin-right: 2%; padding: 15px; border: 1px solid #ddd; border-radius: 5px; text-align: center; background: #f9f9f9; margin-bottom: 10px; }
          .kpi-value { font-size: 28px; font-weight: bold; color: #d32f2f; }
          .kpi-label { font-size: 12px; color: #666; margin-top: 5px; }
          table { width: 100%; margin-top: 20px; border-collapse: collapse; }
          th { background-color: #d32f2f; color: white; padding: 10px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          tr:hover { background-color: #f9f9f9; }
          .summary { margin-top: 20px; padding: 15px; background: #f0f0f0; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>📊 Shawarma Inn Analytics Report</h1>
        <p><strong>Report Date:</strong> ${reportDate}</p>
        
        <h2>Key Performance Indicators</h2>
        ${kpiData.map((k) => `<div class="kpi-box"><div class="kpi-value">Rs ${k.value.toFixed(0)}</div><div class="kpi-label">${k.label}</div></div>`).join('')}
        
        <h2>Recent Orders (Last ${filteredOrders.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date & Time</th>
              <th>Items</th>
              <th>Total</th>
              <th>Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${filteredOrders
              .slice(-10)
              .map(
                (o) => `
              <tr>
                <td>${o.id}</td>
                <td>${new Date(o.timestamp).toLocaleString('en-IN')}</td>
                <td>${o.itemsText}</td>
                <td>Rs ${o.total.toFixed(2)}</td>
                <td>${o.orderType}</td>
                <td><strong>${o.status}</strong></td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
        
        <div class="summary">
          <strong>Executive Summary:</strong><br/>
          Total Revenue: Rs ${kpiData[0].value.toFixed(2)}<br/>
          Total Orders: ${kpiData[1].value}<br/>
          Average Order Value: Rs ${kpiData[2].value.toFixed(2)}<br/>
          Items Sold: ${kpiData[3].value}
        </div>
      </body>
      </html>
    `;

    const win = window.open('', 'print', 'height=600,width=800');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  const copySummary = () => {
    const summary = `Shawarma Inn Report — ${dateRange === 'today' ? 'Today' : dateRange === '7days' ? 'Last 7 Days' : dateRange === '30days' ? 'Last 30 Days' : 'Custom Range'}
Revenue: Rs ${kpiData[0].value.toFixed(2)} | Orders: ${kpiData[1].value} | Avg Value: Rs ${kpiData[2].value.toFixed(2)}
${topItemsData.length > 0 ? `Top Item: ${topItemsData[0].name} (${topItemsData[0].sold} sold)` : ''}`;

    navigator.clipboard.writeText(summary).then(() => {
      alert('Summary copied to clipboard!');
    });
  };

  if (!user || user.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  // Get max value for heatmap color intensity
  const { heatmap } = heatmapData;
  const maxHeatValue = Math.max(
    ...heatmapData.days.flatMap((day) => Object.values(heatmap[day])),
  );

  const getHeatmapColor = (value: number) => {
    const intensity = value / maxHeatValue;
    if (intensity < 0.25) return '#fed7aa'; // Light orange
    if (intensity < 0.5) return '#fdba74'; // Medium orange
    if (intensity < 0.75) return '#fb923c'; // Dark orange
    return '#ea580c'; // Very dark orange
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-bebas text-6xl tracking-[3px] uppercase text-[#f97316]">Analytics</h1>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-white/60 text-sm">Real-time restaurant dashboard</p>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest ${
                source === 'supabase'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-blue-500/20 text-blue-400'
              }`}>
                {source === 'supabase' ? '☁️ Supabase' : '💾 Local'}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-2">
            {/* Date Range Buttons */}
            {(['today', '7days', '30days'] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                  dateRange === range
                    ? 'bg-[#f97316] text-black'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {range === 'today' ? 'Today' : range === '7days' ? '7 Days' : '30 Days'}
              </button>
            ))}

            {/* Export Dropdown */}
            <div className="relative group">
              <button className="px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider bg-white/10 text-white/70 hover:bg-white/20 transition-all">
                📊 Export
              </button>
              <div className="absolute right-0 mt-1 w-40 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <button
                  onClick={exportCSV}
                  className="w-full text-left px-4 py-2 text-xs hover:bg-white/10 rounded-t-lg"
                >
                  📥 Export CSV
                </button>
                <button
                  onClick={printReport}
                  className="w-full text-left px-4 py-2 text-xs hover:bg-white/10"
                >
                  🖨️ Print Report
                </button>
                <button
                  onClick={copySummary}
                  className="w-full text-left px-4 py-2 text-xs hover:bg-white/10 rounded-b-lg"
                >
                  📋 Copy Summary
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpiData.map((kpi, idx) => (
            <KPICard
              key={idx}
              label={kpi.label}
              value={kpi.value}
              change={kpi.change}
              icon={kpi.icon}
              color={kpi.color}
              animated={animated}
              delay={idx * 100}
            />
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-[#1a1a1a] rounded-2xl border border-white/10 p-6">
            <h2 className="font-bebas text-2xl tracking-widest uppercase text-white mb-4">Revenue Trend</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" style={{ fontSize: '12px' }} />
                <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.2)' }}
                  formatter={(value: unknown) => `Rs ${(value as number).toFixed(0)}`}
                />
                <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} dot={{ fill: '#f97316' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category Pie */}
          <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-6">
            <h2 className="font-bebas text-2xl tracking-widest uppercase text-white mb-4">Order Types</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  outerRadius={76}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.85)' }}>{String(value)}</span>}
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {/* Top Items */}
          <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-6">
            <h2 className="font-bebas text-2xl tracking-widest uppercase text-white mb-4">Top Selling Items</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={topItemsData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 150 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" stroke="rgba(255,255,255,0.5)" style={{ fontSize: '12px' }} />
                <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.5)" width={140} style={{ fontSize: '11px' }} />
                <Tooltip
                  contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.2)' }}
                  formatter={(value: unknown) => [`${value} sold`, 'Quantity']}
                />
                <Bar dataKey="sold" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Hourly Heatmap */}
          <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-6">
            <h2 className="font-bebas text-2xl tracking-widest uppercase text-white mb-4">Hourly Sales Heatmap</h2>
            <div className="overflow-x-auto">
              <div style={{ display: 'inline-block', minWidth: '100%' }}>
                {/* Hours header */}
                <div style={{ display: 'flex', marginBottom: '10px' }}>
                  <div style={{ width: '60px' }} />
                  {heatmapData.hours.map((hour) => (
                    <div
                      key={hour}
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        fontSize: '11px',
                        color: 'rgba(255,255,255,0.6)',
                      }}
                    >
                      {hour}
                    </div>
                  ))}
                </div>

                {/* Heatmap rows */}
                {heatmapData.days.map((day) => (
                  <div key={day} style={{ display: 'flex', marginBottom: '5px' }}>
                    <div
                      style={{
                        width: '60px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: 'rgba(255,255,255,0.7)',
                        lineHeight: '36px',
                      }}
                    >
                      {day}
                    </div>
                    {heatmapData.hours.map((hour) => (
                      <div
                        key={`${day}-${hour}`}
                        style={{
                          flex: 1,
                          height: '36px',
                          margin: '2px',
                          backgroundColor: getHeatmapColor(heatmap[day][hour]),
                          borderRadius: '4px',
                          position: 'relative',
                          cursor: 'pointer',
                          transition: 'opacity 0.2s',
                          opacity: 0.8,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
                        title={`${day} ${hour}:00 — Rs ${heatmap[day][hour].toFixed(0)}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
              <span>Low</span>
              <div style={{ display: 'flex', gap: '2px' }}>
                {['#fed7aa', '#fdba74', '#fb923c', '#ea580c'].map((color, i) => (
                  <div
                    key={i}
                    style={{ width: '20px', height: '12px', backgroundColor: color, borderRadius: '2px' }}
                  />
                ))}
              </div>
              <span>High</span>
            </div>
          </div>
        </div>

        {/* Order Status Timeline */}
        <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-6 mb-8">
          <h2 className="font-bebas text-2xl tracking-widest uppercase text-white mb-4">Order Type Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={statusTimelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" style={{ fontSize: '12px' }} />
              <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: '12px' }} />
              <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.2)' }} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Area
                type="monotone"
                dataKey="Dine In"
                stackId="1"
                stroke="#f97316"
                fill="#f97316"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="Takeaway"
                stackId="1"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="Delivery"
                stackId="1"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </main>
  );
}

// KPI Card Component with Animation
interface KPICardProps {
  label: string;
  value: number;
  change: number;
  icon: string;
  color: string;
  animated: boolean;
  delay: number;
}

function KPICard({ label, value, change, icon, color, animated, delay }: KPICardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!animated) return;

    const timeout = setTimeout(() => {
      const step = value / 40;
      let current = 0;
      const interval = setInterval(() => {
        current += step;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(interval);
        } else {
          setDisplayValue(current);
        }
      }, 20);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, [animated, value, delay]);

  const isPositive = change >= 0;

  return (
    <div
      style={{
        animation: animated ? `slideUp 0.6s ease-out ${delay}ms both` : 'none',
      }}
      className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-6 hover:border-white/20 hover:shadow-lg hover:shadow-orange-500/10 transition-all hover:-translate-y-1 cursor-pointer group"
    >
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="flex items-start justify-between mb-3">
        <span style={{ fontSize: '32px' }}>{icon}</span>
        <div
          style={{
            background: isPositive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: isPositive ? '#22c55e' : '#ef4444',
          }}
          className="px-2 py-1 rounded text-xs font-bold"
        >
          {isPositive ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%
        </div>
      </div>
      <p className="text-white/60 text-xs uppercase tracking-widest mb-2">{label}</p>
      <p style={{ color }} className="font-bebas text-4xl tracking-widest mb-3">
        {label.includes('Avg')
          ? `Rs ${displayValue.toFixed(0)}`
          : label.includes('Items')
            ? displayValue.toFixed(0)
            : label.includes('Revenue')
              ? `Rs ${displayValue.toFixed(0)}`
              : displayValue.toFixed(0)}
      </p>

      {/* Sparkline (simple mock) */}
      <div
        style={{
          height: '24px',
          background: 'linear-gradient(90deg, rgba(249,115,22,0.1), rgba(249,115,22,0.3))',
          borderRadius: '4px',
          position: 'relative',
          marginTop: '8px',
        }}
      >
        <svg style={{ width: '100%', height: '100%' }}>
          <polyline
            points={`0,12 ${Math.random() * 100},${Math.random() * 24} ${Math.random() * 100},${Math.random() * 24} 100,${Math.random() * 24}`}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </div>
  );
}
