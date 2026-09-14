import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  createAdminSession,
  verifyAdminCredentials,
} from "@/lib/admin-session";
import { errorMessage } from "@/lib/api-error";
import { clientIp, rateLimit, resetRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = (await req.json()) as {
      email?: unknown;
      password?: unknown;
    };
    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
      return NextResponse.json(
        { error: "Email dan kata sandi wajib diisi." },
        { status: 400 },
      );
    }

    // Two independent windows: per-IP stops one host spraying many accounts,
    // per-email stops a botnet spread across IPs hammering one account.
    const ip = clientIp(req);
    const perIp = rateLimit(`admin-login:ip:${ip}`, { limit: 10, windowMs: 15 * 60_000 });
    const perEmail = rateLimit(`admin-login:email:${email.toLowerCase()}`, {
      limit: 5,
      windowMs: 15 * 60_000,
    });
    const blocked = !perIp.ok ? perIp : !perEmail.ok ? perEmail : null;
    if (blocked) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan masuk. Coba lagi nanti." },
        { status: 429, headers: { "Retry-After": String(blocked.retryAfter) } },
      );
    }

    const admin = await verifyAdminCredentials(email, password);
    if (!admin) {
      return NextResponse.json({ error: "Email atau kata sandi salah." }, { status: 401 });
    }

    // A correct password clears the counters so a legitimate admin who
    // fat-fingered a few times is not locked out afterwards.
    resetRateLimit(`admin-login:ip:${ip}`);
    resetRateLimit(`admin-login:email:${email.toLowerCase()}`);

    const { token, expiresAt } = await createAdminSession(
      admin.id,
      req.headers.get("user-agent") ?? "",
    );

    const res = NextResponse.json({ admin });
    res.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });
    return res;
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}
