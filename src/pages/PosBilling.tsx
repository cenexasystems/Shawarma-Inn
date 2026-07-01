import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiRequest } from '../lib/api';
import Invoice from '../components/Invoice';
import RecentOrders from '../components/RecentOrders';
import type { CartItem } from '../types';
import { computeGst, GST_ACTIVE, GST_PERCENTAGE } from '../config/pricing';

interface PosMenuItem {
  id: number;
  name: string;
  price: number;
  category: string;
}

interface GeneratedOrder {
  id: number;
  order_number: number;
  total: number;
  status: string;
  created_at: string;
  items: Array<{ id: number; name: string; quantity: number; price: number }>;
}

type OrderType = 'dine-in' | 'takeaway' | 'delivery';

export default function PosBilling() {
  const { token } = useAuth();

  const [menuItems, setMenuItems] = useState<PosMenuItem[]>([]);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [currentOrderNumber, setCurrentOrderNumber] = useState<number>(101);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [discount, setDiscount] = useState(0);
  const [orderType, setOrderType] = useState<OrderType>('dine-in');
  const [showInvoice, setShowInvoice] = useState(false);

  const tokenRequired = token || '';

  const loadPosData = async () => {
    setLoading(true);
    setError('');

    try {
      const [menuResponse, nextOrderResponse] = await Promise.all([
        apiRequest<{ items: PosMenuItem[] }>('/menu-items'),
        apiRequest<{ nextOrderNumber: number }>('/pos/next-order-number', {
          token: tokenRequired,
        }),
      ]);

      setMenuItems(menuResponse.items || []);
      setCurrentOrderNumber(nextOrderResponse.nextOrderNumber || 101);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize POS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPosData();
  }, []);

  const cartLines = useMemo(() => {
    return Object.entries(cart)
      .map(([id, quantity]) => {
        const menuItem = menuItems.find((entry) => entry.id === Number(id));
        if (!menuItem || quantity <= 0) {
          return null;
        }
        return {
          menuItem,
          quantity,
          subtotal: menuItem.price * quantity,
        };
      })
      .filter(Boolean) as Array<{
        menuItem: PosMenuItem;
        quantity: number;
        subtotal: number;
      }>;
  }, [cart, menuItems]);

  const subtotal = useMemo(
    () => cartLines.reduce((sum, line) => sum + line.subtotal, 0),
    [cartLines],
  );

  const discountAmount = useMemo(
    () => Math.round((subtotal * discount) / 100 * 100) / 100,
    [subtotal, discount],
  );

  const taxableAmount = subtotal - discountAmount;
  const tax = useMemo(
    () => computeGst(taxableAmount),
    [taxableAmount],
  );

  const total = useMemo(
    () => Math.round((taxableAmount + tax) * 100) / 100,
    [taxableAmount, tax],
  );

  const itemCount = useMemo(
    () => Object.values(cart).reduce((sum, qty) => sum + qty, 0),
    [cart],
  );

  const addItem = (id: number) => {
    setCart((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  const removeItem = (id: number) => {
    setCart((prev) => {
      const updated = { ...prev };
      if (updated[id] <= 1) {
        delete updated[id];
      } else {
        updated[id]--;
      }
      return updated;
    });
  };

  const clearCart = () => {
    setCart({});
    setDiscount(0);
    setShowInvoice(false);
  };

  const generateBill = async () => {
    if (!cartLines.length) {
      setError('Tap at least one menu item to generate a bill.');
      return;
    }

    // Open invoice modal without API call (for fast POS)
    setShowInvoice(true);
    setError('');
  };

  const markPaid = async () => {
    try {
      setSaving(true);
      setError('');

      const payload = {
        items: cartLines.map((line) => ({
          menu_item_id: line.menuItem.id,
          quantity: line.quantity,
        })),
        total: total,
        orderType,
      };

      await apiRequest<{ order: GeneratedOrder; nextOrderNumber: number }>(
        '/orders/generate',
        {
          method: 'POST',
          token: tokenRequired,
          body: payload,
        },
      );

      setCurrentOrderNumber(currentOrderNumber + 1);
      setShowInvoice(false);
      clearCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save order');
    } finally {
      setSaving(false);
    }
  };


  const cartItemsForInvoice: CartItem[] = cartLines.map(line => ({
    id: line.menuItem.id,
    name: line.menuItem.name,
    price: line.menuItem.price,
    qty: line.quantity,
    image: '',
  }));

  return (
    <main className="min-h-screen bg-[#121212] text-[#f7f7f7] px-3 py-5 md:px-6 md:py-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4">
        <section className="bg-[#1b1b1b] rounded-[20px] border border-white/10 p-4 md:p-6">
          <header className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h1 className="font-bebas text-5xl tracking-[3px] uppercase text-[#ef8f2f]">Shawarma Inn POS</h1>
              <p className="text-sm text-white/60">Order #{currentOrderNumber}</p>
            </div>
            <Link to="/admin" className="text-xs uppercase tracking-wider border border-white/20 rounded-full px-4 py-2">
              Back to Admin
            </Link>
          </header>

          {loading && <p className="text-white/60">Loading POS...</p>}

          {!loading && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => addItem(item.id)}
                  className="min-h-[110px] md:min-h-[130px] rounded-2xl bg-[#222] border border-[#2d2d2d] hover:border-[#ef8f2f] active:scale-[0.98] transition-all px-3 py-4 text-left"
                >
                  <p className="text-[17px] md:text-[20px] leading-tight font-semibold">{item.name}</p>
                  <p className="mt-2 text-[13px] uppercase tracking-[1px] text-white/50">{item.category}</p>
                  <p className="mt-2 text-[#4ade80] text-[20px] md:text-[24px] font-bold">Rs {item.price.toFixed(0)}</p>
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="bg-[#181818] rounded-[20px] border border-white/10 p-4 md:p-6 flex flex-col gap-4 max-h-[90vh] overflow-hidden flex-col">
          <h2 className="font-bebas text-4xl tracking-[3px] uppercase">Current Order</h2>

          {/* Order Type Toggle */}
          <div className="flex gap-2">
            {(['dine-in', 'takeaway', 'delivery'] as OrderType[]).map((type) => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className={`flex-1 py-2 px-3 rounded-lg font-bebas text-xs tracking-wider uppercase transition-all ${
                  orderType === type
                    ? 'bg-[#ef8f2f] text-[#121212]'
                    : 'bg-black/20 text-white/60 border border-white/10 hover:border-white/30'
                }`}
              >
                {type === 'dine-in' ? '🪑 Dine In' : type === 'takeaway' ? '📦 Takeaway' : '🚗 Delivery'}
              </button>
            ))}
          </div>

          {/* Cart Items */}
          <div className="space-y-2 flex-1 overflow-auto pr-2">
            {cartLines.length === 0 && <p className="text-white/50 text-sm">Tap menu buttons to add items.</p>}
            {cartLines.map((line) => (
              <div key={line.menuItem.id} className="bg-black/30 border border-white/10 rounded-xl p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-sm">{line.menuItem.name}</p>
                    <p className="text-xs text-white/60">₹{line.menuItem.price}</p>
                  </div>
                  <p className="text-[#4ade80] font-bold">₹{line.subtotal.toFixed(0)}</p>
                </div>
                {/* Quantity Controls */}
                <div className="flex items-center gap-2 bg-black/40 rounded-lg p-1">
                  <button
                    onClick={() => removeItem(line.menuItem.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-full border border-[#ef8f2f] hover:bg-[#ef8f2f]/20 text-sm font-bold"
                  >
                    −
                  </button>
                  <span className="flex-1 text-center font-bold text-sm">{line.quantity}</span>
                  <button
                    onClick={() => addItem(line.menuItem.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-full border border-[#ef8f2f] hover:bg-[#ef8f2f]/20 text-sm font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Discount Input */}
          <div className="border-t border-white/10 pt-3 space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold uppercase text-white/70">Discount (%)</label>
              <input
                type="number"
                min="0"
                max="99"
                value={discount}
                onChange={(e) => setDiscount(Math.max(0, Math.min(99, parseInt(e.target.value) || 0)))}
                className="w-16 bg-black/50 border border-white/20 rounded-lg px-2 py-1 text-sm text-center font-bold"
              />
            </div>
            {discount > 0 && (
              <p className="text-xs text-red-400">Discount: -₹{discountAmount.toFixed(2)}</p>
            )}
          </div>

          {/* Totals Summary */}
          <div className="border-t border-white/10 pt-3 space-y-2 text-sm">
            <div className="flex justify-between text-white/70">
              <span>{itemCount} items</span>
              <span className="font-bold">₹{subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-red-400">
                <span>Discount ({discount}%)</span>
                <span className="font-bold">-₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            {GST_ACTIVE && (
              <div className="flex justify-between text-white/70">
                <span>Tax ({GST_PERCENTAGE}%)</span>
                <span className="font-bold text-[#4ade80]">₹{tax.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-end border-t border-white/10 pt-2">
              <p className="font-bebas text-2xl tracking-[2px]">TOTAL</p>
              <p className="font-bebas text-5xl text-[#ef8f2f]">₹{total.toFixed(2)}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={clearCart}
              className="rounded-2xl py-3 bg-[#2b2b2b] text-white text-sm font-semibold hover:bg-[#3a3a3a] transition-all active:scale-95"
            >
              Clear
            </button>
            <button
              onClick={generateBill}
              disabled={saving || cartLines.length === 0}
              className="rounded-2xl py-3 bg-[#ef8f2f] text-[#121212] text-sm font-bold disabled:opacity-50 hover:bg-yellow-500 transition-all active:scale-95"
            >
              {saving ? 'Wait...' : 'Print Bill'}
            </button>
          </div>

          {error && <p className="text-xs text-red-400 text-center">{error}</p>}

          {/* Recent Orders Panel */}
          <div className="mt-2">
            <RecentOrders />
          </div>
        </aside>
      </div>

      {/* Invoice Modal */}
      {showInvoice && (
        <Invoice
          items={cartItemsForInvoice}
          subtotal={subtotal}
          tax={tax}
          discount={discount}
          total={total}
          orderType={orderType}
          onClose={() => setShowInvoice(false)}
          onMarkPaid={markPaid}
        />
      )}
    </main>
  );
}
