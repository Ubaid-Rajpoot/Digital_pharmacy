// ============================================================
// MEDORA — place an order (public storefront API)
// Guest checkout: validates the cart against live DB prices and
// stock, applies coupons, creates/updates the customer record,
// and stores a real order the admin panel can fulfil.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { buildItems, checkCoupon, orderNumber, paymentMethods, shippingFor } from "@/lib/commerce";
import { nextId, read, write } from "@/lib/db/store";
import type { Customer, Order } from "@/lib/db/types";

export const dynamic = "force-dynamic";

type Body = {
  items?: { id: number; qty: number }[];
  customer?: { name?: string; phone?: string; email?: string };
  address?: { line1?: string; line2?: string; city?: string; state?: string; pincode?: string };
  paymentMethod?: string;
  couponCode?: string | null;
  prescription?: { url?: string; name?: string } | null;
  notes?: string | null;
};

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });
const digits = (s: string) => s.replace(/\D/g, "");

export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return bad("Invalid request body.");
  }

  const name = String(body.customer?.name ?? "").trim();
  const phone = String(body.customer?.phone ?? "").trim();
  const email = String(body.customer?.email ?? "").trim();
  const line1 = String(body.address?.line1 ?? "").trim();
  const line2 = String(body.address?.line2 ?? "").trim();
  const city = String(body.address?.city ?? "").trim();
  const state = String(body.address?.state ?? "").trim();
  const pincode = String(body.address?.pincode ?? "").trim();

  if (!body.items?.length) return bad("Your care bag is empty.");
  if (name.length < 3) return bad("Please enter your full name.");
  if (digits(phone).length < 10) return bad("Please enter a valid 10-digit phone number.");
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return bad("Please enter a valid email address.");
  if (!line1 || !city || !state) return bad("Please complete your delivery address.");
  if (!/^\d{6}$/.test(pincode)) return bad("Please enter a valid 6-digit pincode.");

  return write(async (db) => {
    const { items, problems } = buildItems(db, body.items!);
    if (problems.length) return bad(problems.join(" "), 409);
    if (!items.length) return bad("None of these items are available anymore.");

    // Rx-only products cannot be sold without an attached prescription.
    const needsRx = items.some((i) => db.products.find((p) => p.id === i.productId)?.rx);
    const prescription =
      body.prescription?.url
        ? { url: String(body.prescription.url), name: String(body.prescription.name ?? "prescription"), at: new Date().toISOString() }
        : null;
    if (needsRx && !prescription) {
      return bad("Your bag contains prescription-only medicines. Please attach a prescription first.", 409);
    }

    const method = paymentMethods(db).find((m) => m.id === body.paymentMethod);
    if (!method) return bad("That payment method isn't accepted.");

    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);

    let discount = 0;
    let couponCode: string | null = null;
    let freeShip = false;
    if (body.couponCode) {
      const check = checkCoupon(db, body.couponCode, items, subtotal);
      if (!check.ok) return bad(check.reason, 409);
      discount = check.discount;
      freeShip = check.freeShipping;
      couponCode = check.coupon.code;
    }

    const shipping = freeShip ? 0 : shippingFor(db, subtotal - discount);
    const total = Math.max(0, subtotal - discount + shipping);

    // Find or create the customer by phone (fallback: email).
    const phoneKey = digits(phone).slice(-10);
    let customer: Customer | undefined =
      db.customers.find((c) => digits(c.phone).slice(-10) === phoneKey) ??
      (email ? db.customers.find((c) => c.email.toLowerCase() === email.toLowerCase()) : undefined);
    if (!customer) {
      customer = {
        id: await nextId(db),
        name,
        email: email || "",
        phone,
        avatar: "",
        status: "active",
        joinedAt: new Date().toISOString(),
        lifetimeSpend: 0,
        orders: 0,
        rewardPoints: 0,
        tier: "Bronze",
        addresses: [],
        wishlist: [],
        passwordHash: "", // storefront customers are guest-only for now
      };
      db.customers.unshift(customer);
    }

    const now = new Date().toISOString();
    const order: Order = {
      id: await nextId(db),
      number: "",
      customerId: customer.id,
      customerName: name,
      customerEmail: email,
      phone,
      items,
      subtotal,
      discount,
      shipping,
      tax: 0,
      total,
      status: "pending",
      paymentMethod: method.id,
      paymentStatus: method.id === "cod" ? "pending" : "paid", // online methods are simulated
      address: { line1, line2, city, state, pincode, country: "India" },
      tracking: null,
      couponCode,
      notes: body.notes ? String(body.notes).slice(0, 500) : null,
      prescription,
      timeline: [{ label: "Order placed", at: now, note: method.id === "cod" ? undefined : "Payment received" }],
      createdAt: now,
    };
    order.number = orderNumber(order.id);

    // Stock / sold side effects.
    for (const item of items) {
      const p = db.products.find((x) => x.id === item.productId);
      if (p) {
        p.stock = Math.max(0, p.stock - item.qty);
        p.sold = (p.sold ?? 0) + item.qty;
      }
      const inv = db.inventory.find((i) => i.productId === item.productId);
      if (inv) inv.stock = Math.max(0, inv.stock - item.qty);
    }

    customer.orders += 1;
    customer.lifetimeSpend += total;
    customer.tier = customer.lifetimeSpend > 15000 ? "Platinum" : customer.lifetimeSpend > 8000 ? "Gold" : customer.lifetimeSpend > 3000 ? "Silver" : "Bronze";

    if (couponCode) {
      const coupon = db.coupons.find((c) => c.code === couponCode);
      if (coupon) coupon.uses += 1;
    }

    db.orders.unshift(order);
    db.notifications.unshift({
      id: await nextId(db),
      type: "order",
      title: `New order ${order.number}`,
      body: `${name} placed an order worth Rs ${total.toLocaleString("en-IN")} (${items.length} items, ${method.label}).`,
      at: now,
      read: false,
      href: "/admin/orders",
    });

    return NextResponse.json(
      { number: order.number, total, discount, shipping, subtotal, paymentMethod: method.id },
      { status: 201 }
    );
  });
}

// Lightweight contact lookup used by the checkout page to greet returning customers.
export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get("phone") ?? "";
  if (digits(phone).length < 10) return NextResponse.json({ known: false });
  return read((db) => {
    const phoneKey = digits(phone).slice(-10);
    const c = db.customers.find((x) => digits(x.phone).slice(-10) === phoneKey);
    return NextResponse.json({ known: Boolean(c), name: c?.name ?? null });
  });
}
