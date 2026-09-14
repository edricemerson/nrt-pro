"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProductForm } from "@/components/ProductForm";
import { createProduct } from "@/lib/api";

export default function NewProductPage() {
  const router = useRouter();

  return (
    <div>
      <nav className="text-sm text-ink-500">
        <Link href="/admin/products" className="hover:text-brand-700">
          Produk
        </Link>
        <span className="mx-2">/</span>
        <span>Tambah produk</span>
      </nav>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">Tambah Produk</h1>
      <p className="mt-1 text-sm text-ink-500">
        Isi data barang, harga, stok, foto, dan kategori. Barang langsung muncul di katalog.
      </p>

      <div className="animate-fade-up mt-6" style={{ animationDelay: "60ms" }}>
        <ProductForm
          submitLabel="Simpan produk"
          onSubmit={async (input) => {
            await createProduct(input);
            router.push("/admin/products");
          }}
        />
      </div>
    </div>
  );
}
