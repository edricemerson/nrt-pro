"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { useAuth } from "@/components/AuthProvider";
import { createOrder, getSettings, listProducts } from "@/lib/api";
import { formatIDR } from "@/lib/format";
import type { Order, Product, Settings } from "@/lib/types";

const SHIPPING_OPTIONS = [
  { id: "reguler", label: "Reguler (3-5 hari)", cost: 35000 },
  { id: "kargo", label: "Kargo (5-9 hari, barang berat)", cost: 65000 },
  { id: "instant", label: "Instan / same day", cost: 120000 },
  { id: "ambil", label: "Ambil sendiri di gudang", cost: 0 },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, clear } = useCart();
  const { customer } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [shipping, setShipping] = useState(SHIPPING_OPTIONS[0]);
  const [payment, setPayment] = useState<Order["paymentMethod"]>("transfer_bank");

  useEffect(() => {
    Promise.all([listProducts(), getSettings()])
      .then(([rows, s]) => {
        setProducts(rows);
        setSettings(s);
      })
      .catch((err) =>
        setLoadError(err instanceof Error ? err.message : "Gagal memuat data checkout."),
      );
  }, []);

  useEffect(() => {
    if (!customer) return;
    setName((v) => v || customer.name);
    setPhone((v) => v || customer.phone);
    setAddress((v) => v || formatSavedAddress(customer));
  }, [customer]);

  const rows = useMemo(
    () =>
      lines
        .map((line) => ({ line, product: products.find((p) => p.id === line.productId) }))
        .filter((r): r is { line: typeof lines[number]; product: Product } => Boolean(r.product)),
    [lines, products],
  );

  const subtotal = rows.reduce((sum, r) => sum + r.product.price * r.line.qty, 0);
  const total = subtotal + shipping.cost;
  const valid = name.trim() && phone.trim() && address.trim() && rows.length > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);

    const order = await createOrder({
      // Null for guest checkout; set so the buyer sees it in /profile history.
      customerId: customer?.id ?? null,
      customerName: name.trim(),
      customerPhone: phone.trim(),
      customerAddress: [
        address.trim(),
        customer?.courierNote ? `Patokan: ${customer.courierNote}` : "",
        customer?.coords
          ? `Titik lokasi: ${customer.coords.lat.toFixed(5)}, ${customer.coords.lng.toFixed(5)}`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
      shippingCost: shipping.cost,
      paymentMethod: payment,
      items: rows.map(({ line, product }) => ({
        productId: product.id,
        nameSnapshot: [product.name, product.spec].filter(Boolean).join(" "),
        skuSnapshot: product.sku,
        unitPrice: product.price,
        qty: line.qty,
      })),
    });

    clear();
    router.push(`/order/${order.id}`);
  }

  if (loadError) {
    return (
      <div className="animate-fade-up mx-auto max-w-6xl px-4 py-24 text-center">
        <h1 className="text-xl font-semibold">Gagal memuat checkout</h1>
        <p className="mt-2 text-sm text-red-600">{loadError}</p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="animate-fade-up mx-auto max-w-6xl px-4 py-24 text-center">
        <h1 className="text-xl font-semibold">Keranjang kosong</h1>
        <p className="mt-2 text-sm text-ink-600">Tambahkan barang dulu sebelum checkout.</p>
        <Link href="/buy" className="btn-primary mt-4">
          Ke katalog
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="animate-fade-up text-2xl font-bold tracking-tight">Checkout</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {!customer && (
            <div className="animate-fade-up card flex flex-wrap items-center justify-between gap-3 border-brand-200 bg-brand-50 p-4">
              <p className="text-sm text-ink-700">
                Punya akun? Masuk supaya alamat dan nomor terisi otomatis.
              </p>
              <Link href="/masuk?next=/checkout" className="btn-secondary btn-sm shrink-0">
                Masuk
              </Link>
            </div>
          )}

          <section className="animate-fade-up card p-5" style={{ animationDelay: "60ms" }}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">Data penerima</h2>
              {customer && (
                <span className="badge bg-emerald-100 text-emerald-800">
                  Terisi dari akun kamu
                </span>
              )}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="name">
                  Nama lengkap
                </label>
                <input
                  id="name"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama penerima"
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="phone">
                  Nomor HP / WhatsApp
                </label>
                <input
                  id="phone"
                  className="input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="address">
                  Alamat lengkap
                </label>
                <textarea
                  id="address"
                  className="input min-h-24"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Jalan, nomor, kelurahan, kecamatan, kota, kode pos"
                  required
                />
              </div>
            </div>
          </section>

          <section className="animate-fade-up card p-5" style={{ animationDelay: "120ms" }}>
            <h2 className="font-semibold">Pengiriman</h2>
            <div className="mt-3 space-y-2">
              {SHIPPING_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors ${
                    shipping.id === opt.id ? "border-brand-500 bg-brand-50" : "border-ink-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="shipping"
                    className="accent-brand-600"
                    checked={shipping.id === opt.id}
                    onChange={() => setShipping(opt)}
                  />
                  <span className="flex-1">{opt.label}</span>
                  <span className="font-medium">
                    {opt.cost === 0 ? "Gratis" : formatIDR(opt.cost)}
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="animate-fade-up card p-5" style={{ animationDelay: "180ms" }}>
            <h2 className="font-semibold">Pembayaran</h2>
            <div className="mt-3 space-y-2">
              {(
                [
                  ["transfer_bank", "Transfer bank"],
                  ["qris", "QRIS"],
                  ["cod", "Bayar di tempat (COD)"],
                ] as const
              ).map(([id, label]) => (
                <label
                  key={id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors ${
                    payment === id ? "border-brand-500 bg-brand-50" : "border-ink-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    className="accent-brand-600"
                    checked={payment === id}
                    onChange={() => setPayment(id)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            {payment === "transfer_bank" && settings && (
              <p className="animate-fade-in mt-3 rounded-lg bg-ink-50 p-3 text-sm text-ink-700">
                Transfer ke <strong>{settings.bankName} {settings.bankAccountNo}</strong> a.n.{" "}
                {settings.bankAccountName}. Pesanan diproses setelah pembayaran dikonfirmasi.
              </p>
            )}
          </section>
        </div>

        <aside className="animate-fade-up card h-fit p-5" style={{ animationDelay: "220ms" }}>
          <h2 className="font-semibold">Pesanan kamu</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {rows.map(({ line, product }) => (
              <li key={product.id} className="flex justify-between gap-3">
                <span className="min-w-0">
                  <span className="line-clamp-2 font-medium">{product.name}</span>
                  <span className="text-xs text-ink-500">
                    {product.typeCode} &times; {line.qty}
                  </span>
                </span>
                <span className="shrink-0 font-medium">
                  {formatIDR(product.price * line.qty)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-ink-200 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-600">Subtotal</dt>
              <dd>{formatIDR(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-600">Ongkos kirim</dt>
              <dd>{shipping.cost === 0 ? "Gratis" : formatIDR(shipping.cost)}</dd>
            </div>
          </dl>
          <div className="mt-4 flex justify-between border-t border-ink-200 pt-4">
            <span className="font-semibold">Total bayar</span>
            <span className="text-lg font-bold">{formatIDR(total)}</span>
          </div>
          <button type="submit" className="btn-primary mt-5 w-full" disabled={!valid || submitting}>
            {submitting && (
              <svg viewBox="0 0 24 24" fill="none" className="animate-spin-slow h-4 w-4" aria-hidden>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            )}
            {submitting ? "Memproses..." : "Buat pesanan"}
          </button>
        </aside>
      </div>
    </form>
  );
}

/** Flattens the saved profile into the single address box checkout already uses. */
function formatSavedAddress(c: {
  address: string;
  district: string;
  city: string;
  province: string;
  postalCode: string;
}): string {
  return [c.address, c.district, c.city, c.province, c.postalCode]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}
