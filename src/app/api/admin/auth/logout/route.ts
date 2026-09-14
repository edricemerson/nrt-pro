import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, deleteAdminSession } from "@/lib/admin-session";

export async function POST(req: NextRequest) {
  await deleteAdminSession(req.cookies.get(ADMIN_COOKIE_NAME)?.value);
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(ADMIN_COOKIE_NAME);
  return res;
}
