// ============================================================
// MEDORA — coupon validation (public storefront API)
// Preview what a coupon does to a bag before checkout.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { checkCoupon } from "@/lib/commerce";
import { read } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { code?: string; items?: { id: number; qty: number }[] };
  try {
    body = (await request.json()) as { code?: string; items?: { id: number; qty: number }[] };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const code = String(body.code ?? "").trim();
  if (!code) return NextResponse.json({ error: "Enter a coupon code." }, { status: 400 });

  return read((db) => {
    // Price the bag from authoritative DB values so a tampered client total
    // can't unlock a bigger discount.
    const items = (body.items ?? [])
      .map((l) => {
        const p = db.products.find((x) => x.id === l.id && !x.deletedAt && x.status === "active");
        return p ? { productId: p.id, name: p.name, image: p.image, qty: Math.max(1, Math.floor(l.qty) || 1), price: p.price } : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    if (!items.length) return NextResponse.json({ error: "Your bag is empty." }, { status: 400 });

    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const check = checkCoupon(db, code, items, subtotal);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 409 });

    return NextResponse.json({
      code: check.coupon.code,
      label: check.label,
      discount: check.discount,
      freeShipping: check.freeShipping,
    });
  });
}
