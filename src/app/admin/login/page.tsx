"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { NrtProLogo } from "@/components/BrandLogos";

export default function AdminLoginPage() {
  return (
    // useSearchParams needs a Suspense boundary to stay statically renderable.
    <Suspense fallback={null}>
      <LoginScreen />
    </Suspense>
  );
}

function LoginScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/admin/products";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Gagal masuk.");
      }
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal masuk.");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
      <form onSubmit={submit} className="animate-fade-up card w-full max-w-sm p-6">
        <div className="flex justify-center">
          <NrtProLogo className="h-10 w-auto" />
        </div>
        <h1 className="mt-4 text-center text-lg font-bold">Masuk Panel Admin</h1>

        {error && (
          <p
            role="alert"
            className="animate-shake mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <div className="mt-4 space-y-3">
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Kata sandi
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <button type="submit" className="btn-primary mt-5 w-full" disabled={busy}>
          {busy ? "Memproses..." : "Masuk"}
        </button>
      </form>
    </div>
  );
}
