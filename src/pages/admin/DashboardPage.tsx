import { Link } from 'react-router-dom';
import { Store, MessageCircle, Package, TrendingUp, Activity, Settings } from 'lucide-react';
import { useOperationsFilter, OperationsFilterProvider } from '../../context/OperationsFilterContext';
import { useAdminContext } from '../../context/AdminContext';
import { useEffect } from 'react';

function DashboardContent() {
  const { kpi, fetchOrders, orders } = useOperationsFilter();
  const { unacknowledgedAlerts, pendingOrdersCount } = useAdminContext();

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="p-8 max-w-[1200px] mx-auto font-inter">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-[800] text-erp-text flex items-center gap-3">
            <Store className="text-erp-primary" size={28} />
            Operations Center
          </h1>
          <p className="text-erp-muted mt-1 text-sm font-[500]">The restaurant control room.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-erp-border shadow-sm flex flex-col justify-center text-center">
          <span className="text-xs font-[700] text-erp-muted uppercase tracking-[1.5px] mb-2">Today's Revenue</span>
          <span className="text-4xl font-[800] text-erp-primary">₹{kpi.revenue.toLocaleString()}</span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-erp-border shadow-sm flex flex-col justify-center text-center">
          <span className="text-xs font-[700] text-erp-muted uppercase tracking-[1.5px] mb-2">Today's Orders</span>
          <span className="text-4xl font-[800] text-erp-text">{kpi.completed + kpi.pending + kpi.contacted}</span>
        </div>
        <div className="bg-[#FFFDF6] p-6 rounded-2xl border border-[#FEF3C7] shadow-sm flex flex-col justify-center text-center">
          <span className="text-xs font-[700] text-[#D97706] uppercase tracking-[1.5px] mb-2">Pending</span>
          <span className="text-4xl font-[800] text-[#D97706]">{pendingOrdersCount}</span>
        </div>
        <div className="bg-[#F4F8FF] p-6 rounded-2xl border border-[#DBEAFE] shadow-sm flex flex-col justify-center text-center">
          <span className="text-xs font-[700] text-[#2563EB] uppercase tracking-[1.5px] mb-2">Live Alerts</span>
          <span className="text-4xl font-[800] text-[#2563EB]">{unacknowledgedAlerts.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-erp-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-erp-border bg-erp-bg flex items-center justify-between">
              <h2 className="font-[700] text-[15px] flex items-center gap-2">
                <Activity size={18} /> Recent Activity
              </h2>
            </div>
            <div className="divide-y divide-erp-border max-h-[400px] overflow-y-auto">
              {orders.length === 0 ? (
                <div className="p-6 text-center text-sm text-erp-muted">
                  Monitoring system activities in real-time...
                </div>
              ) : (
                orders.slice(0, 6).map(order => (
                  <div key={order.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        order.status === 'completed' ? 'bg-green-100 text-green-700' :
                        order.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        <Store size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-[600] text-gray-900">
                          {order.customer_name || 'Guest'} <span className="text-gray-500 font-[400] text-xs ml-1">placed an order</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(order.created_at).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <p className="text-sm font-[700] text-gray-900">₹{order.total?.toLocaleString()}</p>
                      <span className={`text-[9px] uppercase font-bold tracking-[1px] px-2 py-0.5 rounded-full border ${
                        order.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' :
                        order.status === 'pending' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-700 border-red-200' :
                        'bg-blue-100 text-blue-700 border-blue-200'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-erp-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-erp-border bg-erp-bg">
              <h2 className="font-[700] text-[15px] flex items-center gap-2">
                <Settings size={18} /> Quick Actions
              </h2>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <Link to="/admin/whatsapp" className="w-full flex items-center gap-3 bg-[#EEF6F0] text-[#16A34A] px-4 py-3 rounded-xl font-[600] hover:bg-[#DCFCE7] transition-colors">
                <MessageCircle size={20} />
                WhatsApp Center
              </Link>
              <Link to="/admin/menu" className="w-full flex items-center gap-3 bg-erp-bg text-erp-text px-4 py-3 rounded-xl font-[600] hover:bg-black/5 transition-colors">
                <Package size={20} />
                Manage Menu
              </Link>
              <Link to="/admin/analytics" className="w-full flex items-center gap-3 bg-erp-bg text-erp-text px-4 py-3 rounded-xl font-[600] hover:bg-black/5 transition-colors">
                <TrendingUp size={20} />
                View Analytics
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <OperationsFilterProvider>
      <DashboardContent />
    </OperationsFilterProvider>
  );
}
