import { NextRequest, NextResponse } from "next/server";
import { errorMessage } from "@/lib/api-error";
import { CUSTOMER_COOKIE_NAME, verifyCustomerSession } from "@/lib/customer-session";
import { decrementStock } from "@/lib/db/products";

/**
 * POST /api/products/:id/decrement-stock  { qty }
 *
 * Requires a signed-in customer. Checkout still runs in the browser (there is
 * no `orders` table yet, so no server-side "create order" step to hide this
 * behind), but gating it on a session means an anonymous script can no longer
 * walk the catalogue zeroing stock - an attacker now has to register first,
 * which is attributable and revocable.
 *
 * This is a mitigation, not a fix. A determined signed-in user can still burn
 * stock. The real fix is moving order creation into a server route once
 * `orders` exists in Supabase, after which this endpoint should be called
 * internally and removed from the public surface entirely.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifyCustomerSession(req.cookies.get(CUSTOMER_COOKIE_NAME)?.value);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = (await req.json()) as { qty?: unknown };
    const qty = Number(body.qty);
    if (!Number.isInteger(qty) || qty <= 0 || qty > 1000) {
      return NextResponse.json({ error: "qty tidak valid." }, { status: 400 });
    }

    const product = await decrementStock(id, qty);
    if (!product) return NextResponse.json({ product: null }, { status: 404 });
    return NextResponse.json({ product });
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}
