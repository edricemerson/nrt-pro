"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { useAuth } from "@/components/AuthProvider";
import { AuthPromptModal } from "@/components/AuthPromptModal";
import { NrtProLogo, YamamaxProLogo } from "@/components/BrandLogos";

export function SiteHeader() {
  const { count } = useCart();
  const { customer, loading } = useAuth();
  const pathname = usePathname();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-ink-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:gap-6">
        <Link href="/" className="flex items-center gap-3" aria-label="NRT-PRO Power Tools - beranda">
          <NrtProLogo className="h-8 w-auto shrink-0 rounded-sm shadow-sm sm:h-10" />
          <span className="hidden h-8 w-px bg-ink-200 sm:block" />
          <YamamaxProLogo className="hidden h-7 w-auto sm:block" />
        </Link>

        <nav className="ml-auto flex items-center gap-1 text-sm">
          <Link
            href="/"
            onClick={(e) => {
              if (pathname === "/") {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            className={`rounded-lg px-3 py-2 font-medium transition-colors ${
              pathname === "/" ? "bg-ink-100 text-ink-900" : "text-ink-600 hover:bg-ink-100"
            }`}
          >
            Home
          </Link>
          <Link
            href="/buy"
            className={`rounded-lg px-3 py-2 font-medium transition-colors ${
              pathname === "/buy" ? "bg-ink-100 text-ink-900" : "text-ink-600 hover:bg-ink-100"
            }`}
          >
            Buy
          </Link>
          <Link href="/cart" className="btn-secondary ml-1 shrink-0 sm:ml-2">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121 0 2.1-.764 2.365-1.853l1.263-5.223H5.106M7.5 14.25L5.106 5.174M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
              />
            </svg>
            Keranjang
            {count > 0 && (
              // Keying on count restarts the pop animation on every change,
              // so adding a second item pops again instead of sitting still.
              <span
                key={count}
                className="animate-pop ml-1 rounded-full bg-brand-600 px-1.5 py-0.5 text-[11px] font-semibold text-white"
              >
                {count}
              </span>
            )}
          </Link>

          {!loading && !customer && (
            <Link
              href="/masuk"
              className={`ml-1 rounded-lg px-3 py-2 font-medium transition-colors ${
                pathname === "/masuk"
                  ? "bg-ink-100 text-ink-900"
                  : "text-ink-600 hover:bg-ink-100"
              }`}
            >
              Masuk
            </Link>
          )}

          {/* Always present, furthest right. Signed in, it's the account
              avatar and links straight to /profile. Signed out, it is a
              button (not a Link) so a click never navigates - it opens the
              sign-in prompt below instead, and hovering shows a tooltip. */}
          {loading ? (
            <span className="ml-1 h-9 w-9 shrink-0 animate-pulse rounded-full bg-ink-100" />
          ) : customer ? (
            <Link
              href="/profile"
              title={`${customer.name || "Profil"} - ${customer.email}`}
              aria-label="Profil saya"
              className={`ml-1 flex shrink-0 items-center gap-2 rounded-full border py-1 pl-1 pr-1 transition-colors sm:pr-3 ${
                pathname === "/profile"
                  ? "border-brand-300 bg-brand-50"
                  : "border-ink-200 bg-white hover:border-brand-300 hover:bg-brand-50"
              }`}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-600 text-[11px] font-bold text-white">
                {initialsOf(customer.name)}
              </span>
              <span className="hidden max-w-24 truncate font-medium text-ink-700 sm:block">
                {customer.name.split(" ")[0] || "Profil"}
              </span>
            </Link>
          ) : (
            <div className="group relative ml-1 shrink-0">
              <button
                type="button"
                onClick={() => setShowAuthPrompt(true)}
                aria-haspopup="dialog"
                className="flex shrink-0 items-center gap-2 rounded-full border border-ink-200 bg-white py-1 pl-1 pr-3 transition-colors hover:border-brand-300 hover:bg-brand-50"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink-100 text-ink-500">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <path d="M12 12a4.5 4.5 0 100-9 4.5 4.5 0 000 9zM4 20.25a8 8 0 0116 0 .75.75 0 01-.75.75H4.75a.75.75 0 01-.75-.75z" />
                  </svg>
                </span>
                <span className="hidden font-medium text-ink-700 sm:block">Profil</span>
              </button>

              {/* Hover tooltip - hidden on touch devices since there is no
                  hover state to trigger it there; the modal on click covers
                  that case instead. */}
              <div
                role="tooltip"
                className="pointer-events-none absolute right-0 top-full z-40 mt-2 hidden w-48 rounded-lg bg-ink-900 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 sm:block"
              >
                Kamu perlu masuk dulu untuk melihat profil
                <span className="absolute -top-1 right-4 h-2 w-2 rotate-45 bg-ink-900" />
              </div>
            </div>
          )}
        </nav>
      </div>

      {showAuthPrompt && (
        <AuthPromptModal
          onClose={() => setShowAuthPrompt(false)}
          message="Kamu perlu masuk atau membuat akun untuk melihat dan mengubah profil kamu."
          next="/profile"
        />
      )}
    </header>
  );
}

/** "Budi Santoso" -> "BS". Falls back to "?" for an empty name. */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}
