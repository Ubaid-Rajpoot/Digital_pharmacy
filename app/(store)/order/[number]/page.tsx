"use client";

// Order confirmation — shown right after checkout. The order number comes
// from the URL; the phone is remembered (sessionStorage) purely to pull the
// order's live status. Without it we still confirm the order was placed.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import OrderStatusCard, { type TrackedOrder } from "@/components/OrderStatusCard";

export default function OrderConfirmationPage() {
  const params = useParams<{ number: string }>();
  const number = params?.number ?? "";
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "opaque">("loading");

  useEffect(() => {
    if (!number) return;
    let alive = true;
    let phone: string | null = null;
    try {
      phone = JSON.parse(sessionStorage.getItem("medora-last-order") ?? "null")?.phone ?? null;
    } catch {
      phone = null;
    }
    if (!phone) {
      setState("opaque");
      return;
    }
    fetch(`/api/store/track?number=${encodeURIComponent(number)}&phone=${encodeURIComponent(phone)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("not found"))))
      .then((data: TrackedOrder) => alive && (setOrder(data), setState("ready")))
      .catch(() => alive && setState("opaque"));
    return () => {
      alive = false;
    };
  }, [number]);

  return (
    <section className="sec" style={{ paddingTop: 72, paddingBottom: 110 }}>
      <div className="wrap" style={{ maxWidth: 900 }}>
        {state === "loading" ? (
          <p style={{ textAlign: "center", fontFamily: "var(--ff-m)", letterSpacing: ".18em", textTransform: "uppercase", fontSize: 12, color: "var(--blue)", padding: "60px 0" }}>
            Confirming your order…
          </p>
        ) : state === "ready" && order ? (
          <>
            <div style={{ textAlign: "center", marginBottom: 30 }}>
              <p style={{ fontSize: 52, margin: 0 }}>🎉</p>
              <span className="eyebrow">Thank you!</span>
              <h1 className="h-display" style={{ fontSize: "clamp(28px,4vw,44px)", margin: "12px 0 8px" }}>
                Your order is confirmed.
              </h1>
              <p className="sec-sub" style={{ margin: "0 auto" }}>
                A registered pharmacist is reviewing it now. Save your order number{" "}
                <b style={{ fontFamily: "var(--ff-m)" }}>{number}</b> — you&apos;ll need it (with your phone number) to track delivery.
              </p>
            </div>
            <OrderStatusCard order={order} />
          </>
        ) : (
          <div style={{ textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
            <p style={{ fontSize: 52, margin: 0 }}>🎉</p>
            <span className="eyebrow">Thank you!</span>
            <h1 className="h-display" style={{ fontSize: "clamp(28px,4vw,44px)", margin: "12px 0 8px" }}>
              Your order is confirmed.
            </h1>
            <p className="sec-sub" style={{ margin: "0 auto 26px" }}>
              We&apos;ve recorded order <b style={{ fontFamily: "var(--ff-m)" }}>{number}</b>. Track its progress any time with the
              order number and the phone number you ordered with.
            </p>
            <div style={{ display: "flex", gap: 13, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/track" className="btn btn-primary">Track your order</Link>
              <Link href="/#medicines" className="btn btn-ghost">Keep shopping</Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
