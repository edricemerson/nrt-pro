import { NextRequest, NextResponse } from "next/server";
import { CUSTOMER_COOKIE_NAME, deleteCustomerSession } from "@/lib/customer-session";

export async function POST(req: NextRequest) {
  await deleteCustomerSession(req.cookies.get(CUSTOMER_COOKIE_NAME)?.value);
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(CUSTOMER_COOKIE_NAME);
  return res;
}
