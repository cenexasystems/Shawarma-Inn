import { useEffect, useState } from 'react';
import {
  Package,
  TrendingUp,
  IndianRupee,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  AlertCircle
} from 'lucide-react';
import { useAdminContext } from '../../context/AdminContext';
import { supabase } from '../../lib/supabase';

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

const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
  <div className="group relative bg-[#181818] border border-white/5 rounded-2xl p-6 flex items-center justify-between transition-all duration-300 hover:bg-white/[0.04] overflow-hidden">
    <div className="relative z-10">
      <p className="text-[10px] uppercase tracking-[2px] text-white/50 font-medium">{title}</p>
      <h3 className="font-bebas text-4xl mt-2 tracking-wide text-white drop-shadow-md">{value}</h3>
    </div>
    <div className={`relative z-10 p-3 rounded-xl bg-black/40 border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] ${colorClass}`}>
      <Icon size={24} />
    </div>
  </div>
);

export default function DashboardPage() {
  const { dateRange, pendingOrdersCount } = useAdminContext();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Stats
  const [opsStats, setOpsStats] = useState({ processing: 0, inTransit: 0, completedToday: 0, cancelledToday: 0 });
  const [revenue, setRevenue] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [avgValue, setAvgValue] = useState(0);
  
  // Charts
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Operations (Current Queue) - independent of Date Filter
      const todayStart = new Date();
      todayStart.setHours(0,0,0,0);
      
      const [
        { count: processing },
        { count: inTransit },
        { count: completedToday },
        { count: cancelledToday }
      ] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', ['accepted', 'processing', 'preparing', 'ready']),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'in_transit'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'completed').gte('created_at', todayStart.toISOString()),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'cancelled').gte('created_at', todayStart.toISOString()),
      ]);

      setOpsStats({
        processing: processing || 0,
        inTransit: inTransit || 0,
        completedToday: completedToday || 0,
        cancelledToday: cancelledToday || 0,
      });

      // Filtered Stats (depends on dateRange)
      const { data: filteredOrders, error: ordersErr } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', dateRange.from)
        .lte('created_at', dateRange.to)
        .order('created_at', { ascending: false });

      if (ordersErr) throw ordersErr;

      const completedOrders = filteredOrders.filter(o => o.status === 'completed');
      const totalRev = completedOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
      
      setRevenue(totalRev);
      setOrdersCount(filteredOrders.length);
      setAvgValue(completedOrders.length > 0 ? totalRev / completedOrders.length : 0);
      setRecentOrders(filteredOrders.slice(0, 10));

    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDashboardData();
  }, [dateRange]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="font-bebas text-5xl tracking-[3px] uppercase">Control Room</h2>
        <p className="text-sm text-white/50 mt-1">Live restaurant operations and metrics.</p>
      </header>

      {error && <div className="text-red-400 bg-red-400/10 p-4 rounded-xl text-sm border border-red-400/20">{error}</div>}

      {/* Live Operations Status Strip - Always Today/Live */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Pending', value: pendingOrdersCount, color: 'border-red-500/20 bg-red-500/[0.05]', dot: 'bg-red-500 shadow-[0_0_10px_#ef4444]', icon: AlertCircle },
          { label: 'Processing', value: opsStats.processing, color: 'border-yellow-500/20 bg-yellow-500/[0.05]', dot: 'bg-yellow-400 shadow-[0_0_10px_#facc15]', icon: Clock },
          { label: 'In Transit', value: opsStats.inTransit, color: 'border-purple-500/20 bg-purple-500/[0.05]', dot: 'bg-purple-400 shadow-[0_0_10px_#c084fc]', icon: Truck },
          { label: 'Completed (Today)', value: opsStats.completedToday, color: 'border-green-500/20 bg-green-500/[0.05]', dot: 'bg-green-400 shadow-[0_0_10px_#4ade80]', icon: CheckCircle },
          { label: 'Cancelled (Today)', value: opsStats.cancelledToday, color: 'border-gray-500/20 bg-gray-500/[0.05]', dot: 'bg-gray-400 shadow-[0_0_10px_#9ca3af]', icon: XCircle },
        ].map(({ label, value, color, dot }) => (
          <div key={label} className={`group flex items-center justify-between p-5 rounded-2xl border backdrop-blur-sm transition-all duration-300 cursor-default ${color}`}>
            <div>
              <p className="text-[10px] uppercase tracking-[1.5px] text-white/50 font-bold">{label}</p>
              <p className="font-bebas text-4xl leading-none mt-2 text-white shadow-black drop-shadow-md">{value}</p>
            </div>
            <span className={`w-3 h-3 rounded-full flex-shrink-0 ${dot} ${label === 'Pending' && value > 0 ? 'animate-pulse' : ''}`} />
          </div>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#181818] border border-white/5 rounded-2xl p-6 animate-pulse">
              <div className="h-3 w-24 bg-white/10 rounded mb-3" />
              <div className="h-10 w-16 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard title="Total Revenue" value={`₹${revenue.toLocaleString()}`} icon={IndianRupee} colorClass="text-green-400" />
            <StatCard title="Total Orders" value={ordersCount} icon={Package} colorClass="text-[#ef8f2f]" />
            <StatCard title="Avg Order Value" value={`₹${Math.round(avgValue).toLocaleString()}`} icon={TrendingUp} colorClass="text-blue-400" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#181818] border border-white/5 rounded-2xl p-6 overflow-hidden">
              <h3 className="text-[11px] uppercase tracking-[2px] text-white/50 mb-4">Recent Orders (Filtered)</h3>
              {recentOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-white/20">
                  <Package size={32} className="mb-2 opacity-30" />
                  <p className="text-sm">No orders in this period</p>
                </div>
              ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 pr-2">
                {recentOrders.map((o: any) => (
                  <div key={o.id} className="flex items-center justify-between p-3 bg-white/[0.02] hover:bg-white/[0.04] transition-colors rounded-xl border border-white/5">
                    <div>
                      <p className="font-medium text-sm">#{o.id.split('-')[0]} - {o.customer_name || 'Guest'}</p>
                      <p className="text-xs text-white/40 mt-1">{new Date(o.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bebas text-lg text-[#ef8f2f]">₹{Number(o.total || 0).toLocaleString()}</p>
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider border ${getStatusColor(o.status)}`}>
                        {o.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
            
            <div className="bg-[#181818] border border-white/5 rounded-2xl p-6 flex flex-col justify-center items-center text-center">
              <h3 className="text-xl font-bebas text-white/80 mb-2 tracking-[2px]">Need deeper analytics?</h3>
              <p className="text-xs text-white/50 mb-6">Visit the dedicated Analytics and Reports sections for complete graphs, category breakdowns, and data exports.</p>
              <div className="flex gap-4">
                <a href="/admin/analytics" className="px-4 py-2 border border-[#ef8f2f]/30 text-[#ef8f2f] hover:bg-[#ef8f2f]/10 rounded-xl text-xs uppercase tracking-[2px] font-bold transition-colors">
                  View Analytics
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
