// ============================================================
// MEDORA — order tracking (public storefront API)
// Looks up an order by number, but only reveals it when the
// last 10 digits of the phone match (guest-checkout "login").
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { read } from "@/lib/db/store";

export const dynamic = "force-dynamic";

const digits = (s: string) => s.replace(/\D/g, "");

export async function GET(request: NextRequest) {
  const number = (request.nextUrl.searchParams.get("number") ?? "").trim().toUpperCase();
  const phone = (request.nextUrl.searchParams.get("phone") ?? "").trim();
  if (!number || digits(phone).length < 10) {
    return NextResponse.json({ error: "Enter your order number and the phone number you ordered with." }, { status: 400 });
  }

  return read((db) => {
    const order = db.orders.find((o) => o.number.toUpperCase() === number);
    if (!order || digits(order.phone).slice(-10) !== digits(phone).slice(-10)) {
      return NextResponse.json({ error: "We couldn't find an order with those details." }, { status: 404 });
    }
    return NextResponse.json({
      number: order.number,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      total: order.total,
      subtotal: order.subtotal,
      discount: order.discount,
      shipping: order.shipping,
      city: order.address.city,
      items: order.items.map((i) => ({ name: i.name, image: i.image, qty: i.qty, price: i.price })),
      timeline: order.timeline ?? [],
      tracking: order.tracking,
    });
  });
}
