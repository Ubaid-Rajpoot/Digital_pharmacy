"use client";

// Track an order — guest-friendly: order number + the phone number used at
// checkout. No login required, and the API only reveals the order when both
// match.

import { useState } from "react";
import OrderStatusCard, { type TrackedOrder } from "@/components/OrderStatusCard";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "14px 16px", borderRadius: 13, border: "1.6px solid var(--line2)",
  background: "#fff", fontSize: 15, fontFamily: "inherit", outline: "none",
};

export default function TrackPage() {
  const [number, setNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!number.trim() || phone.replace(/\D/g, "").length < 10) {
      setError("Enter your order number and the 10-digit phone number you ordered with.");
      return;
    }
    setBusy(true);
    setError(null);
    setOrder(null);
    try {
      const res = await fetch(`/api/store/track?number=${encodeURIComponent(number.trim())}&phone=${encodeURIComponent(phone.trim())}`);
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "We couldn't find that order.");
      else setOrder(data as TrackedOrder);
    } catch {
      setError("Network hiccup — please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="sec" style={{ paddingTop: 72, paddingBottom: 110 }}>
      <div className="wrap" style={{ maxWidth: 720 }}>
        <span className="eyebrow">Order tracking</span>
        <h1 className="h-display" style={{ fontSize: "clamp(28px,4vw,42px)", margin: "12px 0 8px" }}>
          Where&apos;s my care package?
        </h1>
        <p className="sec-sub" style={{ marginBottom: 26 }}>
          Enter the order number from your confirmation (looks like <b style={{ fontFamily: "var(--ff-m)" }}>MD-24xxx</b>) along with
          the phone number you used at checkout.
        </p>

        <form
          onSubmit={lookup}
          style={{ background: "#fff", border: "1.5px solid var(--line2)", borderRadius: 18, padding: "22px 24px", boxShadow: "var(--shadow-s)", display: "grid", gap: 15 }}
        >
          <label style={{ display: "grid", gap: 7 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700 }}>Order number</span>
            <input style={{ ...inputStyle, fontFamily: "var(--ff-m)" }} value={number} onChange={(e) => setNumber(e.target.value.toUpperCase())} placeholder="MD-24127" />
          </label>
          <label style={{ display: "grid", gap: 7 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700 }}>Phone number used at checkout</span>
            <input style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" inputMode="tel" />
          </label>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Looking up…" : "Track my order"}
          </button>
          {error && (
            <p style={{ margin: 0, fontSize: 13, color: "#d84b4b", fontWeight: 600, background: "rgba(216,75,75,.07)", borderRadius: 10, padding: "10px 13px" }}>
              {error}
            </p>
          )}
        </form>

        {order && (
          <div style={{ marginTop: 30 }}>
            <OrderStatusCard order={order} />
          </div>
        )}
      </div>
    </section>
  );
}
