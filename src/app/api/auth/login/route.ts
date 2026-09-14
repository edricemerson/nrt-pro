import { NextRequest, NextResponse } from "next/server";
import { CUSTOMER_COOKIE_NAME, createCustomerSession, verifyCustomerCredentials } from "@/lib/customer-session";
import { getCustomerById } from "@/lib/db/customers";
import { errorMessage } from "@/lib/api-error";
import { clientIp, rateLimit, resetRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = (await req.json()) as { email?: unknown; password?: unknown };
    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
      return NextResponse.json({ error: "Email dan kata sandi wajib diisi." }, { status: 400 });
    }

    // Same message either way so the form cannot be used to probe which emails exist.
    const failed = NextResponse.json({ error: "Email atau kata sandi salah." }, { status: 401 });

    const ip = clientIp(req);
    const perIp = rateLimit(`login:ip:${ip}`, { limit: 20, windowMs: 15 * 60_000 });
    const perEmail = rateLimit(`login:email:${email.toLowerCase()}`, {
      limit: 10,
      windowMs: 15 * 60_000,
    });
    const blocked = !perIp.ok ? perIp : !perEmail.ok ? perEmail : null;
    if (blocked) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan masuk. Coba lagi nanti." },
        { status: 429, headers: { "Retry-After": String(blocked.retryAfter) } },
      );
    }

    const session = await verifyCustomerCredentials(email, password);
    if (!session) return failed;
    const customer = await getCustomerById(session.id);
    if (!customer) return failed;

    const { token, expiresAt } = await createCustomerSession(
      customer.id,
      req.headers.get("user-agent") ?? "",
    );

    resetRateLimit(`login:ip:${ip}`);
    resetRateLimit(`login:email:${email.toLowerCase()}`);

    const res = NextResponse.json({ customer });
    res.cookies.set(CUSTOMER_COOKIE_NAME, token, {
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
