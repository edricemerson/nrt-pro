import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { slugify } from "@/lib/format";
import type { CategoryId, Product, ProductInput } from "@/lib/types";

/**
 * Supabase-backed product queries. Route Handlers under src/app/api/products
 * call these; nothing else should import "@/lib/supabase" directly for
 * products, so the snake_case <-> camelCase mapping lives in exactly one place.
 */

interface ProductRow {
  id: string;
  slug: string;
  sku: string;
  name: string;
  spec: string;
  type_code: string;
  category_id: string;
  price: number;
  stock: number;
  pack_qty: number;
  pack_unit: "pcs" | "set";
  description: string;
  images: string[] | null;
  active: boolean;
}

const COLUMNS =
  "id, slug, sku, name, spec, type_code, category_id, price, stock, pack_qty, pack_unit, description, images, active";

function fromRow(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    sku: row.sku,
    name: row.name,
    spec: row.spec,
    typeCode: row.type_code,
    categoryId: row.category_id as CategoryId,
    price: row.price,
    stock: row.stock,
    packQty: row.pack_qty,
    packUnit: row.pack_unit,
    description: row.description,
    images: row.images ?? [],
    active: row.active,
  };
}

/** Only includes keys that were actually present in `input`, so a partial patch
 *  (e.g. quick-edit stock) does not overwrite the rest of the row with undefined. */
function toRow(input: Partial<ProductInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.sku !== undefined) row.sku = input.sku;
  if (input.name !== undefined) row.name = input.name;
  if (input.spec !== undefined) row.spec = input.spec;
  if (input.typeCode !== undefined) row.type_code = input.typeCode;
  if (input.categoryId !== undefined) row.category_id = input.categoryId;
  if (input.price !== undefined) row.price = input.price;
  if (input.stock !== undefined) row.stock = input.stock;
  if (input.packQty !== undefined) row.pack_qty = input.packQty;
  if (input.packUnit !== undefined) row.pack_unit = input.packUnit;
  if (input.description !== undefined) row.description = input.description;
  if (input.images !== undefined) row.images = input.images;
  if (input.active !== undefined) row.active = input.active;
  return row;
}

export async function listProducts(): Promise<Product[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("products")
    .select(COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as ProductRow[]).map(fromRow);
}

export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("products")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? fromRow(data as ProductRow) : null;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("products")
    .select(COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? fromRow(data as ProductRow) : null;
}

/** Appends "-2", "-3", ... until the slug is free. Products table is small
 *  (low hundreds of rows), so a few round trips beats a second DB feature. */
async function uniqueSlug(base: string): Promise<string> {
  const supabase = getSupabaseAdmin();
  let candidate = base;
  for (let i = 2; ; i += 1) {
    const { data, error } = await supabase
      .from("products")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return candidate;
    candidate = `${base}-${i}`;
  }
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const slug = await uniqueSlug(input.slug || slugify(input.sku, input.name));
  const { data, error } = await getSupabaseAdmin()
    .from("products")
    .insert({ ...toRow(input), slug })
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return fromRow(data as ProductRow);
}

export async function updateProduct(
  id: string,
  patch: Partial<ProductInput>,
): Promise<Product> {
  const { data, error } = await getSupabaseAdmin()
    .from("products")
    .update(toRow(patch))
    .eq("id", id)
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return fromRow(data as ProductRow);
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await getSupabaseAdmin().from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Atomic `stock = greatest(stock - qty, 0)` via the 0003 migration's RPC -
 *  see decrement_product_stock() for why this can't be a read-then-write. */
export async function decrementStock(id: string, qty: number): Promise<Product | null> {
  const { data, error } = await getSupabaseAdmin().rpc("decrement_product_stock", {
    p_id: id,
    p_qty: qty,
  });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  return row ? fromRow(row as ProductRow) : null;
}
