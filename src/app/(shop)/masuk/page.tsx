"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { NrtProLogo, YamamaxProLogo } from "@/components/BrandLogos";
import { LocationPickerModal } from "@/components/LocationPickerModal";
import { WilayahSelects } from "@/components/WilayahSelects";
import type { DeliveryProfile, RegisterInput } from "@/lib/types";

const EMPTY_PROFILE: DeliveryProfile = {
  name: "",
  phone: "",
  altPhone: "",
  addressLabel: "rumah",
  address: "",
  province: "",
  city: "",
  district: "",
  postalCode: "",
  courierNote: "",
  coords: null,
};

const ADDRESS_LABELS: { id: DeliveryProfile["addressLabel"]; text: string }[] = [
  { id: "rumah", text: "Rumah" },
  { id: "kantor", text: "Kantor" },
  { id: "lainnya", text: "Lainnya" },
];

export default function MasukPage() {
  return (
    // useSearchParams needs a Suspense boundary to stay statically renderable.
    <Suspense
      fallback={<div className="px-4 py-24 text-center text-sm text-ink-500">Memuat...</div>}
    >
      <AuthScreen />
    </Suspense>
  );
}

function AuthScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const { customer, loading, signIn, register } = useAuth();

  // Buyers sent here from the cart come back to checkout once they are in.
  const next = params.get("next") ?? "/";
  const [tab, setTab] = useState<"masuk" | "daftar">(
    params.get("tab") === "daftar" ? "daftar" : "masuk",
  );

  useEffect(() => {
    if (!loading && customer) router.replace(next);
  }, [loading, customer, next, router]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <aside className="animate-fade-up hidden rounded-2xl bg-gradient-to-br from-ink-900 via-ink-800 to-ink-900 p-6 text-white lg:block">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white p-1.5">
              <NrtProLogo className="h-8 w-auto" />
            </div>
            <div className="rounded-lg bg-white p-1.5">
              <YamamaxProLogo className="h-7 w-auto" />
            </div>
          </div>
          <h2 className="mt-6 text-xl font-bold">Belanja lebih cepat</h2>
          <p className="mt-2 text-sm text-ink-300">
            Simpan alamat sekali, dan setiap pesanan berikutnya tinggal klik. Data ini
            kami pakai supaya kurir tidak salah antar.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {[
              "Alamat & nomor otomatis terisi di checkout",
              "Titik lokasi GPS supaya kurir mudah menemukan",
              "Catatan patokan untuk kurir",
              "Riwayat pesanan tersimpan",
            ].map((item) => (
              <li key={item} className="flex gap-2.5">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="mt-0.5 h-4 w-4 shrink-0 text-brand-400"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5zm4.36 7.4a.9.9 0 10-1.32-1.22l-4.2 4.55-1.9-1.9a.9.9 0 10-1.27 1.27l2.56 2.56a.9.9 0 001.3-.03l4.83-5.23z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-ink-300">{item}</span>
              </li>
            ))}
          </ul>
        </aside>

        <div className="animate-fade-up card p-6" style={{ animationDelay: "70ms" }}>
          <div className="flex gap-1 rounded-lg bg-ink-100 p-1">
            {(["masuk", "daftar"] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                  tab === id
                    ? "bg-white text-ink-900 shadow-sm"
                    : "text-ink-600 hover:text-ink-900"
                }`}
              >
                {id === "masuk" ? "Masuk" : "Daftar"}
              </button>
            ))}
          </div>

          <div key={tab} className="animate-fade-up">
            {tab === "masuk" ? (
              <SignInForm onSubmit={signIn} onSwitch={() => setTab("daftar")} />
            ) : (
              <RegisterForm onSubmit={register} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- masuk */

function SignInForm({
  onSubmit,
  onSwitch,
}: {
  onSubmit: (email: string, password: string) => Promise<unknown>;
  onSwitch: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await onSubmit(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal masuk.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <h1 className="text-lg font-bold">Masuk ke akun</h1>
      {error && <FormError message={error} />}

      <Field label="Email" htmlFor="email">
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nama@email.com"
          required
        />
      </Field>

      <Field label="Kata sandi" htmlFor="password">
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </Field>

      <button type="submit" className="btn-primary w-full" disabled={busy}>
        <Spinner show={busy} />
        {busy ? "Memproses..." : "Masuk"}
      </button>

      <p className="text-center text-sm text-ink-600">
        Belum punya akun?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="font-semibold text-brand-700 hover:underline"
        >
          Daftar sekarang
        </button>
      </p>
    </form>
  );
}

/* -------------------------------------------------------------------- daftar */

function RegisterForm({
  onSubmit,
}: {
  onSubmit: (input: RegisterInput) => Promise<unknown>;
}) {
  const [profile, setProfile] = useState<DeliveryProfile>(EMPTY_PROFILE);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showMap, setShowMap] = useState(false);

  function set<K extends keyof DeliveryProfile>(key: K, value: DeliveryProfile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Kata sandi minimal 8 karakter.");
      return;
    }
    if (password !== confirm) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setBusy(true);
    try {
      await onSubmit({ ...profile, email, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mendaftar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-6">
      <div>
        <h1 className="text-lg font-bold">Buat akun</h1>
        <p className="mt-1 text-sm text-ink-500">
          Isi sekali, dipakai untuk semua pesanan berikutnya.
        </p>
      </div>

      {error && <FormError message={error} />}

      <fieldset className="space-y-4">
        <Legend>Akun</Legend>
        <Field label="Email" htmlFor="reg-email">
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            required
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kata sandi" htmlFor="reg-password" hint="Minimal 8 karakter">
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </Field>
          <Field label="Ulangi kata sandi" htmlFor="reg-confirm">
            <input
              id="reg-confirm"
              type="password"
              autoComplete="new-password"
              className="input"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t border-ink-200 pt-6">
        <Legend>Data penerima</Legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama lengkap" htmlFor="reg-name">
            <input
              id="reg-name"
              className="input"
              autoComplete="name"
              value={profile.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Nama penerima paket"
              required
            />
          </Field>
          <Field
            label="Nomor HP / WhatsApp"
            htmlFor="reg-phone"
            hint="Dihubungi kurir saat mengantar"
          >
            <input
              id="reg-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className="input"
              value={profile.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="0812-xxxx-xxxx"
              required
            />
          </Field>
          <Field
            label="Nomor cadangan"
            htmlFor="reg-alt"
            hint="Opsional - satpam, keluarga, rekan kerja"
          >
            <input
              id="reg-alt"
              type="tel"
              inputMode="tel"
              className="input"
              value={profile.altPhone}
              onChange={(e) => set("altPhone", e.target.value)}
              placeholder="Opsional"
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t border-ink-200 pt-6">
        <Legend>Alamat pengiriman</Legend>

        <div>
          <span className="label">Jenis alamat</span>
          <div className="flex flex-wrap gap-2">
            {ADDRESS_LABELS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => set("addressLabel", opt.id)}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  profile.addressLabel === opt.id
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-ink-200 bg-white text-ink-700 hover:border-ink-300 hover:bg-ink-100"
                }`}
              >
                {opt.text}
              </button>
            ))}
          </div>
        </div>

        <Field
          label="Alamat lengkap"
          htmlFor="reg-address"
          hint="Jalan, nomor rumah, RT/RW, blok"
        >
          <textarea
            id="reg-address"
            className="input min-h-24"
            autoComplete="street-address"
            value={profile.address}
            onChange={(e) => set("address", e.target.value)}
            placeholder="Jl. Contoh No. 12, RT 03 / RW 05"
            required
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <WilayahSelects
            idPrefix="reg"
            value={{
              province: profile.province,
              city: profile.city,
              district: profile.district,
              postalCode: profile.postalCode,
            }}
            onChange={(patch) => setProfile((prev) => ({ ...prev, ...patch }))}
          />
        </div>

        <Field
          label="Patokan / catatan untuk kurir"
          htmlFor="reg-note"
          hint="Opsional - contoh: pagar hijau seberang masjid, titip satpam bila kosong"
        >
          <textarea
            id="reg-note"
            className="input min-h-20"
            value={profile.courierNote}
            onChange={(e) => set("courierNote", e.target.value)}
            placeholder="Rumah pagar hijau, seberang masjid"
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
            </div>
          </div>

          {profile.coords && (
            <p className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="animate-pop badge bg-emerald-100 text-emerald-800">Lokasi tersimpan</span>
              <span className="text-ink-600">
                {profile.coords.lat.toFixed(5)}, {profile.coords.lng.toFixed(5)}
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

          {showMap && (
            <LocationPickerModal
              parts={{
                address: profile.address,
                district: profile.district,
                city: profile.city,
                province: profile.province,
                postalCode: profile.postalCode,
              }}
              initial={profile.coords}
              onCancel={() => setShowMap(false)}
              onPick={(next) => {
                set("coords", next);
                setShowMap(false);
              }}
            />
          )}
        </div>
      </fieldset>

      <button type="submit" className="btn-primary w-full" disabled={busy}>
        <Spinner show={busy} />
        {busy ? "Menyimpan..." : "Daftar & simpan alamat"}
      </button>

      <p className="text-center text-xs text-ink-500">
        Dengan mendaftar kamu setuju data di atas dipakai untuk memproses dan mengantar
        pesanan. Kembali ke{" "}
        <Link href="/" className="underline">
          katalog
        </Link>
        .
      </p>
    </form>
  );
}

/* ---------------------------------------------------------------- primitives */

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

function Legend({ children }: { children: React.ReactNode }) {
  return (
    <legend className="text-xs font-bold uppercase tracking-[0.15em] text-brand-600">
      {children}
    </legend>
  );
}

function Spinner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <svg viewBox="0 0 24 24" fill="none" className="animate-spin-slow h-4 w-4" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function FormError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="animate-shake rounded-lg border border-brand-200 bg-brand-50 px-3.5 py-2.5 text-sm font-medium text-brand-700"
    >
      {message}
    </p>
  );
}
