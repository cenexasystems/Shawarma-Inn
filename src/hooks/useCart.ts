import { useState, useEffect } from 'react';
import type { CheckoutTotals } from '../config/pricing';

export interface CartItem {
  id: string | number;
  name: string;
  price: number;
  qty: number;
  image?: string;
}

const STORAGE_KEY = 'si_cart';

function loadCart(): CartItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>(loadCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const addItem = (item: any) => setCart(prev => {
    const ex = prev.find(i => i.id === item.id);
    return ex ? prev.map(i => i.id === item.id ? {...i, qty: i.qty+1} : i) : [...prev, {...item, qty:1}];
  });

  const removeItem = (id: string | number) => setCart(prev => prev.filter(i => i.id !== id));

  const updateQty = (id: string | number, qty: number) => qty <= 0
    ? removeItem(id)
    : setCart(prev => prev.map(i => i.id === id ? {...i, qty} : i));

  const clearCart = () => setCart([]);

  // Cart-only total: sum of actual product prices. No GST/fees here — those are checkout-only.
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);

  const buildWhatsAppUrl = (phone: string, totals: CheckoutTotals) => {
    const itemLines = cart.map(c => `${c.name} x${c.qty} = ₹${(c.price * c.qty).toFixed(2)}`);

    const lines = [
      'Order Summary',
      '',
      ...itemLines,
      '',
      `Subtotal = ₹${totals.itemsTotal.toFixed(2)}`,
    ];

    if (totals.discount > 0) {
      lines.push(`Coupon (${totals.couponCode}) = -₹${totals.discount.toFixed(2)}`);
    }

    lines.push(`Delivery = ₹${totals.deliveryCharge.toFixed(2)}`);

    if (totals.packingCharge > 0) {
      lines.push(`Packing = ₹${totals.packingCharge.toFixed(2)}`);
    }

    if (totals.gstEnabled) {
      lines.push(`GST = ₹${totals.gst.toFixed(2)}`);
    }

    lines.push('', `Grand Total = ₹${totals.grandTotal.toFixed(2)}`);

    return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`;
  };

  return { cart, addItem, removeItem, updateQty, clearCart, subtotal, count, buildWhatsAppUrl };
};
