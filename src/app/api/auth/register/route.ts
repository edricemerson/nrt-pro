import { NextRequest, NextResponse } from "next/server";
import { CUSTOMER_COOKIE_NAME, createCustomerSession } from "@/lib/customer-session";
import { DuplicateEmailError, registerCustomer } from "@/lib/db/customers";
import { errorMessage } from "@/lib/api-error";
import { validateEmail, validatePassword } from "@/lib/password-policy";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import type { RegisterInput } from "@/lib/types";

export async function POST(req: NextRequest) {
  const input = (await req.json()) as Partial<RegisterInput>;
  if (!input.email || !input.password || !input.name || !input.phone || !input.address) {
    return NextResponse.json({ error: "Data belum lengkap." }, { status: 400 });
  }

  // The browser checks these too, but anyone can POST here directly.
  const signups = rateLimit(`register:ip:${clientIp(req)}`, {
    limit: 5,
    windowMs: 60 * 60_000,
  });
  if (!signups.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak pendaftaran dari jaringan ini. Coba lagi nanti." },
      { status: 429, headers: { "Retry-After": String(signups.retryAfter) } },
    );
  }

  const badEmail = validateEmail(input.email);
  if (badEmail) return NextResponse.json({ error: badEmail }, { status: 400 });
  const badPassword = validatePassword(input.password);
  if (badPassword) return NextResponse.json({ error: badPassword }, { status: 400 });

  try {
    const customer = await registerCustomer(input as RegisterInput);
    const { token, expiresAt } = await createCustomerSession(
      customer.id,
      req.headers.get("user-agent") ?? "",
    );

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
    if (err instanceof DuplicateEmailError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}
