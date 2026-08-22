// ============================================================
// MEDORA — submit a product review (public storefront API)
// Reviews land in the moderation queue (status "pending") and
// appear on the storefront once an admin approves them.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { nextId, read, write } from "@/lib/db/store";

export const dynamic = "force-dynamic";

const recent = new Map<string, number[]>();
const WINDOW = 60 * 60 * 1000;
const MAX_PER_HOUR = 3;

function rateLimited(key: string) {
  const now = Date.now();
  const hits = (recent.get(key) ?? []).filter((t) => now - t < WINDOW);
  if (hits.length >= MAX_PER_HOUR) return true;
  hits.push(now);
  recent.set(key, hits);
  return false;
}

export async function POST(request: NextRequest) {
  let body: { productId?: number; name?: string; rating?: number; title?: string; body?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "You've posted several reviews recently — please try again later." }, { status: 429 });
  }

  const productId = Number(body.productId);
  const name = String(body.name ?? "").trim().slice(0, 60);
  const rating = Math.min(5, Math.max(1, Math.round(Number(body.rating) || 0)));
  const title = String(body.title ?? "").trim().slice(0, 90);
  const text = String(body.body ?? "").trim().slice(0, 1200);

  if (!productId || !name || !rating) return NextResponse.json({ error: "Please add your name and a rating." }, { status: 400 });
  if (text.length < 10) return NextResponse.json({ error: "Please write at least a sentence about the product." }, { status: 400 });

  const product = await read((db) => db.products.find((p) => p.id === productId && !p.deletedAt && p.status === "active"));
  if (!product) return NextResponse.json({ error: "That product no longer exists." }, { status: 404 });

  return write(async (db) => {
    const review = {
      id: await nextId(db),
      productId,
      productName: product.name,
      productImage: product.image,
      customerId: 0,
      customerName: name,
      rating,
      title: title || `${rating}-star review`,
      body: text,
      status: "pending" as const,
      reply: null,
      reported: false,
      reportReason: null,
      spamScore: 0,
      verifiedPurchase: false,
      createdAt: new Date().toISOString(),
    };
    db.reviews.unshift(review);
    db.notifications.unshift({
      id: await nextId(db),
      type: "review",
      title: "New review awaiting approval",
      body: `${name} reviewed ${product.name} (${rating}★).`,
      at: review.createdAt,
      read: false,
      href: "/admin/reviews",
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  });
}
