import { useEffect, useState, useMemo } from 'react';
import { Download, TrendingUp, IndianRupee, Tag, ShoppingBag } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAdminContext } from '../../context/AdminContext';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#ef8f2f', '#dc2626', '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'];

export default function ReportsPage() {
  const { dateRangeType, dateRange } = useAdminContext();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(id, name, price, quantity)')
        .gte('created_at', dateRange.from)
        .lte('created_at', dateRange.to)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [dateRange]);

  // Derived Analytics
  const metrics = useMemo(() => {
    const completed = orders.filter(o => o.status === 'completed');
    const cancelled = orders.filter(o => o.status === 'cancelled');
    
    const revenue = completed.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const avgOrder = completed.length > 0 ? revenue / completed.length : 0;
    
    // Time series revenue
    const revenueByDateMap = new Map<string, number>();
    completed.forEach(o => {
      const date = new Date(o.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      revenueByDateMap.set(date, (revenueByDateMap.get(date) || 0) + Number(o.total || 0));
    });
    const revenueData = Array.from(revenueByDateMap.entries()).map(([date, total]) => ({ date, total }));

    // Item Popularity
    const itemMap = new Map<string, { count: number, revenue: number }>();
    completed.forEach(o => {
      (o.order_items || []).forEach((item: any) => {
        const existing = itemMap.get(item.name) || { count: 0, revenue: 0 };
        itemMap.set(item.name, {
          count: existing.count + Number(item.quantity || 1),
          revenue: existing.revenue + (Number(item.price || 0) * Number(item.quantity || 1))
        });
      });
    });
    
    const topItems = Array.from(itemMap.entries())
      .map(([name, stats]) => ({ name, value: stats.count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      revenue,
      totalOrders: completed.length,
      avgOrder,
      cancelledCount: cancelled.length,
      revenueData,
      topItems
    };
  }, [orders]);

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Order ID,Date,Customer,Total,Status\n"
      + orders.map(o => `${o.id},${new Date(o.created_at).toISOString()},"${o.customer_name || 'Guest'}",${o.total},${o.status}`).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `shawarma_inn_report_${dateRangeType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-bebas text-5xl tracking-[2px] uppercase text-gray-900">Reports & Analytics</h2>
          <p className="text-gray-500 text-sm mt-1">Deep dive into your sales and performance metrics.</p>
        </div>
        <button 
          onClick={handleExport}
          className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-[1px] flex items-center gap-2 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </header>

      {error && <div className="text-red-400 bg-red-400/10 p-4 rounded-xl text-sm border border-red-400/20">{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `₹${metrics.revenue.toLocaleString()}`, icon: IndianRupee, color: 'text-green-600' },
          { label: 'Completed Orders', value: metrics.totalOrders.toLocaleString(), icon: ShoppingBag, color: 'text-[#183025]' },
          { label: 'Avg Order Value', value: `₹${Math.round(metrics.avgOrder).toLocaleString()}`, icon: TrendingUp, color: 'text-blue-600' },
          { label: 'Cancelled Orders', value: metrics.cancelledCount.toLocaleString(), icon: Tag, color: 'text-red-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-2xl p-6 relative overflow-hidden group shadow-sm">
            <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gray-50 rounded-full blur-2xl group-hover:bg-gray-100 transition-colors pointer-events-none`} />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[2px] text-gray-500 font-bold mb-2">{label}</p>
                <h3 className="font-bebas text-4xl leading-none text-gray-900">{value}</h3>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl shadow-sm">
                <Icon size={24} className={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="h-96 bg-white border border-gray-200 rounded-2xl animate-pulse flex items-center justify-center shadow-sm">
          <div className="w-8 h-8 border-2 border-[#183025] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-[11px] uppercase tracking-[2px] text-gray-500 font-bold mb-6">Revenue Trend</h3>
            <div className="h-[300px] w-full">
              {metrics.revenueData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400">No data available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics.revenueData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#183025" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#183025" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                    <XAxis dataKey="date" stroke="rgba(0,0,0,0.4)" fontSize={10} tickMargin={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="rgba(0,0,0,0.4)" fontSize={10} tickFormatter={(v) => `₹${v}`} axisLine={false} tickLine={false} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#fff', borderColor: 'rgba(0,0,0,0.1)', borderRadius: '12px' }}
                      itemStyle={{ color: '#183025', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="total" stroke="#183025" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-[11px] uppercase tracking-[2px] text-gray-500 font-bold mb-6">Top Selling Items</h3>
            <div className="h-[300px] w-full">
              {metrics.topItems.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400">No data available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.topItems}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {metrics.topItems.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#fff', borderColor: 'rgba(0,0,0,0.1)', borderRadius: '12px' }}
                      itemStyle={{ color: '#111827' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="mt-4 space-y-2">
              {metrics.topItems.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-gray-600 line-clamp-1">{item.name}</span>
                  </div>
                  <span className="font-bold text-gray-900">{item.value}x</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
