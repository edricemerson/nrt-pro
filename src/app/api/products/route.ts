import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminSession } from "@/lib/admin-session";
import { errorMessage } from "@/lib/api-error";
import { createProduct, listProducts } from "@/lib/db/products";
import type { ProductInput } from "@/lib/types";

/** GET /api/products - public, used by /buy and the admin product list. */
export async function GET() {
  try {
    const products = await listProducts();
    return NextResponse.json({ products });
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}

/** POST /api/products - admin only, used by /admin/products/new. */
export async function POST(req: NextRequest) {
  const admin = await verifyAdminSession(req.cookies.get(ADMIN_COOKIE_NAME)?.value);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const input = (await req.json()) as ProductInput;
    const product = await createProduct(input);
    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}
