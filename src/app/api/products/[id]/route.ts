import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminSession } from "@/lib/admin-session";
import { errorMessage } from "@/lib/api-error";
import { deleteProduct, getProductById, updateProduct } from "@/lib/db/products";
import type { ProductInput } from "@/lib/types";

/** GET /api/products/:id - public; the admin edit page loads by id. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const product = await getProductById(id);
    if (!product) return NextResponse.json({ product: null }, { status: 404 });
    return NextResponse.json({ product });
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}

/** PATCH /api/products/:id - admin only. Also backs the quick-edit stock/price fields. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await verifyAdminSession(req.cookies.get(ADMIN_COOKIE_NAME)?.value);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const patch = (await req.json()) as Partial<ProductInput>;
    const product = await updateProduct(id, patch);
    return NextResponse.json({ product });
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}

/** DELETE /api/products/:id - admin only. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await verifyAdminSession(req.cookies.get(ADMIN_COOKIE_NAME)?.value);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    await deleteProduct(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}
