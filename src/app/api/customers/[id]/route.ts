import { NextRequest, NextResponse } from "next/server";
import { CUSTOMER_COOKIE_NAME, verifyCustomerSession } from "@/lib/customer-session";
import { updateDeliveryProfile } from "@/lib/db/customers";
import { errorMessage } from "@/lib/api-error";
import type { DeliveryProfile } from "@/lib/types";

/** PATCH /api/customers/:id - a customer may only update their own profile. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifyCustomerSession(req.cookies.get(CUSTOMER_COOKIE_NAME)?.value);
  const { id } = await params;
  if (!session || session.id !== id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const patch = (await req.json()) as Partial<DeliveryProfile>;
    const customer = await updateDeliveryProfile(id, patch);
    return NextResponse.json({ customer });
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}
