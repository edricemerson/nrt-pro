"use client";

import { useRef, useState } from "react";
import { ProductImage } from "@/components/ProductImage";
import { CATEGORIES } from "@/lib/categories";
import { formatNumber, parseNumber, slugify } from "@/lib/format";
import type { CategoryId, Product, ProductInput } from "@/lib/types";

const EMPTY: ProductInput = {
  sku: "",
  name: "",
  spec: "",
  typeCode: "",
  categoryId: "peralatan-lain",
  price: 0,
  stock: 10,
  packQty: 1,
  packUnit: "pcs",
  description: "",
  images: [],
  active: true,
};

export function ProductForm({
  initial,
  submitLabel,
  onSubmit,
  onDelete,
}: {
  initial?: Product;
  submitLabel: string;
  onSubmit: (input: ProductInput) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [form, setForm] = useState<ProductInput>(
    initial ? { ...initial } : { ...EMPTY },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState("");

  function set<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addImageUrl() {
    const url = imageUrl.trim();
    if (!url) return;
    set("images", [...form.images, url]);
    setImageUrl("");
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    // Prototype: files are read as data URLs and kept in localStorage.
    // In production upload to Supabase Storage and keep only the public URL.
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () =>
        setForm((f) => ({ ...f, images: [...f.images, String(reader.result)] }));
      reader.readAsDataURL(file);
    });
    if (fileRef.current) fileRef.current.value = "";
  }

  function moveImage(index: number, delta: number) {
    const next = [...form.images];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    set("images", next);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (!form.name.trim()) return setError("Nama barang wajib diisi.");
    if (!form.sku.trim()) return setError("SKU / tipe wajib diisi.");
    setError(null);
    setSaving(true);
    try {
      await onSubmit({
        ...form,
        name: form.name.trim(),
        sku: form.sku.trim().toUpperCase(),
        typeCode: (form.typeCode || form.sku).trim(),
        slug: initial?.slug ?? slugify(form.sku, form.name),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <section className="card p-5">
          <h2 className="font-semibold">Informasi barang</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="name">
                Nama barang
              </label>
              <input
                id="name"
                className="input"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Contoh: Hammer Drill 28mm"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="spec">
                Spesifikasi singkat
              </label>
              <input
                id="spec"
                className="input"
                value={form.spec}
                onChange={(e) => set("spec", e.target.value)}
                placeholder='Contoh: Free 5pcs Mata Bor & Betel 4.5J'
              />
              <p className="hint">Muncul di bawah nama barang pada katalog.</p>
            </div>
            <div>
              <label className="label" htmlFor="typeCode">
                Tipe
              </label>
              <input
                id="typeCode"
                className="input"
                value={form.typeCode}
                onChange={(e) => set("typeCode", e.target.value)}
                placeholder="HR28 HD"
              />
            </div>
            <div>
              <label className="label" htmlFor="sku">
                SKU
              </label>
              <input
                id="sku"
                className="input uppercase"
                value={form.sku}
                onChange={(e) => set("sku", e.target.value)}
                placeholder="HR28-HD"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="category">
                Kategori
              </label>
              <select
                id="category"
                className="input"
                value={form.categoryId}
                onChange={(e) => set("categoryId", e.target.value as CategoryId)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <p className="hint">
                {CATEGORIES.find((c) => c.id === form.categoryId)?.description}
              </p>
            </div>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-semibold">Deskripsi</h2>
          <textarea
            className="input mt-3 min-h-40"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Tulis kegunaan, isi paket, garansi, dan catatan penting lainnya."
          />
        </section>

        <section className="card p-5">
          <h2 className="font-semibold">Foto produk</h2>
          <p className="hint mt-0">Foto pertama dipakai sebagai thumbnail di katalog.</p>

          <div className="mt-4 flex flex-wrap gap-3">
            {form.images.map((src, i) => (
              <div key={i} className="animate-scale-in w-28">
                <div className="h-28 w-28 overflow-hidden rounded-lg border border-ink-200">
                  <ProductImage images={[src]} name={form.name} sku={form.sku || "FOTO"} />
                </div>
                <div className="mt-1 flex items-center justify-between gap-1">
                  <button
                    type="button"
                    className="btn-ghost btn-sm px-1.5"
                    onClick={() => moveImage(i, -1)}
                    disabled={i === 0}
                    aria-label="Geser kiri"
                  >
                    &larr;
                  </button>
                  <button
                    type="button"
                    className="btn-ghost btn-sm px-1.5"
                    onClick={() => moveImage(i, 1)}
                    disabled={i === form.images.length - 1}
                    aria-label="Geser kanan"
                  >
                    &rarr;
                  </button>
                  <button
                    type="button"
                    className="btn-sm px-1.5 text-xs font-medium text-red-600 hover:underline"
                    onClick={() => set("images", form.images.filter((_, j) => j !== i))}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
            {form.images.length === 0 && (
              <div className="animate-fade-in grid h-28 w-28 place-items-center rounded-lg border border-dashed border-ink-300 text-xs text-ink-400">
                Belum ada foto
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => fileRef.current?.click()}
            >
              Unggah dari komputer
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          <div className="mt-3 flex gap-2">
            <input
              className="input"
              placeholder="atau tempel URL gambar"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addImageUrl();
                }
              }}
            />
            <button type="button" className="btn-secondary shrink-0" onClick={addImageUrl}>
              Tambah
            </button>
          </div>
        </section>
      </div>

      <aside className="space-y-6">
        <section className="card p-5">
          <h2 className="font-semibold">Harga &amp; stok</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="label" htmlFor="price">
                Harga jual
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-500">
                  Rp
                </span>
                <input
                  id="price"
                  className="input pl-9"
                  inputMode="numeric"
                  value={formatNumber(form.price)}
                  onChange={(e) => set("price", parseNumber(e.target.value))}
                />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="stock">
                Stok
              </label>
              <input
                id="stock"
                className="input"
                inputMode="numeric"
                value={formatNumber(form.stock)}
                onChange={(e) => set("stock", parseNumber(e.target.value))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="packQty">
                  Isi per dos
                </label>
                <input
                  id="packQty"
                  className="input"
                  inputMode="numeric"
                  value={formatNumber(form.packQty)}
                  onChange={(e) => set("packQty", Math.max(1, parseNumber(e.target.value)))}
                />
              </div>
              <div>
                <label className="label" htmlFor="packUnit">
                  Satuan
                </label>
                <select
                  id="packUnit"
                  className="input"
                  value={form.packUnit}
                  onChange={(e) => set("packUnit", e.target.value as "pcs" | "set")}
                >
                  <option value="pcs">pcs</option>
                  <option value="set">set</option>
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-brand-600"
                checked={form.active}
                onChange={(e) => set("active", e.target.checked)}
              />
              Tampilkan di katalog
            </label>
          </div>
        </section>

        <section className="card p-5">
          {error && (
            <p
              role="alert"
              className="animate-shake mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          )}
          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving && (
              <svg viewBox="0 0 24 24" fill="none" className="animate-spin-slow h-4 w-4" aria-hidden>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            )}
            {saving ? "Menyimpan..." : submitLabel}
          </button>
          {onDelete && (
            <button
              type="button"
              className="btn-danger mt-2 w-full"
              onClick={async () => {
                if (window.confirm("Hapus produk ini dari katalog?")) await onDelete();
              }}
            >
              Hapus produk
            </button>
          )}
        </section>
      </aside>
    </form>
  );
}
