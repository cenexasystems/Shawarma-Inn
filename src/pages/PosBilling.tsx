import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiRequest } from '../lib/api';

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

export default function PosBilling() {
  const { user, token } = useAuth();

  const [menuItems, setMenuItems] = useState<PosMenuItem[]>([]);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [currentOrderNumber, setCurrentOrderNumber] = useState<number>(101);
  const [generatedOrder, setGeneratedOrder] = useState<GeneratedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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

  const total = useMemo(
    () => cartLines.reduce((sum, line) => sum + line.subtotal, 0),
    [cartLines],
  );

  const addItem = (id: number) => {
    setCart((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  const clearCart = () => {
    setCart({});
    setGeneratedOrder(null);
  };

  const generateBill = async () => {
    if (!cartLines.length) {
      setError('Tap at least one menu item to generate a bill.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      const payload = {
        items: cartLines.map((line) => ({
          menu_item_id: line.menuItem.id,
          quantity: line.quantity,
        })),
      };

      const response = await apiRequest<{ order: GeneratedOrder }>('/orders/generate', {
        method: 'POST',
        token: tokenRequired,
        body: payload,
      });

      setGeneratedOrder(response.order);
      setCurrentOrderNumber(response.order.order_number);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate bill');
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async () => {
    if (!generatedOrder) {
      return;
    }

    try {
      setSaving(true);
      setError('');
      const response = await apiRequest<{ order: GeneratedOrder; nextOrderNumber: number }>(
        `/orders/${generatedOrder.id}/mark-paid`,
        {
          method: 'POST',
          token: tokenRequired,
        },
      );

      setGeneratedOrder({ ...generatedOrder, status: response.order.status });
      setCurrentOrderNumber(response.nextOrderNumber || currentOrderNumber + 1);
      setCart({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark order as paid');
    } finally {
      setSaving(false);
    }
  };

  const invoiceText = useMemo(() => {
    if (!generatedOrder) {
      return '';
    }

    const lines = generatedOrder.items.map((item) => `${item.name} x${item.quantity}`);
    return [
      `Order #${generatedOrder.order_number}`,
      ...lines,
      `Total Rs ${generatedOrder.total.toFixed(0)}`,
    ].join('\n');
  }, [generatedOrder]);

  const copyInvoice = async () => {
    if (!invoiceText) {
      return;
    }
    await navigator.clipboard.writeText(invoiceText);
  };

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

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

        <aside className="bg-[#181818] rounded-[20px] border border-white/10 p-4 md:p-6 flex flex-col gap-4">
          <h2 className="font-bebas text-4xl tracking-[3px] uppercase">Current Cart</h2>

          <div className="space-y-2 max-h-[300px] overflow-auto pr-1">
            {cartLines.length === 0 && <p className="text-white/50 text-sm">Tap menu buttons to add items.</p>}
            {cartLines.map((line) => (
              <div key={line.menuItem.id} className="flex justify-between items-center bg-black/20 border border-white/10 rounded-xl p-3">
                <div>
                  <p className="font-semibold text-[16px]">{line.menuItem.name}</p>
                  <p className="text-xs text-white/60">x{line.quantity}</p>
                </div>
                <p className="text-[#4ade80] font-bold text-lg">Rs {line.subtotal.toFixed(0)}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 pt-3 flex justify-between items-end">
            <p className="font-bebas text-3xl tracking-[2px]">Total</p>
            <p className="font-bebas text-5xl text-[#ef8f2f]">Rs {total.toFixed(0)}</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={clearCart}
              className="w-full rounded-2xl py-4 bg-[#2b2b2b] text-white text-lg font-semibold"
            >
              Clear Cart
            </button>
            <button
              onClick={generateBill}
              disabled={saving || cartLines.length === 0}
              className="w-full rounded-2xl py-4 bg-[#ef8f2f] text-[#121212] text-lg font-bold disabled:opacity-50"
            >
              {saving ? 'Please wait...' : 'Generate Bill'}
            </button>
            <button
              onClick={markPaid}
              disabled={saving || !generatedOrder || generatedOrder.status === 'paid'}
              className="w-full rounded-2xl py-4 bg-[#22c55e] text-[#09210f] text-lg font-bold disabled:opacity-50"
            >
              Mark Paid
            </button>
          </div>

          {generatedOrder && (
            <div className="mt-1 rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
              <p className="text-sm uppercase tracking-[2px] text-white/70">Invoice Preview</p>
              <pre className="text-xs whitespace-pre-wrap text-white/90 leading-relaxed">{invoiceText}</pre>
              <button
                onClick={() => void copyInvoice()}
                className="w-full mt-2 rounded-xl border border-white/20 py-2 text-sm uppercase tracking-wider"
              >
                Copy to Clipboard
              </button>
            </div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}
        </aside>
      </div>
    </main>
  );
}
