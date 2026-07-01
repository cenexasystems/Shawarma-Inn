import { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { MenuItem, CartItem, CartContextType } from '../types';
import { computeCheckoutTotals } from '../config/pricing';

// ─── State ────────────────────────────────────────────────────────────────────
interface CartState {
  items: CartItem[];
}

type Action =
  | { type: 'ADD_ITEM'; item: MenuItem }
  | { type: 'REMOVE_ITEM'; id: string | number }
  | { type: 'UPDATE_QTY'; id: string | number; qty: number }
  | { type: 'CLEAR' };

function cartReducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(ci => ci.id === action.item.id);
      if (existing) {
        return {
          items: state.items.map(ci =>
            ci.id === action.item.id
              ? { ...ci, qty: ci.qty + 1 }
              : ci
          ),
        };
      }
      return {
        items: [
          ...state.items,
          {
            id: action.item.id,
            name: action.item.name,
            price: action.item.price,
            image: action.item.image,
            qty: 1,
          },
        ],
      };
    }
    case 'REMOVE_ITEM':
      return { items: state.items.filter(ci => ci.id !== action.id) };
    case 'UPDATE_QTY':
      if (action.qty <= 0) {
        return { items: state.items.filter(ci => ci.id !== action.id) };
      }
      return {
        items: state.items.map(ci =>
          ci.id === action.id ? { ...ci, qty: action.qty } : ci
        ),
      };
    case 'CLEAR':
      return { items: [] };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
// ─── Context ──────────────────────────────────────────────────────────────────
const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = 'si_cart_v1';

function initCartState(initial: CartState): CartState {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as CartState;
    }
  } catch {
    // ignore
  }
  return initial;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] }, initCartState);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Cart-only total: sum of actual product prices. GST/delivery/packing are checkout-only.
  const subtotal = state.items.reduce(
    (sum, ci) => sum + ci.price * ci.qty,
    0
  );
  const itemCount = state.items.reduce((sum, ci) => sum + ci.qty, 0);

  const addItem = (item: MenuItem) => dispatch({ type: 'ADD_ITEM', item });
  const removeItem = (id: string | number) => dispatch({ type: 'REMOVE_ITEM', id });
  const updateQty = (id: string | number, qty: number) =>
    dispatch({ type: 'UPDATE_QTY', id, qty });
  const clearCart = () => dispatch({ type: 'CLEAR' });

  // Supabase-ready: auth/data calls can be wired here
  const buildWhatsAppUrl = (phone: string): string => {
    const totals = computeCheckoutTotals(subtotal);
    const lines = state.items.map(
      ci => `• ${ci.name} x${ci.qty} — ₹${ci.price * ci.qty}`
    );
    const text = [
      '🌯 *SHAWARMA INN ORDER*',
      '',
      ...lines,
      '',
      `Subtotal: ₹${totals.itemsTotal.toFixed(2)}`,
      `Delivery: ₹${totals.deliveryCharge.toFixed(2)}`,
      ...(totals.packingCharge > 0 ? [`Packing: ₹${totals.packingCharge.toFixed(2)}`] : []),
      ...(totals.gstEnabled ? [`GST (${totals.gstPercentage}%): ₹${totals.gst.toFixed(2)}`] : []),
      `*Total: ₹${totals.grandTotal.toFixed(2)}*`,
    ].join('\n');
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        itemCount,
        subtotal,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        buildWhatsAppUrl,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
