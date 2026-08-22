// ============================================================
// MEDORA — shared commerce rules (server-side)
// Pricing, shipping and coupon math used by the storefront
// order APIs. Totals are ALWAYS recomputed here from database
// prices — never trusted from the client.
// ============================================================

import type { Coupon, DbShape, OrderItem, Product } from "@/lib/db/types";

export const DEFAULT_PAYMENT_METHODS = [
  { id: "cod", label: "Cash on Delivery", enabled: true },
  { id: "upi", label: "UPI (GPay / PhonePe / Paytm)", enabled: true },
  { id: "card", label: "Credit / Debit Card", enabled: true },
  { id: "netbanking", label: "Net Banking", enabled: true },
];

/** Payment methods available to the storefront (from settings, with a sane fallback). */
export function paymentMethods(db: DbShape) {
  const methods = db.settings?.payments?.methods;
  if (Array.isArray(methods) && methods.some((m) => m.enabled)) return methods.filter((m) => m.enabled);
  return DEFAULT_PAYMENT_METHODS.filter((m) => m.enabled);
}

/** Standard shipping fee: flat from settings, free above the configured threshold. */
export function shippingFor(db: DbShape, subtotal: number, methodId = "standard") {
  const method =
    db.settings?.shipping?.methods?.find((m) => m.id === methodId && m.enabled) ??
    db.settings?.shipping?.methods?.find((m) => m.enabled) ??
    { cost: 49, freeAbove: 499 };
  return subtotal >= (method.freeAbove ?? 0) ? 0 : (method.cost ?? 49);
}

export type CouponCheck =
  | { ok: true; coupon: Coupon; discount: number; freeShipping: boolean; label: string }
  | { ok: false; reason: string };

/** Validate a coupon code against the cart and compute its discount. */
export function checkCoupon(db: DbShape, code: string, items: OrderItem[], subtotal: number): CouponCheck {
  const coupon = db.coupons.find((c) => c.code.toUpperCase() === code.trim().toUpperCase());
  if (!coupon) return { ok: false, reason: "That code doesn't exist." };
  if (coupon.status !== "active") return { ok: false, reason: "This code is no longer active." };
  const now = Date.now();
  if (+new Date(coupon.startsAt) > now) return { ok: false, reason: "This code isn't active yet." };
  if (+new Date(coupon.endsAt) < now) return { ok: false, reason: "This code has expired." };
  if (coupon.uses >= coupon.maxUses) return { ok: false, reason: "This code has been fully redeemed." };
  if (subtotal < coupon.minOrder) {
    return { ok: false, reason: `Add items worth Rs ${(coupon.minOrder - subtotal).toLocaleString("en-IN")} more to use this code.` };
  }

  // Scope check: category/brand coupons only apply to matching items.
  const eligible = (() => {
    if (coupon.appliesTo === "all") return items;
    if (coupon.appliesTo === "category") {
      return items.filter((i) => {
        const p = db.products.find((x) => x.id === i.productId);
        const cat = p && (p.subcategoryId ?? p.categoryId);
        // covers both the parent category and its subcategories
        return p && (p.categoryId === coupon.targetId || cat === coupon.targetId);
      });
    }
    if (coupon.appliesTo === "brand") return items.filter((i) => db.products.find((x) => x.id === i.productId)?.brandId === coupon.targetId);
    return items;
  })();
  if (eligible.length === 0) {
    return { ok: false, reason: "This code doesn't apply to the items in your bag." };
  }
  const eligibleSubtotal = eligible.reduce((s, i) => s + i.price * i.qty, 0);

  let discount = 0;
  let freeShipping = false;
  let label = coupon.code;
  switch (coupon.type) {
    case "percent":
      discount = Math.round((eligibleSubtotal * coupon.value) / 100);
      label = `${coupon.value}% off`;
      break;
    case "fixed":
      discount = Math.min(coupon.value, eligibleSubtotal);
      label = `Rs ${coupon.value} off`;
      break;
    case "bogo":
      // Buy-one-get-one on eligible items: every complete pair saves one unit.
      discount = eligible.reduce((s, i) => s + Math.floor(i.qty / 2) * i.price, 0);
      label = "Buy 1 Get 1 free";
      break;
    case "freeship":
      freeShipping = true;
      label = "Free delivery";
      break;
  }
  if (coupon.maxDiscount && discount > coupon.maxDiscount) discount = coupon.maxDiscount;
  return { ok: true, coupon, discount, freeShipping, label };
}

/** Build order items from validated cart lines, using authoritative DB prices. */
export function buildItems(db: DbShape, lines: { id: number; qty: number }[]) {
  const items: OrderItem[] = [];
  const problems: string[] = [];
  for (const line of lines) {
    const p: Product | undefined = db.products.find((x) => x.id === line.id && !x.deletedAt && x.status === "active");
    if (!p) {
      problems.push(`Product #${line.id} is no longer available.`);
      continue;
    }
    const qty = Math.max(1, Math.min(Math.floor(line.qty) || 1, 10));
    if (p.stock < qty) {
      problems.push(`${p.name}: only ${p.stock} left in stock.`);
      continue;
    }
    if (items.some((i) => i.productId === p.id)) continue; // ignore duplicate lines
    items.push({ productId: p.id, name: p.name, image: p.image, qty, price: p.price });
  }
  return { items, problems };
}

export const orderNumber = (id: number) => `MD-${String(24000 + id * 7)}`;
