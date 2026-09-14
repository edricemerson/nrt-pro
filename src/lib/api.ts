/**
 * Data access layer. This is the ONLY file that knows where data comes from.
 *
 * Products and customer accounts are wired to Supabase via the Next.js Route
 * Handlers under src/app/api/* (see src/lib/db/products.ts and
 * src/lib/db/customers.ts for the actual queries). Orders and settings have
 * no backing table yet (no migration for them exists), so those still
 * read/write the localStorage mock in lib/mock-db.ts until that schema exists.
 */

import { db, newId } from "@/lib/mock-db";
import type {
  Customer,
  DeliveryProfile,
  Order,
  OrderStatus,
  Product,
  ProductInput,
  RegisterInput,
  Settings,
} from "@/lib/types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

/** Simulates network latency so loading states are visible during development. */
const tick = () => new Promise<void>((r) => setTimeout(r, 60));

/* ------------------------------------------------------------------ products */

async function extractError(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    return typeof body?.error === "string" ? body.error : fallback;
  } catch {
    return fallback;
  }
}

/** GET /api/products */
export async function listProducts(): Promise<Product[]> {
  const res = await fetch("/api/products", { cache: "no-store" });
  if (!res.ok) throw new Error(await extractError(res, "Gagal memuat produk."));
  const { products } = (await res.json()) as { products: Product[] };
  return products;
}

/** GET /api/products/slug/:slug */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const res = await fetch(`/api/products/slug/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await extractError(res, "Gagal memuat produk."));
  const { product } = (await res.json()) as { product: Product | null };
  return product;
}

/** GET /api/products/:id */
export async function getProduct(id: string): Promise<Product | null> {
  const res = await fetch(`/api/products/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await extractError(res, "Gagal memuat produk."));
  const { product } = (await res.json()) as { product: Product | null };
  return product;
}

/** POST /api/products */
export async function createProduct(input: ProductInput): Promise<Product> {
  const res = await fetch("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await extractError(res, "Gagal menyimpan produk."));
  const { product } = (await res.json()) as { product: Product };
  return product;
}

/** PATCH /api/products/:id */
export async function updateProduct(
  id: string,
  patch: Partial<ProductInput>,
): Promise<Product> {
  const res = await fetch(`/api/products/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(await extractError(res, "Gagal menyimpan perubahan."));
  const { product } = (await res.json()) as { product: Product };
  return product;
}

/** PATCH /api/products/:id  { stock } - dipakai tombol quick edit stok */
export async function updateStock(id: string, stock: number): Promise<Product> {
  return updateProduct(id, { stock: Math.max(0, Math.round(stock)) });
}

/** PATCH /api/products/:id  { price } - dipakai tombol quick edit harga */
export async function updatePrice(id: string, price: number): Promise<Product> {
  return updateProduct(id, { price: Math.max(0, Math.round(price)) });
}

/** DELETE /api/products/:id */
export async function deleteProduct(id: string): Promise<void> {
  const res = await fetch(`/api/products/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await extractError(res, "Gagal menghapus produk."));
}

/**
 * POST /api/products/:id/decrement-stock - called once per line item when an
 * order is placed. Intentionally best-effort: if a decrement fails the order
 * still exists (see createOrder below) and stock can be corrected by hand from
 * the admin product list.
 */
async function decrementStock(id: string, qty: number): Promise<void> {
  await fetch(`/api/products/${encodeURIComponent(id)}/decrement-stock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ qty }),
  });
}

/* -------------------------------------------------------------------- orders */

/** GET /api/orders */
export async function listOrders(): Promise<Order[]> {
  await tick();
  return db.orders
    .all()
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** GET /api/orders?customer_id=:id - order history on the profile page. */
export async function listOrdersByCustomer(customerId: string): Promise<Order[]> {
  await tick();
  return db.orders
    .all()
    .filter((o) => o.customerId === customerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** GET /api/orders/:id */
export async function getOrder(id: string): Promise<Order | null> {
  await tick();
  return db.orders.all().find((o) => o.id === id) ?? null;
}

/**
 * POST /api/orders
 *
 * The order record itself still lives in the localStorage mock (no `orders`
 * migration exists yet), but stock now lives in Supabase, so decrementing it
 * is a separate network call per line item rather than one atomic transaction
 * with the order insert. Each call is itself atomic (see decrementStock /
 * decrement_product_stock in 0003), so concurrent checkouts cannot both "win"
 * a lost-update race - but an order can still end up recorded with its stock
 * not decremented if a call fails outright. Fixing that for good means moving
 * orders into Supabase too and doing both in one server-side request.
 */
export async function createOrder(
  input: Omit<Order, "id" | "orderNo" | "createdAt" | "status"> & {
    status?: OrderStatus;
  },
): Promise<Order> {
  await tick();
  const rows = db.orders.all();
  const now = new Date();
  const seq = String(rows.length + 1).padStart(4, "0");
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;

  const order: Order = {
    ...input,
    id: newId("ord"),
    orderNo: `INV/${ym}/${seq}`,
    status: input.status ?? "menunggu_pembayaran",
    createdAt: now.toISOString(),
  };
  db.orders.save([order, ...rows]);

  await Promise.all(order.items.map((item) => decrementStock(item.productId, item.qty)));

  return order;
}

/** PATCH /api/orders/:id  { status } */
export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<Order> {
  await tick();
  const rows = db.orders.all();
  const index = rows.findIndex((o) => o.id === id);
  if (index === -1) throw new Error(`Pesanan ${id} tidak ditemukan`);
  rows[index] = { ...rows[index], status };
  db.orders.save(rows);
  return rows[index];
}

/* ----------------------------------------------------------------- customers */

/** POST /api/auth/register */
export async function registerCustomer(input: RegisterInput): Promise<Customer> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await extractError(res, "Gagal mendaftar."));
  const { customer } = (await res.json()) as { customer: Customer };
  return customer;
}

/** POST /api/auth/login */
export async function signIn(email: string, password: string): Promise<Customer> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await extractError(res, "Gagal masuk."));
  const { customer } = (await res.json()) as { customer: Customer };
  return customer;
}

/** POST /api/auth/logout */
export async function signOut(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

/** GET /api/auth/me */
export async function getCurrentCustomer(): Promise<Customer | null> {
  const res = await fetch("/api/auth/me", { cache: "no-store" });
  if (!res.ok) return null;
  const { customer } = (await res.json()) as { customer: Customer | null };
  return customer;
}

/** PUT /api/customers/:id/password */
export async function changePassword(
  id: string,
  currentPassword: string,
  nextPassword: string,
): Promise<void> {
  const res = await fetch(`/api/customers/${encodeURIComponent(id)}/password`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, nextPassword }),
  });
  if (!res.ok) throw new Error(await extractError(res, "Gagal mengubah kata sandi."));
}

/** PATCH /api/customers/:id - update delivery details without touching the password. */
export async function updateDeliveryProfile(
  id: string,
  patch: Partial<DeliveryProfile>,
): Promise<Customer> {
  const res = await fetch(`/api/customers/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(await extractError(res, "Gagal menyimpan perubahan."));
  const { customer } = (await res.json()) as { customer: Customer };
  return customer;
}

/* ------------------------------------------------------------------ settings */

/** GET /api/settings */
export async function getSettings(): Promise<Settings> {
  await tick();
  return db.settings.get();
}

/** PUT /api/settings */
export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  await tick();
  const next = { ...db.settings.get(), ...patch };
  db.settings.save(next);
  return next;
}

/** Prototype only - wipes localStorage and restores the seed data. */
export async function resetDemoData(): Promise<void> {
  db.reset();
}
