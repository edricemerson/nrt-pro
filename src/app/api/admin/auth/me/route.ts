import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminSession } from "@/lib/admin-session";

/** GET /api/admin/auth/me - lets the admin sidebar show who is signed in. */
export async function GET(req: NextRequest) {
  const admin = await verifyAdminSession(req.cookies.get(ADMIN_COOKIE_NAME)?.value);
  return NextResponse.json({ admin });
}
