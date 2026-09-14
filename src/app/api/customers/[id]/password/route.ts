import { NextRequest, NextResponse } from "next/server";
import {
  CUSTOMER_COOKIE_NAME,
  deleteOtherCustomerSessions,
  verifyCustomerCredentials,
  verifyCustomerSession,
} from "@/lib/customer-session";
import { hashPassword, updatePasswordHash } from "@/lib/db/customers";
import { errorMessage } from "@/lib/api-error";
import { validatePassword } from "@/lib/password-policy";

/** PUT /api/customers/:id/password - a customer may only change their own password. */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifyCustomerSession(req.cookies.get(CUSTOMER_COOKIE_NAME)?.value);
  const { id } = await params;
  if (!session || session.id !== id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { currentPassword, nextPassword } = (await req.json()) as {
      currentPassword?: unknown;
      nextPassword?: unknown;
    };
    if (typeof currentPassword !== "string" || typeof nextPassword !== "string") {
      return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });
    }

    const badPassword = validatePassword(nextPassword);
    if (badPassword) return NextResponse.json({ error: badPassword }, { status: 400 });

    const verified = await verifyCustomerCredentials(session.email, currentPassword);
    if (!verified) {
      return NextResponse.json({ error: "Kata sandi lama salah." }, { status: 401 });
    }

    await updatePasswordHash(id, await hashPassword(nextPassword));

    // Evict every other session so a stolen one dies with the old password.
    // The caller keeps their own, so changing it does not log you out.
    await deleteOtherCustomerSessions(id, req.cookies.get(CUSTOMER_COOKIE_NAME)?.value);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}
