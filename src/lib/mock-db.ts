/**
 * In-browser mock database. Orders and settings have no backing Supabase
 * table yet, so they still live in localStorage here. Products and customer
 * accounts used to as well, but now come from Supabase - see lib/db/products.ts
 * and lib/db/customers.ts, and the Route Handlers under src/app/api/*.
 *
 * This file is throwaway: once orders/settings move to Supabase too, delete it
 * and point the rest of lib/api.ts at fetch() the same way products and
 * customers already are. Nothing outside lib/api.ts imports from here.
 */

import { SEED_ORDERS } from "@/data/orders";
import type { Order, Settings } from "@/lib/types";

const KEY_ORDERS = "nrtpro.orders.v1";
const KEY_SETTINGS = "nrtpro.settings.v1";

export const DEFAULT_SETTINGS: Settings = {
  storeName: "NRTPRO Tools",
  bankName: "BCA",
  bankAccountNo: "1234567890",
  bankAccountName: "PT Nurtanio Pro Perkakas",
  paymentFeePercent: 2.9,
  paymentFeeFlat: 2000,
  marketplaceFeePercent: 5,
};

const isBrowser = () => typeof window !== "undefined";

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      window.localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("nrtpro:changed", { detail: key }));
  } catch {
    /* quota exceeded - ignore in the prototype */
  }
}

export const db = {
  orders: {
    all: () => read<Order[]>(KEY_ORDERS, SEED_ORDERS),
    save: (rows: Order[]) => write(KEY_ORDERS, rows),
  },
  settings: {
    get: () => read<Settings>(KEY_SETTINGS, DEFAULT_SETTINGS),
    save: (value: Settings) => write(KEY_SETTINGS, value),
  },
  reset: () => {
    if (!isBrowser()) return;
    window.localStorage.removeItem(KEY_ORDERS);
    window.localStorage.removeItem(KEY_SETTINGS);
    window.dispatchEvent(new CustomEvent("nrtpro:changed", { detail: "reset" }));
  },
};

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}
