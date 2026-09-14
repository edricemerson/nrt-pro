"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ProductImage } from "@/components/ProductImage";
import { QuickEdit } from "@/components/QuickEdit";
import { CATEGORIES, categoryName } from "@/lib/categories";
import { listProducts, updatePrice, updateStock } from "@/lib/api";
import { formatIDR, formatNumber } from "@/lib/format";
import type { CategoryId, Product } from "@/lib/types";

const LOW_STOCK = 5;

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId | "semua">("semua");
  const [stockFilter, setStockFilter] = useState<"semua" | "menipis" | "habis">("semua");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    listProducts()
      .then(setProducts)
      .catch((err) => setError(err instanceof Error ? err.message : "Gagal memuat produk."))
      .finally(() => setLoading(false));
  }, []);

  function flash(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2000);
  }

  async function saveStock(product: Product, stock: number) {
    const updated = await updateStock(product.id, stock);
    setProducts((rows) => rows.map((r) => (r.id === updated.id ? updated : r)));
    flash(`Stok ${product.sku} jadi ${formatNumber(updated.stock)}`);
  }

  async function savePrice(product: Product, price: number) {
    const updated = await updatePrice(product.id, price);
    setProducts((rows) => rows.map((r) => (r.id === updated.id ? updated : r)));
    flash(`Harga ${product.sku} jadi ${formatIDR(updated.price)}`);
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== "semua" && p.categoryId !== category) return false;
      if (stockFilter === "habis" && p.stock !== 0) return false;
      if (stockFilter === "menipis" && (p.stock === 0 || p.stock > LOW_STOCK)) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.spec.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      );
    });
  }, [products, query, category, stockFilter]);

  const stats = useMemo(
    () => ({
      total: products.length,
      out: products.filter((p) => p.stock === 0).length,
      low: products.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK).length,
      value: products.reduce((sum, p) => sum + p.price * p.stock, 0),
    }),
    [products],
  );

  return (
    <div>
      <div className="animate-fade-up flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daftar Produk</h1>
          <p className="mt-1 text-sm text-ink-500">
            Klik angka stok atau harga untuk ubah cepat. Tombol Edit untuk foto, deskripsi,
            dan kategori.
          </p>
        </div>
        <Link href="/admin/products/new" className="btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Tambah Produk
        </Link>
      </div>

      {error && (
        <p
          role="alert"
          className="animate-shake mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total produk" value={formatNumber(stats.total)} delay={0} />
        <StatCard label="Stok menipis" value={formatNumber(stats.low)} tone="warn" delay={60} />
        <StatCard label="Stok habis" value={formatNumber(stats.out)} tone="danger" delay={120} />
        <StatCard label="Nilai stok" value={formatIDR(stats.value)} delay={180} />
      </div>

      <div className="animate-fade-up card mt-6 overflow-hidden" style={{ animationDelay: "220ms" }}>
        <div className="flex flex-col gap-3 border-b border-ink-200 p-4 sm:flex-row">
          <input
            className="input sm:flex-1"
            placeholder="Cari nama barang, tipe, atau SKU"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="input sm:w-56"
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryId | "semua")}
          >
            <option value="semua">Semua kategori</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            className="input sm:w-44"
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as typeof stockFilter)}
          >
            <option value="semua">Semua stok</option>
            <option value="menipis">Stok menipis</option>
            <option value="habis">Stok habis</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px]">
            <thead className="bg-ink-50">
              <tr>
                <th className="th w-14 text-right">No.</th>
                <th className="th">Nama Barang</th>
                <th className="th w-36 text-right">Stok</th>
                <th className="th w-44 text-right">Harga</th>
                <th className="th w-44">Kategori</th>
                <th className="th w-28 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} aria-hidden>
                    <td className="td" colSpan={6}>
                      <div className="skeleton h-10 w-full" />
                    </td>
                  </tr>
                ))}
              {!loading && visible.length === 0 && (
                <tr>
                  <td className="animate-fade-in td py-10 text-center text-ink-500" colSpan={6}>
                    Tidak ada produk yang cocok.
                  </td>
                </tr>
              )}
              {visible.map((p, i) => (
                <tr
                  key={p.id}
                  className="stagger animate-fade-up hover:bg-ink-50/60"
                  style={{ "--i": i } as React.CSSProperties}
                >
                  <td className="td text-right tabular-nums text-ink-500">{i + 1}</td>
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-ink-200">
                        <ProductImage images={p.images} name={p.name} sku={p.sku} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium leading-snug">{p.name}</p>
                        <p className="text-xs text-ink-500">
                          {p.spec ? `${p.spec} · ` : ""}Tipe {p.typeCode} · SKU {p.sku}
                          {!p.active && (
                            <span className="badge ml-2 bg-ink-100 text-ink-600">Nonaktif</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="td">
                    <QuickEdit
                      value={p.stock}
                      danger={p.stock === 0}
                      suffix={p.packUnit}
                      width="w-20"
                      onSave={(next) => saveStock(p, next)}
                    />
                  </td>
                  <td className="td">
                    <QuickEdit
                      value={p.price}
                      prefix="Rp "
                      width="w-28"
                      onSave={(next) => savePrice(p, next)}
                    />
                  </td>
                  <td className="td">
                    <span className="badge bg-ink-100 text-ink-700">
                      {categoryName(p.categoryId)}
                    </span>
                  </td>
                  <td className="td text-right">
                    <Link href={`/admin/products/${p.id}`} className="btn-secondary btn-sm">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-3.5 w-3.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                        />
                      </svg>
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && (
          <div className="border-t border-ink-200 px-4 py-3 text-sm text-ink-500">
            Menampilkan {visible.length} dari {products.length} produk.
          </div>
        )}
      </div>

      {toast && (
        <div
          key={toast}
          className="animate-fade-up fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-ink-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
  delay = 0,
}: {
  label: string;
  value: string;
  tone?: "warn" | "danger";
  delay?: number;
}) {
  const color =
    tone === "danger" ? "text-red-600" : tone === "warn" ? "text-amber-600" : "text-ink-900";
  return (
    <div className="animate-fade-up card p-4" style={{ animationDelay: `${delay}ms` }}>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
