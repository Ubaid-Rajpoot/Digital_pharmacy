// ============================================================
// MEDORA — single product (public storefront API)
// Serves one mapped product plus its approved reviews; used by
// the product detail page.
// ============================================================

import { NextResponse } from "next/server";
import { read } from "@/lib/db/store";
import { mapProduct } from "@/lib/storefront";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return read((db) => {
    const p = db.products.find((x) => x.id === Number(id) && !x.deletedAt && x.status === "active");
    if (!p) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    const reviews = db.reviews
      .filter((r) => r.productId === p.id && r.status === "approved")
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .map((r) => ({
        id: r.id, customerName: r.customerName, rating: r.rating,
        title: r.title, body: r.body, verifiedPurchase: r.verifiedPurchase,
        reply: r.reply, createdAt: r.createdAt,
      }));
    return NextResponse.json({ product: mapProduct(db, p), reviews });
  });
}
