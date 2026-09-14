"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { LocationPickerModal } from "@/components/LocationPickerModal";
import { WilayahSelects } from "@/components/WilayahSelects";
import { listOrdersByCustomer } from "@/lib/api";
import { formatIDR } from "@/lib/format";
import type { DeliveryProfile, Order, OrderStatus } from "@/lib/types";

const ADDRESS_LABELS: { id: DeliveryProfile["addressLabel"]; text: string }[] = [
  { id: "rumah", text: "Rumah" },
  { id: "kantor", text: "Kantor" },
  { id: "lainnya", text: "Lainnya" },
];

const STATUS_TONE: Record<OrderStatus, string> = {
  menunggu_pembayaran: "bg-amber-100 text-amber-800",
  diproses: "bg-sky-100 text-sky-800",
  dikirim: "bg-indigo-100 text-indigo-800",
  selesai: "bg-emerald-100 text-emerald-800",
  dibatalkan: "bg-ink-100 text-ink-600",
};

const STATUS_TEXT: Record<OrderStatus, string> = {
  menunggu_pembayaran: "Menunggu pembayaran",
  diproses: "Diproses",
  dikirim: "Dikirim",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
};

export default function ProfilePage() {
  const router = useRouter();
  const { customer, loading, signOut } = useAuth();

  // Signed-out visitors have nothing to show here; bounce them to sign in and
  // send them straight back afterwards.
  useEffect(() => {
    if (!loading && !customer) router.replace("/masuk?next=/profile");
  }, [loading, customer, router]);

  if (loading || !customer) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-24 text-center text-sm text-ink-500">
        Memuat profil...
      </div>
    );
  }

  return (
    <div className="animate-fade-up mx-auto max-w-5xl px-4 py-10">
      <header className="flex flex-wrap items-center gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-600 text-lg font-bold text-white">
          {initialsOf(customer.name)}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold tracking-tight">
            {customer.name || "Pelanggan"}
          </h1>
          <p className="truncate text-sm text-ink-500">{customer.email}</p>
        </div>
        <button type="button" onClick={() => signOut()} className="btn-danger shrink-0">
          Keluar
        </button>
      </header>

      <p className="mt-2 text-xs text-ink-400">
        Anggota sejak {formatDate(customer.createdAt)}
      </p>

      <div className="mt-8 space-y-6">
        <DeliverySection />
        <PasswordSection />
        <OrderHistorySection customerId={customer.id} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ delivery info */

function DeliverySection() {
  const { customer, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<DeliveryProfile | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);

  if (!customer) return null;

  function startEditing() {
    if (!customer) return;
    const { id: _id, email: _email, createdAt: _createdAt, ...profile } = customer;
    void _id;
    void _email;
    void _createdAt;
    setForm(profile);
    setError(null);
    setEditing(true);
  }

  function set<K extends keyof DeliveryProfile>(key: K, value: DeliveryProfile[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  function captureLocation() {
    if (!("geolocation" in navigator)) {
      setGeoError("Browser ini tidak mendukung berbagi lokasi.");
      return;
    }
    setGeoBusy(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set("coords", { lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoBusy(false);
      },
      (err) => {
        setGeoBusy(false);
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? "Izin lokasi ditolak. Alamat tertulis tetap cukup."
            : "Lokasi tidak bisa diambil. Alamat tertulis tetap cukup.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setError(null);
    setBusy(true);
    try {
      await updateProfile(form);
      setEditing(false);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Data pengiriman</h2>
          <p className="mt-0.5 text-sm text-ink-500">
            Dipakai untuk mengisi checkout otomatis.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="badge bg-emerald-100 text-emerald-800">Tersimpan</span>
          )}
          {!editing && (
            <button type="button" onClick={startEditing} className="btn-secondary btn-sm">
              Ubah
            </button>
          )}
        </div>
      </div>

      {!editing || !form ? (
        <dl className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <Row label="Nama lengkap" value={customer.name} />
          <Row label="Nomor HP / WhatsApp" value={customer.phone} />
          <Row label="Nomor cadangan" value={customer.altPhone} />
          <Row
            label="Jenis alamat"
            value={
              ADDRESS_LABELS.find((l) => l.id === customer.addressLabel)?.text ?? "-"
            }
          />
          <Row label="Alamat lengkap" value={customer.address} wide />
          <Row label="Provinsi" value={customer.province} />
          <Row label="Kota / Kabupaten" value={customer.city} />
          <Row label="Kecamatan" value={customer.district} />
          <Row label="Kode pos" value={customer.postalCode} />
          <Row label="Patokan untuk kurir" value={customer.courierNote} wide />
          <Row
            label="Titik lokasi"
            value={
              customer.coords
                ? `${customer.coords.lat.toFixed(5)}, ${customer.coords.lng.toFixed(5)}`
                : ""
            }
            wide
          />
        </dl>
      ) : (
        <form onSubmit={save} className="mt-5 space-y-4">
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-brand-200 bg-brand-50 px-3.5 py-2.5 text-sm font-medium text-brand-700"
            >
              {error}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama lengkap" htmlFor="p-name">
              <input
                id="p-name"
                className="input"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
              />
            </Field>
            <Field label="Nomor HP / WhatsApp" htmlFor="p-phone">
              <input
                id="p-phone"
                type="tel"
                className="input"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                required
              />
            </Field>
            <Field label="Nomor cadangan" htmlFor="p-alt" hint="Opsional">
              <input
                id="p-alt"
                type="tel"
                className="input"
                value={form.altPhone}
                onChange={(e) => set("altPhone", e.target.value)}
              />
            </Field>
          </div>

          <div>
            <span className="label">Jenis alamat</span>
            <div className="flex flex-wrap gap-2">
              {ADDRESS_LABELS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => set("addressLabel", opt.id)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    form.addressLabel === opt.id
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-ink-200 bg-white text-ink-700 hover:border-ink-300 hover:bg-ink-100"
                  }`}
                >
                  {opt.text}
                </button>
              ))}
            </div>
          </div>

          <Field label="Alamat lengkap" htmlFor="p-address">
            <textarea
              id="p-address"
              className="input min-h-24"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              required
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <WilayahSelects
              idPrefix="p"
              value={{
                province: form.province,
                city: form.city,
                district: form.district,
                postalCode: form.postalCode,
              }}
              onChange={(patch) => setForm((f) => (f ? { ...f, ...patch } : f))}
            />
          </div>

          <Field
            label="Patokan / catatan untuk kurir"
            htmlFor="p-note"
            hint="Opsional - contoh: pagar hijau seberang masjid"
          >
            <textarea
              id="p-note"
              className="input min-h-20"
              value={form.courierNote}
              onChange={(e) => set("courierNote", e.target.value)}
            />
          </Field>

          <div className="rounded-lg border border-ink-200 bg-ink-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">Titik lokasi (opsional)</p>
                <p className="mt-0.5 text-xs text-ink-500">
                  Membantu kurir menemukan rumah di gang atau perumahan besar.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowMap(true)}
                  className="btn-secondary btn-sm"
                >
                  Pilih di peta
                </button>
                <button
                  type="button"
                  onClick={captureLocation}
                  className="btn-secondary btn-sm"
                  disabled={geoBusy}
                >
                  {geoBusy ? "Mengambil..." : "Perbarui lokasi"}
                </button>
              </div>
            </div>
            {form.coords && (
              <p className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="badge bg-emerald-100 text-emerald-800">
                  Lokasi tersimpan
                </span>
                <span className="text-ink-600">
                  {form.coords.lat.toFixed(5)}, {form.coords.lng.toFixed(5)}
                </span>
                <button
                  type="button"
                  onClick={() => set("coords", null)}
                  className="font-medium text-brand-700 hover:underline"
                >
                  Hapus
                </button>
              </p>
            )}
            {geoError && <p className="mt-3 text-xs text-brand-700">{geoError}</p>}

            {showMap && (
              <LocationPickerModal
                parts={{
                  address: form.address,
                  district: form.district,
                  city: form.city,
                  province: form.province,
                  postalCode: form.postalCode,
                }}
                initial={form.coords}
                onCancel={() => setShowMap(false)}
                onPick={(next) => {
                  set("coords", next);
                  setGeoError(null);
                  setShowMap(false);
                }}
              />
            )}
          </div>

          <div className="flex gap-2 border-t border-ink-200 pt-4">
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? "Menyimpan..." : "Simpan perubahan"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setEditing(false)}
              disabled={busy}
            >
              Batal
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------- password */

function PasswordSection() {
  const { changePassword } = useAuth();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function reset() {
    setCurrent("");
    setNext("");
    setConfirm("");
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (next.length < 8) {
      setError("Kata sandi baru minimal 8 karakter.");
      return;
    }
    if (next !== confirm) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }
    setBusy(true);
    try {
      await changePassword(current, next);
      reset();
      setOpen(false);
      setDone(true);
      window.setTimeout(() => setDone(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah kata sandi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Kata sandi</h2>
          <p className="mt-0.5 text-sm text-ink-500">
            Ganti secara berkala untuk menjaga akun tetap aman.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {done && <span className="badge bg-emerald-100 text-emerald-800">Diperbarui</span>}
          <button
            type="button"
            onClick={() => {
              reset();
              setOpen((v) => !v);
            }}
            className="btn-secondary btn-sm"
          >
            {open ? "Tutup" : "Ubah kata sandi"}
          </button>
        </div>
      </div>

      {open && (
        <form onSubmit={submit} className="mt-5 space-y-4">
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-brand-200 bg-brand-50 px-3.5 py-2.5 text-sm font-medium text-brand-700"
            >
              {error}
            </p>
          )}
          <Field label="Kata sandi saat ini" htmlFor="p-current">
            <input
              id="p-current"
              type="password"
              autoComplete="current-password"
              className="input"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Kata sandi baru" htmlFor="p-new" hint="Minimal 8 karakter">
              <input
                id="p-new"
                type="password"
                autoComplete="new-password"
                className="input"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                minLength={8}
                required
              />
            </Field>
            <Field label="Ulangi kata sandi baru" htmlFor="p-new2">
              <input
                id="p-new2"
                type="password"
                autoComplete="new-password"
                className="input"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </Field>
          </div>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Menyimpan..." : "Simpan kata sandi"}
          </button>
        </form>
      )}
    </section>
  );
}

/* ----------------------------------------------------------- order history */

function OrderHistorySection({ customerId }: { customerId: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listOrdersByCustomer(customerId)
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [customerId]);

  const spent = useMemo(
    () =>
      orders
        .filter((o) => o.status !== "dibatalkan")
        .reduce(
          (sum, o) =>
            sum +
            o.shippingCost +
            o.items.reduce((s, i) => s + i.unitPrice * i.qty, 0),
          0,
        ),
    [orders],
  );

  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Riwayat pesanan</h2>
          <p className="mt-0.5 text-sm text-ink-500">
            {loading
              ? "Memuat..."
              : orders.length === 0
                ? "Belum ada pesanan."
                : `${orders.length} pesanan - total ${formatIDR(spent)}`}
          </p>
        </div>
        <Link href="/buy" className="btn-secondary btn-sm shrink-0">
          Belanja lagi
        </Link>
      </div>

      {!loading && orders.length > 0 && (
        <ul className="mt-5 divide-y divide-ink-100">
          {orders.map((o) => {
            const total =
              o.shippingCost + o.items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
            return (
              <li key={o.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/order/${o.id}`}
                    className="font-medium hover:text-brand-700"
                  >
                    {o.orderNo}
                  </Link>
                  <p className="text-xs text-ink-500">
                    {formatDate(o.createdAt)} &middot; {o.items.length} jenis barang
                  </p>
                </div>
                <span className={`badge ${STATUS_TONE[o.status]}`}>
                  {STATUS_TEXT[o.status]}
                </span>
                <span className="w-28 shrink-0 text-right font-semibold">
                  {formatIDR(total)}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {!loading && orders.length === 0 && (
        <p className="mt-5 rounded-lg bg-ink-50 p-4 text-sm text-ink-600">
          Pesanan yang kamu buat setelah masuk akan muncul di sini.
        </p>
      )}
    </section>
  );
}

/* -------------------------------------------------------------- primitives */

function Row({
  label,
  value,
  wide,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">
        {label}
      </dt>
      <dd className={`mt-1 text-sm ${value ? "text-ink-900" : "text-ink-400"}`}>
        {value || "Belum diisi"}
      </dd>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
