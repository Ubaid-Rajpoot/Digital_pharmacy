"use client";

// Shared order status display used by /order/[number] (confirmation)
// and /track. Receives the sanitized order shape returned by
// /api/store/track.

import Link from "next/link";
import { imageUrl, rupees } from "@/lib/products";

export type TrackedOrder = {
  number: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  total: number;
  subtotal: number;
  discount: number;
  shipping: number;
  city: string;
  items: { name: string; image: string; qty: number; price: number }[];
  timeline: { label: string; at: string; note?: string }[];
  tracking: { carrier: string; number: string; url: string } | null;
};

const STATUS_STEPS = ["pending", "processing", "packed", "shipped", "delivered"];

const STATUS_COPY: Record<string, { label: string; emoji: string }> = {
  pending: { label: "Order placed", emoji: "📝" },
  processing: { label: "Being verified", emoji: "🧑‍⚕️" },
  packed: { label: "Packed & labelled", emoji: "📦" },
  shipped: { label: "On the way", emoji: "🚚" },
  delivered: { label: "Delivered", emoji: "🎉" },
  cancelled: { label: "Cancelled", emoji: "✖️" },
  returned: { label: "Returned", emoji: "↩️" },
  refunded: { label: "Refunded", emoji: "💸" },
};

export default function OrderStatusCard({ order }: { order: TrackedOrder }) {
  const copy = STATUS_COPY[order.status] ?? STATUS_COPY.pending;
  const stepIndex = STATUS_STEPS.indexOf(order.status);
  const isBad = ["cancelled", "returned", "refunded"].includes(order.status);

  return (
    <div style={{ display: "grid", gap: 22 }}>
      {/* progress */}
      <div style={{ background: "#fff", border: "1.5px solid var(--line2)", borderRadius: 18, padding: "24px 26px", boxShadow: "var(--shadow-s)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <span className="eyebrow">Order {order.number}</span>
            <h2 className="h-display" style={{ fontSize: 26, margin: "8px 0 2px" }}>
              {copy.emoji} {copy.label}
            </h2>
            <small style={{ color: "var(--ink2)" }}>
              Placed {new Date(order.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
              {" · "}Delivering to {order.city}
            </small>
          </div>
          <div style={{ textAlign: "right" }}>
            <b style={{ fontSize: 20 }}>{rupees(order.total)}</b>
            <div>
              <small style={{ color: "var(--ink2)" }}>
                {order.paymentMethod.toUpperCase()} ·{" "}
                {order.paymentStatus === "paid" ? "Paid" : order.paymentStatus === "refunded" ? "Refunded" : "Payment on delivery"}
              </small>
            </div>
          </div>
        </div>

        {!isBad && (
          <div style={{ display: "flex", gap: 0, marginTop: 24 }} aria-hidden="true">
            {STATUS_STEPS.map((s, i) => (
              <div key={s} style={{ flex: 1, textAlign: "center", position: "relative" }}>
                {i > 0 && (
                  <span
                    style={{
                      position: "absolute", top: 13, left: "-50%", width: "100%", height: 3,
                      background: i <= stepIndex ? "var(--green)" : "var(--line2)", borderRadius: 3,
                    }}
                  />
                )}
                <span
                  style={{
                    position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 28, height: 28, borderRadius: "50%", fontSize: 12, fontWeight: 800,
                    background: i <= stepIndex ? "var(--green)" : "#fff", color: i <= stepIndex ? "#fff" : "var(--ink2)",
                    border: i <= stepIndex ? "none" : "2px solid var(--line2)",
                  }}
                >
                  {i < stepIndex ? "✓" : i + 1}
                </span>
                <small style={{ display: "block", marginTop: 7, fontSize: 10.5, fontWeight: 600, color: i <= stepIndex ? "var(--ink)" : "var(--ink2)" }}>
                  {(STATUS_COPY[s] ?? { label: s }).label}
                </small>
              </div>
            ))}
          </div>
        )}

        {order.tracking && (
          <p style={{ marginTop: 18, fontSize: 13, background: "var(--mint)", borderRadius: 10, padding: "9px 13px", color: "var(--green-d)", fontWeight: 600 }}>
            🚚 {order.tracking.carrier} · AWB {order.tracking.number}
          </p>
        )}
      </div>

      {/* items + totals */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr)", gap: 22, alignItems: "start" }}>
        <div style={{ background: "#fff", border: "1.5px solid var(--line2)", borderRadius: 18, padding: "22px 24px", boxShadow: "var(--shadow-s)" }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 15 }}>Items in this order</h3>
          <div style={{ display: "grid", gap: 13 }}>
            {order.items.map((i, idx) => (
              <div key={idx} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <img src={imageUrl(i.image, 90, 90)} alt="" style={{ width: 44, height: 44, borderRadius: 11, objectFit: "cover", border: "1px solid var(--line2)" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ fontSize: 12.5, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.name}</b>
                  <small style={{ color: "var(--ink2)" }}>× {i.qty}</small>
                </div>
                <b style={{ fontSize: 13 }}>{rupees(i.price * i.qty)}</b>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gap: 7, marginTop: 16, paddingTop: 13, borderTop: "1.5px dashed var(--line2)", fontSize: 13.5, color: "var(--ink2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Subtotal</span><span>{rupees(order.subtotal)}</span></div>
            {order.discount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Coupon savings</span><span style={{ color: "var(--green-d)", fontWeight: 700 }}>−{rupees(order.discount)}</span></div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Delivery</span><span>{order.shipping === 0 ? "FREE" : rupees(order.shipping)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--ink)", fontWeight: 800, fontSize: 15.5 }}>
              <span>Total</span><span>{rupees(order.total)}</span>
            </div>
          </div>
        </div>

        {/* history */}
        <div style={{ background: "#fff", border: "1.5px solid var(--line2)", borderRadius: 18, padding: "22px 24px", boxShadow: "var(--shadow-s)" }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 15 }}>Order history</h3>
          <div style={{ display: "grid", gap: 0 }}>
            {(order.timeline.length ? order.timeline : [{ label: "Order placed", at: order.createdAt }]).map((t, i, arr) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "18px 1fr", gap: 12 }}>
                <div style={{ display: "grid", justifyItems: "center" }}>
                  <span style={{ width: 11, height: 11, borderRadius: "50%", background: i === arr.length - 1 ? "var(--blue)" : "var(--green)", marginTop: 5 }} />
                  {i < arr.length - 1 && <span style={{ width: 2, flex: 1, background: "var(--line2)", marginBottom: 2 }} />}
                </div>
                <div style={{ paddingBottom: i < arr.length - 1 ? 16 : 0 }}>
                  <b style={{ fontSize: 13 }}>{t.label}</b>
                  {t.note && <small style={{ display: "block", color: "var(--ink2)", marginTop: 2 }}>{t.note}</small>}
                  <small style={{ display: "block", color: "var(--ink2)", opacity: 0.75, marginTop: 2, fontFamily: "var(--ff-m)", fontSize: 10.5 }}>
                    {new Date(t.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                  </small>
                </div>
              </div>
            ))}
          </div>
          <Link href="/track" className="btn btn-ghost" style={{ width: "100%", marginTop: 16, padding: "11px 16px", fontSize: 13 }}>
            Track this order anytime
          </Link>
        </div>
      </div>
    </div>
  );
}
