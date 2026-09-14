import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminSession } from "@/lib/admin-session";

export const config = {
  matcher: ["/admin/:path*"],
};

/** Search engines must never index the back office, signed in or not. */
const NOINDEX = "noindex, nofollow, noarchive";

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === "/admin/login") {
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", NOINDEX);
    return res;
  }

  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const admin = await verifyAdminSession(token);

  if (!admin) {
    // Rewrite to the 404 page rather than redirecting to /admin/login.
    //
    // A redirect answers the question "does this shop have an admin panel?"
    // for anyone scanning /admin/products, /admin/finance and friends. A
    // rewritten 404 makes those paths indistinguishable from typos: same
    // status, same body. Legitimate admins go straight to /admin/login,
    // which is handled above and still works normally.
    //
    // Rewrite, not redirect, so the URL bar does not change and no
    // Location header leaks the login path.
    // Deliberately NO X-Robots-Tag here. Setting it would make this response
    // differ from an ordinary 404, and that difference is itself the tell -
    // a scanner could confirm the panel exists purely from the header. A 404
    // is not indexed anyway, so the header buys nothing and costs the
    // indistinguishability this whole branch is for.
    // Rewritten to a real route whose only job is to call notFound(), so Next
    // renders the ordinary 404 page with a real 404 status. Rewriting straight
    // to a non-existent path returns an empty 200 in a production build, and
    // passing `{ status: 404 }` here returns an empty 404 - both were measured.
    const res = NextResponse.rewrite(new URL("/tidak-ditemukan", req.url));

    // NOTE: do not delete the x-middleware-rewrite header here. It is not
    // informational - it is how Next performs the rewrite. Stripping it (to
    // hide that a rewrite happened) cancels the rewrite outright and returns
    // an empty 200, which is both broken and a louder tell than the header.
    // A remaining header difference is the accepted cost of a working 404.

    // Only emit a clearing Set-Cookie when a cookie was actually sent. Doing
    // it unconditionally would attach a Set-Cookie to every anonymous /admin/*
    // request and to nothing else on the site - which is itself a reliable
    // signal that the path is special.
    if (token) res.cookies.delete(ADMIN_COOKIE_NAME);

    return res;
  }

  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", NOINDEX);
  // Signed-in admin pages show stock, prices and revenue - never let a proxy
  // or shared browser cache hold on to them.
  res.headers.set("Cache-Control", "no-store, must-revalidate");
  return res;
}
