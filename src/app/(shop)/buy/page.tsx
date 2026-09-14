"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ProductImage } from "@/components/ProductImage";
import { useCart } from "@/components/CartProvider";
import { CATEGORIES, categoryName } from "@/lib/categories";
import { listProducts } from "@/lib/api";
import { formatIDR } from "@/lib/format";
import type { CategoryId, Product } from "@/lib/types";

type SortKey = "nama" | "harga-asc" | "harga-desc";

export default function BuyPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<CategoryId | "semua">("semua");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("nama");
  const { add } = useCart();
  const [justAdded, setJustAdded] = useState<string | null>(null);

  useEffect(() => {
    listProducts()
      .then((rows) => setProducts(rows.filter((p) => p.active)))
      .catch((err) => setError(err instanceof Error ? err.message : "Gagal memuat katalog."))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) map.set(p.categoryId, (map.get(p.categoryId) ?? 0) + 1);
    return map;
  }, [products]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = products.filter((p) => {
      if (category !== "semua" && p.categoryId !== category) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.spec.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.typeCode.toLowerCase().includes(q)
      );
    });

    return rows.sort((a, b) => {
      if (sort === "harga-asc") return a.price - b.price;
      if (sort === "harga-desc") return b.price - a.price;
      return a.name.localeCompare(b.name) || a.spec.localeCompare(b.spec);
    });
  }, [products, category, query, sort]);

  function handleAdd(product: Product) {
    add(product.id, 1);
    setJustAdded(product.id);
    window.setTimeout(() => setJustAdded(null), 1200);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="animate-fade-up text-2xl font-bold tracking-tight">Semua Produk</h1>
      <p className="animate-fade-up mt-1 text-sm text-ink-500" style={{ animationDelay: "60ms" }}>
        Cari dan pilih barang yang ingin dibeli.
      </p>

      <div
        className="animate-fade-up mt-6 flex flex-col gap-3 sm:flex-row sm:items-center"
        style={{ animationDelay: "120ms" }}
      >
        <div className="relative flex-1">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            className="input pl-9"
            placeholder="Cari nama barang atau tipe, misal: HR28 HD"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="input sm:w-52"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
        >
          <option value="nama">Urutkan: Nama</option>
          <option value="harga-asc">Harga terendah</option>
          <option value="harga-desc">Harga tertinggi</option>
        </select>
      </div>

      <div className="animate-fade-up mt-4 flex flex-wrap gap-2" style={{ animationDelay: "180ms" }}>
        <CategoryChip
          active={category === "semua"}
          onClick={() => setCategory("semua")}
          label="Semua"
          count={products.length}
        />
        {CATEGORIES.map((c) => (
          <CategoryChip
            key={c.id}
            active={category === c.id}
            onClick={() => setCategory(c.id)}
            label={c.name}
            count={counts.get(c.id) ?? 0}
          />
        ))}
      </div>

      {loading ? (
        <ProductGridSkeleton />
      ) : error ? (
        <p
          role="alert"
          className="animate-shake mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : visible.length === 0 ? (
        <p className="animate-fade-in py-16 text-center text-sm text-ink-500">
          Tidak ada barang yang cocok dengan pencarian.
        </p>
      ) : (
        <>
          <p className="animate-fade-in mt-6 text-sm text-ink-500">
            Menampilkan {visible.length} barang
            {category !== "semua" ? ` di kategori ${categoryName(category)}` : ""}.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4 sm:grid-cols-3">
            {visible.map((p, i) => (
              <article
                key={p.id}
                // `key` on the filter state restarts the entrance when the list
                // changes, so filtering re-animates instead of snapping.
                className="card hover-lift animate-fade-up stagger group flex flex-col overflow-hidden"
                style={{ "--i": i } as React.CSSProperties}
              >
                <Link href={`/product/${p.slug}`} className="block aspect-square overflow-hidden">
                  <div className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-105">
                    <ProductImage images={p.images} name={p.name} sku={p.sku} />
                  </div>
                </Link>
                <div className="flex flex-1 flex-col p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-brand-700">
                    {categoryName(p.categoryId)}
                  </p>
                  <Link
                    href={`/product/${p.slug}`}
                    className="mt-1 line-clamp-2 text-sm font-semibold leading-snug hover:text-brand-700"
                  >
                    {p.name}
                  </Link>
                  {p.spec && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-ink-500">{p.spec}</p>
                  )}
                  <p className="mt-2 text-base font-bold">{formatIDR(p.price)}</p>
                  <p className="mt-0.5 text-xs text-ink-500">
                    Tipe {p.typeCode} &middot;{" "}
                    {p.stock > 0 ? (
                      <span className="text-emerald-700">Stok {p.stock}</span>
                    ) : (
                      <span className="text-red-600">Stok habis</span>
                    )}
                  </p>
                  <button
                    className={`btn-primary mt-3 w-full disabled:bg-ink-300 ${
                      justAdded === p.id ? "animate-pop bg-emerald-600 hover:bg-emerald-600" : ""
                    }`}
                    disabled={p.stock === 0}
                    onClick={() => handleAdd(p)}
                  >
                    {justAdded === p.id ? "Ditambahkan" : "Tambah ke keranjang"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** Placeholder grid shown while the catalog loads, matching the card shape. */
function ProductGridSkeleton() {
  return (
    <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4 sm:grid-cols-3" aria-hidden>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="card overflow-hidden p-0">
          <div className="skeleton aspect-square rounded-none" />
          <div className="space-y-2 p-3">
            <div className="skeleton h-2.5 w-1/3" />
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-2/3" />
            <div className="skeleton h-4 w-1/2" />
            <div className="skeleton h-8 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "border-brand-600 bg-brand-600 text-white"
          : "border-ink-200 bg-white text-ink-700 hover:border-ink-300 hover:bg-ink-100"
      }`}
    >
      {label}
      <span className={active ? "ml-1.5 text-brand-100" : "ml-1.5 text-ink-400"}>{count}</span>
    </button>
  );
}
