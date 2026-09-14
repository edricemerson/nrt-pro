import { notFound } from "next/navigation";

// Rendered per-request. Left static, Next serves it with x-nextjs-cache and
// x-nextjs-prerender headers that an ordinary dynamic 404 does not carry,
// which would distinguish an /admin/* probe from a genuine mistyped URL.
export const dynamic = "force-dynamic";

/**
 * Rewrite target for unauthenticated /admin/* requests (see src/middleware.ts).
 *
 * It immediately calls notFound(), so Next renders app/not-found.tsx with a
 * real 404 status - the same page and status a mistyped URL produces. Doing it
 * through a real route matters: rewriting straight to a non-existent path
 * returns an empty 200 in a production build, and passing `{ status: 404 }` to
 * NextResponse.rewrite returns an empty 404. Both were tried; only this
 * renders an actual page.
 *
 * Visiting this URL directly also just 404s, so it leaks nothing.
 */
export default function TidakDitemukan(): never {
  notFound();
}
