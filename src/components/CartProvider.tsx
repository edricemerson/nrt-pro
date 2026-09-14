"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CartLine } from "@/lib/types";

const KEY = "nrtpro.cart.v1";

interface CartContextValue {
  lines: CartLine[];
  count: number;
  add: (productId: string, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch {
      /* ignore */
    }
  }, []);

  const persist = useCallback((next: CartLine[]) => {
    setLines(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const add = useCallback(
    (productId: string, qty = 1) => {
      setLines((current) => {
        const existing = current.find((l) => l.productId === productId);
        const next = existing
          ? current.map((l) =>
              l.productId === productId ? { ...l, qty: l.qty + qty } : l,
            )
          : [...current, { productId, qty }];
        try {
          window.localStorage.setItem(KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [],
  );

  const setQty = useCallback(
    (productId: string, qty: number) => {
      persist(
        qty <= 0
          ? lines.filter((l) => l.productId !== productId)
          : lines.map((l) => (l.productId === productId ? { ...l, qty } : l)),
      );
    },
    [lines, persist],
  );

  const remove = useCallback(
    (productId: string) => persist(lines.filter((l) => l.productId !== productId)),
    [lines, persist],
  );

  const clear = useCallback(() => persist([]), [persist]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: lines.reduce((sum, l) => sum + l.qty, 0),
      add,
      setQty,
      remove,
      clear,
    }),
    [lines, add, setQty, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart harus dipakai di dalam <CartProvider>");
  return ctx;
}
