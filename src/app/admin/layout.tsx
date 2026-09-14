"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageTransition } from "@/components/PageTransition";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "owner" | "admin" | "staff";
}

const NAV = [
  {
    href: "/admin/products",
    label: "Produk",
    icon: "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z",
  },
  {
    href: "/admin/finance",
    label: "Keuangan",
    icon: "M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0z",
  },
];

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);

  useEffect(() => {
    if (pathname === "/admin/login") return;
    fetch("/api/admin/auth/me")
      .then((res) => res.json())
      .then((body) => setAdmin(body.admin ?? null))
      .catch(() => setAdmin(null));
  }, [pathname]);

  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  // The login page has no sidebar/header chrome - it is its own centered screen.
  if (pathname === "/admin/login") return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-ink-50">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-ink-200 bg-white lg:flex">
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map((item) => {
            const active =
              item.href === "/admin/products"
                ? pathname === item.href || pathname.startsWith("/admin/products/")
                : pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink-600 hover:bg-ink-100 hover:text-ink-900"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  className="h-[1.1rem] w-[1.1rem]"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {admin && (
          <div className="border-t border-ink-200 p-3">
            <p className="truncate text-xs text-ink-500">
              Masuk sebagai <span className="font-medium text-ink-700">{admin.name}</span>
            </p>
            <button
              type="button"
              onClick={logout}
              className="mt-1.5 text-xs font-medium text-brand-700 hover:underline"
            >
              Keluar
            </button>
          </div>
        )}

        <div className="border-t border-ink-200 p-3">
          <Link
            href="/"
            className="btn-secondary w-full gap-1.5 hover:border-brand-300
              hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none
              focus-visible:ring-2 focus-visible:ring-brand-200"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
              />
            </svg>
            Lihat toko
          </Link>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex h-16 items-center gap-4 border-b border-ink-200 bg-white px-4 lg:px-8">
          <div className="flex gap-1 lg:hidden">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-100"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <Link
            href="/"
            className="btn-secondary btn-sm ml-auto gap-1.5 hover:border-brand-300
              hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none
              focus-visible:ring-2 focus-visible:ring-brand-200 lg:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-3.5 w-3.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
              />
            </svg>
            Lihat toko
          </Link>
        </header>
        <div className="p-4 lg:p-8">
          <PageTransition>{children}</PageTransition>
        </div>
      </div>
    </div>
  );
}
