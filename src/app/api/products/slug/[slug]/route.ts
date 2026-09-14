import { NextRequest, NextResponse } from "next/server";
import { errorMessage } from "@/lib/api-error";
import { getProductBySlug } from "@/lib/db/products";

/** GET /api/products/slug/:slug - public; backs /product/[slug]. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const product = await getProductBySlug(slug);
    if (!product) return NextResponse.json({ product: null }, { status: 404 });
    return NextResponse.json({ product });
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}
