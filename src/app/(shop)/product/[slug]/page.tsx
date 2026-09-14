"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ProductImage } from "@/components/ProductImage";
import { useCart } from "@/components/CartProvider";
import { categoryName } from "@/lib/categories";
import { getProductBySlug } from "@/lib/api";
import { formatIDR } from "@/lib/format";
import type { Product } from "@/lib/types";

export default function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);
  const { add } = useCart();

  useEffect(() => {
    setLoading(true);
    setError(null);
    getProductBySlug(slug)
      .then(setProduct)
      .catch((err) => setError(err instanceof Error ? err.message : "Gagal memuat produk."))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8" aria-hidden>
        <div className="skeleton h-4 w-40" />
        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div className="skeleton aspect-square" />
          <div className="space-y-4">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton h-8 w-3/4" />
            <div className="skeleton h-8 w-1/3" />
            <div className="skeleton h-24 w-full" />
            <div className="skeleton h-10 w-48" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-up mx-auto max-w-6xl px-4 py-24 text-center">
        <h1 className="text-xl font-semibold">Gagal memuat produk</h1>
        <p className="mt-2 text-sm text-red-600">{error}</p>
        <Link href="/buy" className="btn-secondary mt-4">
          Kembali ke katalog
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="animate-fade-up mx-auto max-w-6xl px-4 py-24 text-center">
        <h1 className="text-xl font-semibold">Barang tidak ditemukan</h1>
        <Link href="/buy" className="btn-secondary mt-4">
          Kembali ke katalog
        </Link>
      </div>
    );
  }

  function handleAdd() {
    if (!product) return;
    add(product.id, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="text-sm text-ink-500">
        <Link href="/buy" className="hover:text-brand-700">
          Katalog
        </Link>
        <span className="mx-2">/</span>
        <span>{categoryName(product.categoryId)}</span>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="animate-fade-up">
          <div key={activeImage} className="card animate-scale-in aspect-square overflow-hidden">
            <ProductImage
              images={product.images.slice(activeImage)}
              name={product.name}
              sku={product.sku}
            />
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {product.images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`h-16 w-16 overflow-hidden rounded-lg border-2 transition-all duration-150 ${
                    i === activeImage
                      ? "border-brand-600 scale-105"
                      : "border-ink-200 hover:border-ink-400"
                  }`}
                >
                  <ProductImage images={[src]} name={product.name} sku={product.sku} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="animate-fade-up" style={{ animationDelay: "80ms" }}>
          <p className="text-sm font-medium uppercase tracking-wide text-brand-700">
            {categoryName(product.categoryId)}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            {product.name}
          </h1>
          {product.spec && <p className="mt-1 text-ink-600">{product.spec}</p>}

          <p className="mt-5 text-3xl font-bold">{formatIDR(product.price)}</p>

          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 border-y border-ink-200 py-5 text-sm">
            <div>
              <dt className="text-ink-500">Tipe</dt>
              <dd className="font-medium">{product.typeCode}</dd>
            </div>
            <div>
              <dt className="text-ink-500">SKU</dt>
              <dd className="font-medium">{product.sku}</dd>
            </div>
            <div>
              <dt className="text-ink-500">Isi per dos</dt>
              <dd className="font-medium">
                {product.packQty} {product.packUnit}
              </dd>
            </div>
            <div>
              <dt className="text-ink-500">Stok</dt>
              <dd className={product.stock > 0 ? "font-medium text-emerald-700" : "font-medium text-red-600"}>
                {product.stock > 0 ? `${product.stock} ${product.packUnit}` : "Habis"}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-lg border border-ink-300">
              <button
                className="px-3 py-2 text-lg text-ink-600 hover:bg-ink-100 disabled:opacity-40"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                aria-label="Kurangi jumlah"
              >
                &minus;
              </button>
              <input
                type="number"
                className="w-14 border-x border-ink-300 py-2 text-center text-sm outline-none"
                value={qty}
                min={1}
                max={Math.max(1, product.stock)}
                onChange={(e) =>
                  setQty(Math.min(Math.max(1, Number(e.target.value) || 1), product.stock || 1))
                }
              />
              <button
                className="px-3 py-2 text-lg text-ink-600 hover:bg-ink-100 disabled:opacity-40"
                onClick={() => setQty((q) => Math.min(product.stock || 1, q + 1))}
                disabled={qty >= product.stock}
                aria-label="Tambah jumlah"
              >
                +
              </button>
            </div>
            <button
              className={`btn-primary px-6 disabled:bg-ink-300 ${
                added ? "animate-pop bg-emerald-600 hover:bg-emerald-600" : ""
              }`}
              onClick={handleAdd}
              disabled={product.stock === 0}
            >
              {added ? "Masuk keranjang" : "Tambah ke keranjang"}
            </button>
            <Link href="/cart" className="btn-secondary">
              Lihat keranjang
            </Link>
          </div>

          <div className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
              Deskripsi
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-700">
              {product.description ||
                "Belum ada deskripsi untuk barang ini. Admin dapat menambahkannya lewat halaman edit produk."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
