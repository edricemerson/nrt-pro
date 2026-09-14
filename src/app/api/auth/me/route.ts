import { NextRequest, NextResponse } from "next/server";
import { CUSTOMER_COOKIE_NAME, verifyCustomerSession } from "@/lib/customer-session";
import { getCustomerById } from "@/lib/db/customers";
import { errorMessage } from "@/lib/api-error";

export async function GET(req: NextRequest) {
  try {
    const session = await verifyCustomerSession(req.cookies.get(CUSTOMER_COOKIE_NAME)?.value);
    if (!session) return NextResponse.json({ customer: null });
    const customer = await getCustomerById(session.id);
    return NextResponse.json({ customer });
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}
