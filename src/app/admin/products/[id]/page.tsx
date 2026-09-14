"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { ProductForm } from "@/components/ProductForm";
import { deleteProduct, getProduct, updateProduct } from "@/lib/api";
import type { Product } from "@/lib/types";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProduct(id)
      .then(setProduct)
      .catch((err) => setError(err instanceof Error ? err.message : "Gagal memuat produk."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div aria-hidden>
        <div className="skeleton h-4 w-32" />
        <div className="skeleton mt-3 h-8 w-64" />
        <div className="skeleton mt-6 h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-up py-16">
        <h1 className="text-xl font-semibold">Gagal memuat produk</h1>
        <p className="mt-2 text-sm text-red-600">{error}</p>
        <Link href="/admin/products" className="btn-secondary mt-4">
          Kembali ke daftar produk
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="animate-fade-up py-16">
        <h1 className="text-xl font-semibold">Produk tidak ditemukan</h1>
        <Link href="/admin/products" className="btn-secondary mt-4">
          Kembali ke daftar produk
        </Link>
      </div>
    );
  }

  return (
    <div>
      <nav className="text-sm text-ink-500">
        <Link href="/admin/products" className="hover:text-brand-700">
          Produk
        </Link>
        <span className="mx-2">/</span>
        <span>Edit</span>
      </nav>
      <div className="animate-fade-up mt-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
          <p className="mt-1 text-sm text-ink-500">
            SKU {product.sku} &middot; Tipe {product.typeCode}
          </p>
        </div>
        <Link href={`/product/${product.slug}`} className="btn-secondary">
          Lihat di katalog
        </Link>
      </div>

      <div className="animate-fade-up mt-6" style={{ animationDelay: "60ms" }}>
        <ProductForm
          initial={product}
          submitLabel="Simpan perubahan"
          onSubmit={async (input) => {
            await updateProduct(product.id, input);
            router.push("/admin/products");
          }}
          onDelete={async () => {
            await deleteProduct(product.id);
            router.push("/admin/products");
          }}
        />
      </div>
    </div>
  );
}
