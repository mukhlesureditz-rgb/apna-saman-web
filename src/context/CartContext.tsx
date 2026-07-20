import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CartItem, Product } from '../lib/types';
import { sfx } from '../lib/sound';

interface CartContextValue {
  items: CartItem[];
  add: (product: Product, qty?: number) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  getItem: (productId: string) => CartItem | undefined;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

const STORAGE_KEY = 'apna-saman-cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const add: CartContextValue['add'] = (product, qty = 1) => {
    sfx.add();
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + qty } : i,
        );
      }
      return [...prev, { product, quantity: qty }];
    });
  };

  const remove: CartContextValue['remove'] = (productId) => {
    sfx.remove();
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const setQty: CartContextValue['setQty'] = (productId, qty) => {
    sfx.tap();
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.product.id !== productId)
        : prev.map((i) => (i.product.id === productId ? { ...i, quantity: qty } : i)),
    );
  };

  const clear = () => setItems([]);

  const getItem: CartContextValue['getItem'] = (productId) =>
    items.find((i) => i.product.id === productId);

  const count = useMemo(() => items.reduce((n, i) => n + i.quantity, 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0),
    [items],
  );

  return (
    <CartContext.Provider value={{ items, add, remove, setQty, clear, count, subtotal, getItem }}>
      {children}
    </CartContext.Provider>
  );
}
