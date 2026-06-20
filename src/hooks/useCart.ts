import { useState, useEffect } from 'react';

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
  
  const subtotal = cart.reduce((s,i) => s + i.price * i.qty, 0);
  const gst = subtotal * 0.05;
  const total = subtotal + gst;
  const count = cart.reduce((s,i) => s + i.qty, 0);
  
  const buildWhatsAppUrl = (phone: string) => {
    const text = `New Order!\n${cart.map(c => `${c.qty}x ${c.name}`).join('\n')}\nTotal: ₹${total}`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };
  
  return { cart, addItem, removeItem, updateQty, clearCart, subtotal, gst, total, count, buildWhatsAppUrl };
};
