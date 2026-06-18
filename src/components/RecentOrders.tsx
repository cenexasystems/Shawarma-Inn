import { useState, useEffect } from 'react';

export interface Order {
  id: string;
  itemsText: string;
  total: number;
  status: 'PAID' | 'PENDING';
  timestamp: number;
  items: Array<{ name: string; qty: number }>;
  subtotal: number;
  discount: number;
  tax: number;
  orderType: 'dine-in' | 'takeaway' | 'delivery';
}

interface RecentOrdersProps {
  onOrdersLoaded?: (orders: Order[]) => void;
}

export default function RecentOrders({ onOrdersLoaded }: RecentOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Load orders from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('shawarmainn_orders');
    if (stored) {
      try {
        const parsed: Order[] = JSON.parse(stored);
        // Take last 5 orders, newest first
        const recent = parsed.slice(-5).reverse();
        setOrders(recent);
        onOrdersLoaded?.(recent);
      } catch (err) {
        console.error('Failed to parse orders from localStorage:', err);
      }
    }
  }, [onOrdersLoaded]);

  const copyToClipboard = (order: Order) => {
    const text = `Order #${orders.indexOf(order) + 1}
Items: ${order.itemsText}
Total: Rs ${order.total.toFixed(2)}
Type: ${order.orderType}
Status: ${order.status}`;
    
    navigator.clipboard.writeText(text).then(() => {
      setCopied(order.id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const clearHistory = () => {
    if (window.confirm('Clear all order history? This cannot be undone.')) {
      localStorage.removeItem('shawarmainn_orders');
      setOrders([]);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="border-t border-white/10 pt-3 bg-black/20 rounded-lg p-4 text-center">
        <p className="text-xs text-white/50 uppercase tracking-wide">📋 No Order History</p>
        <p className="text-xs text-white/30 mt-1">Orders will appear here after marking paid</p>
      </div>
    );
  }

  return (
    <div className="border-t border-white/10 pt-3 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase text-white/70 tracking-wide">📋 Recent Orders ({orders.length})</h3>
        <button
          onClick={clearHistory}
          className="text-xs text-red-400/70 hover:text-red-400 transition-colors font-semibold"
        >
          Clear
        </button>
      </div>

      <div className="space-y-2 max-h-[180px] overflow-y-auto">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-black/30 border border-white/10 rounded-lg overflow-hidden transition-all"
          >
            {/* Order Row */}
            <button
              onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
              className="w-full px-3 py-2 flex items-center justify-between hover:bg-black/40 transition-colors text-left text-xs"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white/70 font-semibold">#{orders.indexOf(order) + 1}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    order.status === 'PAID'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-orange-500/20 text-orange-400'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-white/50 line-clamp-1 text-[10px]">{order.itemsText}</p>
              </div>
              <div className="ml-2 text-right">
                <p className="text-white/80 font-bold">₹{order.total.toFixed(2)}</p>
                <p className="text-[10px] text-white/40">
                  {new Date(order.timestamp).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="ml-2 text-white/40 text-xs">
                {expandedId === order.id ? '▼' : '▶'}
              </div>
            </button>

            {/* Expanded Details */}
            {expandedId === order.id && (
              <div className="bg-black/50 border-t border-white/10 px-3 py-2 space-y-2 text-xs">
                <div className="space-y-1.5 pb-2 border-b border-white/10">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-white/60">
                      <span>{item.name} × {item.qty}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1 text-white/50 text-[11px]">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="text-white/70">{order.orderType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="text-white/70">₹{order.subtotal.toFixed(2)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-red-400">
                      <span>Discount:</span>
                      <span>-₹{order.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-green-400">
                    <span>Tax (5%):</span>
                    <span>+₹{order.tax.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(order)}
                  className="w-full mt-2 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-colors"
                >
                  {copied === order.id ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
