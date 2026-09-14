import Link from "next/link";

/**
 * Rendered per-request rather than prerendered.
 *
 * If this page is static, Next serves a genuine 404 with `x-nextjs-cache: HIT`
 * and `x-nextjs-prerender: 1`, while the middleware rewrite for an
 * unauthenticated /admin/* request renders dynamically and carries neither.
 * That header gap is enough to tell the two apart - which is exactly what the
 * rewrite exists to prevent - so both paths are forced down the same route.
 */
export const dynamic = "force-dynamic";

/**
 * App-wide 404.
 *
 * Also what an unauthenticated visitor gets for /admin/* - middleware rewrites
 * here instead of redirecting to the login page, so scanning for a back office
 * finds nothing that distinguishes it from a mistyped URL.
 */
export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink-50 px-4">
      <div className="w-full max-w-md text-center">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-600">404</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink-900">
          Halaman tidak ditemukan
        </h1>
        <p className="mt-2 text-sm text-ink-600">
          Alamat yang kamu buka tidak ada atau sudah dipindahkan.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/" className="btn-primary">
            Kembali ke beranda
          </Link>
          <Link href="/buy" className="btn-secondary">
            Lihat katalog
          </Link>
        </div>
      </div>
    </div>
  );
}
