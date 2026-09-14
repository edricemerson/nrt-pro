"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ProductImage } from "@/components/ProductImage";
import { useCart } from "@/components/CartProvider";
import { useAuth } from "@/components/AuthProvider";
import { AuthPromptModal } from "@/components/AuthPromptModal";
import { listProducts } from "@/lib/api";
import { formatIDR } from "@/lib/format";
import type { Product } from "@/lib/types";

export default function CartPage() {
  const { lines, setQty, remove } = useCart();
  const { customer, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  useEffect(() => {
    listProducts()
      .then(setProducts)
      .catch((err) => setError(err instanceof Error ? err.message : "Gagal memuat keranjang."))
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo(
    () =>
      lines
        .map((line) => ({ line, product: products.find((p) => p.id === line.productId) }))
        .filter((r): r is { line: typeof lines[number]; product: Product } => Boolean(r.product)),
    [lines, products],
  );

  const subtotal = rows.reduce((sum, r) => sum + r.product.price * r.line.qty, 0);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8" aria-hidden>
        <div className="skeleton h-7 w-40" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="card space-y-4 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="skeleton h-20 w-20 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-2/3" />
                  <div className="skeleton h-3 w-1/3" />
                  <div className="skeleton h-8 w-28" />
                </div>
              </div>
            ))}
          </div>
          <div className="skeleton h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="animate-fade-up text-2xl font-bold tracking-tight">Keranjang</h1>

      {error ? (
        <p
          role="alert"
          className="animate-shake mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : rows.length === 0 ? (
        <div className="animate-fade-up card mt-6 p-12 text-center">
          <p className="text-ink-600">Keranjang masih kosong.</p>
          <Link href="/buy" className="btn-primary mt-4">
            Mulai belanja
          </Link>
        </div>
      ) : (
        <div className="animate-fade-up mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="card divide-y divide-ink-200">
            {rows.map(({ line, product }, i) => (
              <div
                key={product.id}
                className="stagger animate-fade-up flex gap-4 p-4"
                style={{ "--i": i } as React.CSSProperties}
              >
                <Link
                  href={`/product/${product.slug}`}
                  className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-ink-200"
                >
                  <ProductImage images={product.images} name={product.name} sku={product.sku} />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/product/${product.slug}`}
                    className="font-medium leading-snug hover:text-brand-700"
                  >
                    {product.name}
                  </Link>
                  <p className="text-xs text-ink-500">
                    {product.spec ? `${product.spec} · ` : ""}Tipe {product.typeCode}
                  </p>
                  <p className="mt-1 text-sm font-semibold">{formatIDR(product.price)}</p>

                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex items-center rounded-lg border border-ink-300">
                      <button
                        className="px-2.5 py-1 text-ink-600 hover:bg-ink-100"
                        onClick={() => setQty(product.id, line.qty - 1)}
                        aria-label="Kurangi"
                      >
                        &minus;
                      </button>
                      <span
                        key={line.qty}
                        className="animate-fade-in w-10 border-x border-ink-300 py-1 text-center text-sm"
                      >
                        {line.qty}
                      </span>
                      <button
                        className="px-2.5 py-1 text-ink-600 hover:bg-ink-100 disabled:opacity-40"
                        onClick={() => setQty(product.id, line.qty + 1)}
                        disabled={line.qty >= product.stock}
                        aria-label="Tambah"
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="text-sm font-medium text-red-600 hover:underline"
                      onClick={() => remove(product.id)}
                    >
                      Hapus
                    </button>
                    {line.qty >= product.stock && (
                      <span className="text-xs text-amber-700">Sisa stok {product.stock}</span>
                    )}
                  </div>
                </div>
                <p className="shrink-0 text-right font-semibold">
                  {formatIDR(product.price * line.qty)}
                </p>
              </div>
            ))}
          </div>

          <aside className="card h-fit p-5">
            <h2 className="font-semibold">Ringkasan</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-600">
                  Subtotal ({rows.reduce((s, r) => s + r.line.qty, 0)} barang)
                </dt>
                <dd key={subtotal} className="animate-fade-in font-medium">
                  {formatIDR(subtotal)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-600">Ongkos kirim</dt>
                <dd className="text-ink-500">Dihitung saat checkout</dd>
              </div>
            </dl>
            <div className="mt-4 flex justify-between border-t border-ink-200 pt-4">
              <span className="font-semibold">Total sementara</span>
              <span key={subtotal} className="animate-fade-in text-lg font-bold">
                {formatIDR(subtotal)}
              </span>
            </div>
            {authLoading ? (
              <span className="btn-primary mt-5 w-full opacity-60" aria-hidden>
                Lanjut ke checkout
              </span>
            ) : customer ? (
              <Link href="/checkout" className="btn-primary mt-5 w-full">
                Lanjut ke checkout
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setShowAuthPrompt(true)}
                className="btn-primary mt-5 w-full"
              >
                Lanjut ke checkout
              </button>
            )}
            <Link href="/buy" className="btn-ghost mt-2 w-full">
              Tambah barang lain
            </Link>
          </aside>
        </div>
      )}

      {showAuthPrompt && (
        <AuthPromptModal
          onClose={() => setShowAuthPrompt(false)}
          message="Kamu perlu masuk atau membuat akun dulu sebelum checkout, supaya alamat dan nomor HP-mu otomatis terisi."
          next="/checkout"
        />
      )}
    </div>
  );
}
