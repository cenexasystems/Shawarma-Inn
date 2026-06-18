import { useState } from 'react';
import type { CartItem } from '../types';
import type { Order } from './RecentOrders';
import { shouldUseSupabase, checkSupabaseHealth } from '../lib/supabaseMigration';
import { supabase } from '../lib/supabaseClient';

interface InvoiceProps {
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  onClose: () => void;
  onMarkPaid: () => void;
}

export default function Invoice({
  items,
  subtotal,
  tax,
  discount,
  total,
  orderType,
  onClose,
  onMarkPaid,
}: InvoiceProps) {
  const [invoiceNumber] = useState(() => {
    const stored = localStorage.getItem('si_invoice_counter');
    const next = (parseInt(stored || '100', 10) + 1).toString();
    localStorage.setItem('si_invoice_counter', next);
    return next;
  });

  const now = new Date();
  const date = now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const time = now.toLocaleTimeString('en-IN');

  const orderTypeLabel = {
    'dine-in': 'Dine In',
    'takeaway': 'Takeaway',
    'delivery': 'Delivery',
  }[orderType];

  const handleDownloadReceipt = () => {
    const lines = [
      'SHAWARMA INN',
      '----------------------------------------',
      `Invoice #: ${invoiceNumber}`,
      `Date: ${date}`,
      `Time: ${time}`,
      `Order Type: ${orderTypeLabel}`,
      '----------------------------------------',
      ...items.map((item) => `${item.name} x${item.qty} = Rs ${(item.price * item.qty).toFixed(2)}`),
      '----------------------------------------',
      `Subtotal: Rs ${subtotal.toFixed(2)}`,
      `Discount (${discount}%): -Rs ${(subtotal * (discount / 100)).toFixed(2)}`,
      `Tax (5%): Rs ${tax.toFixed(2)}`,
      `TOTAL: Rs ${total.toFixed(2)}`,
      '----------------------------------------',
      'Thank you for dining with us!',
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `shawarma-inn-receipt-${invoiceNumber}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleMarkPaid = async () => {
    // Save order to localStorage (primary)
    const order: Order = {
      id: invoiceNumber,
      itemsText: items.map(item => `${item.name} (${item.qty})`).join(', '),
      total,
      status: 'PAID',
      timestamp: now.getTime(),
      items: items.map(item => ({ name: item.name, qty: item.qty })),
      subtotal,
      discount,
      tax,
      orderType,
    };

    try {
      // Always save to localStorage (this is backup and primary for POS)
      const stored = localStorage.getItem('shawarmainn_orders');
      const existing: Order[] = stored ? JSON.parse(stored) : [];
      existing.push(order);
      localStorage.setItem('shawarmainn_orders', JSON.stringify(existing));

      // Dual-write to Supabase if available (background sync)
      if (shouldUseSupabase()) {
        try {
          const isHealthy = await checkSupabaseHealth();
          if (isHealthy) {
            await supabase.from('orders').insert({
              id: invoiceNumber,
              user_id: 'pos-user',
              items: items.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.qty,
                subtotal: item.price * item.qty,
              })),
              total,
              status: 'PAID',
              created_at: now.toISOString(),
            });
          }
        } catch (supabaseError) {
          // Supabase write failed but localStorage succeeded
          console.info('Order saved to localStorage; Supabase sync pending:', supabaseError);
        }
      }
    } catch (err) {
      console.error('Failed to save order to localStorage:', err);
    }

    // Call original callback
    onMarkPaid();
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md max-h-[90vh] bg-[#111111] rounded-3xl shadow-2xl border border-white/10 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="font-bebas text-2xl tracking-widest text-[var(--red)]">INVOICE</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-all text-white/50 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div id="invoice-print-area" className="flex-1 overflow-y-auto p-6 space-y-4 font-body text-sm print:bg-white print:text-black">
          {/* Restaurant Header */}
          <div className="text-center border-b border-white/10 pb-4 print:border-black">
            <h1 className="font-bebas text-3xl tracking-widest text-[var(--red)] mb-1 print:text-black">SHAWARMA INN</h1>
            <p className="text-white/60 text-xs tracking-widest uppercase print:text-black/60">The Heart of Flame-Grilled Perfection</p>
            <p className="text-white/40 text-xs mt-2 print:text-black/40">Mathur, Chennai | +91 XXXXX XXXXX</p>
          </div>

          {/* Invoice Meta */}
          <div className="grid grid-cols-2 gap-3 text-xs text-white/70 print:text-black/70 pb-3 border-b border-white/10 print:border-black/10">
            <div>
              <span className="text-white/40 print:text-black/40">Invoice #</span>
              <p className="font-bold text-white print:text-black">{invoiceNumber}</p>
            </div>
            <div>
              <span className="text-white/40 print:text-black/40">Date</span>
              <p className="font-bold text-white print:text-black">{date}</p>
            </div>
            <div>
              <span className="text-white/40 print:text-black/40">Time</span>
              <p className="font-bold text-white print:text-black">{time}</p>
            </div>
            <div>
              <span className="text-white/40 print:text-black/40">Order Type</span>
              <p className="font-bold text-[var(--red)] print:text-red-600">{orderTypeLabel}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-2 py-3 border-b border-white/10 print:border-black/10">
            <div className="grid grid-cols-4 gap-2 text-xs font-bold text-white/60 print:text-black/60 mb-2">
              <span className="col-span-2">Item</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Amt</span>
            </div>
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} className="grid grid-cols-4 gap-2 text-xs text-white print:text-black">
                  <span className="col-span-2 truncate">{item.name}</span>
                  <span className="text-right font-bold">{item.qty}</span>
                  <span className="text-right font-bold">₹{(item.price * item.qty).toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-2 py-3 border-b border-white/10 print:border-black/10 text-xs">
            <div className="flex justify-between text-white/70 print:text-black/70">
              <span>Subtotal</span>
              <span className="font-bold">₹{subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-red-400 print:text-red-600">
                <span>Discount ({discount}%)</span>
                <span className="font-bold">-₹{(subtotal * (discount / 100)).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-white/70 print:text-black/70">
              <span>Tax (5%)</span>
              <span className="font-bold">₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bebas text-[var(--red)] print:text-red-600 py-2 border-t border-white/10 print:border-black/10">
              <span className="uppercase tracking-wider">Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-white/50 print:text-black/50 pt-3">
            <p className="italic">Thank you for dining with us!</p>
            <p className="mt-2 text-[10px]">Please check your order before leaving.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-white/10 p-4 grid grid-cols-3 gap-3 print:hidden">
          <button
            onClick={handleDownloadReceipt}
            className="bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg font-bebas text-sm tracking-wider uppercase transition-all active:scale-95"
          >
            ⬇ Receipt
          </button>
          <button
            onClick={() => {
              const invoiceElement = document.getElementById('invoice-print-area');
              if (invoiceElement) {
                window.print();
              }
            }}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg font-bebas text-sm tracking-wider uppercase transition-all active:scale-95"
          >
            🖨️ Print/PDF
          </button>
          <button
            onClick={handleMarkPaid}
            className="flex-1 bg-[var(--red)] hover:bg-red-600 text-white py-3 rounded-lg font-bebas text-sm tracking-wider uppercase transition-all active:scale-95 shadow-lg"
          >
            ✓ Mark Paid
          </button>
        </div>
      </div>

      {/* Print Stylesheet */}
      <style>{`
        @media print {
          body > *:not(#invoice-print-area) {
            display: none !important;
          }
          html, body {
            background: white !important;
            color: black !important;
          }
          #invoice-print-area {
            display: block !important;
            color: black !important;
            background: white !important;
            border: none !important;
            margin: 0 !important;
            padding: 20px !important;
          }
        }
      `}</style>
    </div>
  );
}
