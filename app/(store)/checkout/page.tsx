"use client";

// ============================================================
// MEDORA — checkout
// Guest checkout: address → prescription (if needed) → coupon →
// payment method → place order. Totals shown here are indicative;
// the server recomputes everything from database prices.
// ============================================================

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/components/StoreProvider";
import { FREE_AT, productImage, rupees } from "@/lib/products";

const PAY_METHODS = [
  { id: "cod", label: "Cash on Delivery", desc: "Pay when your medicines arrive", icon: "💵" },
  { id: "upi", label: "UPI", desc: "GPay / PhonePe / Paytm (simulated)", icon: "📱" },
  { id: "card", label: "Card", desc: "Credit / debit, all networks (simulated)", icon: "💳" },
  { id: "netbanking", label: "Net Banking", desc: "All major banks (simulated)", icon: "🏦" },
];

const STATES = [
  "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
  "Odisha", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "Uttarakhand",
  "West Bengal",
];

type FieldProps = { label: string; error?: string; children: React.ReactNode };

function Field({ label, error, children }: FieldProps) {
  return (
    <label style={{ display: "grid", gap: 7 }}>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)" }}>{label}</span>
      {children}
      {error && <span style={{ fontSize: 11.5, color: "#d84b4b", fontWeight: 600 }}>{error}</span>}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 15px",
  borderRadius: 12,
  border: "1.6px solid var(--line2)",
  background: "#fff",
  fontSize: 14.5,
  fontFamily: "inherit",
  outline: "none",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, products, toast, rx, setRxOpen, clearCart, setRx, catalogReady } = useStore();

  const lines = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => ({ p: products.find((x) => x.id === Number(id)), qty }))
        .filter((l): l is { p: NonNullable<typeof l.p>; qty: number } => Boolean(l.p)),
    [cart, products]
  );

  const subtotal = lines.reduce((s, l) => s + l.p.price * l.qty, 0);
  const savings = lines.reduce((s, l) => s + (l.p.mrp - l.p.price) * l.qty, 0);
  const needsRx = lines.some((l) => l.p.rx);

  const [form, setForm] = useState({
    name: "", phone: "", email: "", line1: "", line2: "", city: "", state: "", pincode: "", notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [payMethod, setPayMethod] = useState("cod");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; label: string; discount: number; freeShipping: boolean } | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [placing, setPlacing] = useState(false);

  const discount = coupon?.discount ?? 0;
  const shipping = coupon?.freeShipping || subtotal >= FREE_AT || subtotal === 0 ? 0 : 49;
  const total = Math.max(0, subtotal - discount + shipping);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 3) errs.name = "Please enter your full name";
    if (form.phone.replace(/\D/g, "").length < 10) errs.phone = "Enter a valid 10-digit phone number";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "Enter a valid email";
    if (!form.line1.trim()) errs.line1 = "Flat / house / street is required";
    if (!form.city.trim()) errs.city = "City is required";
    if (!form.state) errs.state = "Select a state";
    if (!/^\d{6}$/.test(form.pincode.trim())) errs.pincode = "6-digit pincode";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    setCouponBusy(true);
    try {
      const res = await fetch("/api/store/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          items: lines.map((l) => ({ id: l.p.id, qty: l.qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCoupon(null);
        toast(data.error ?? "That coupon didn't work");
      } else {
        setCoupon(data);
        toast(`Coupon applied — ${data.label}`);
      }
    } catch {
      toast("Couldn't check that coupon — please try again");
    } finally {
      setCouponBusy(false);
    }
  };

  const placeOrder = async () => {
    if (!lines.length) {
      toast("Your care bag is empty");
      return;
    }
    if (needsRx && !rx) {
      toast("Please attach a prescription — your bag has Rx-only medicines");
      setRxOpen(true);
      return;
    }
    if (!validate()) {
      toast("Please fix the highlighted fields");
      return;
    }

    setPlacing(true);
    try {
      const res = await fetch("/api/store/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((l) => ({ id: l.p.id, qty: l.qty })),
          customer: { name: form.name, phone: form.phone, email: form.email },
          address: {
            line1: form.line1, line2: form.line2, city: form.city,
            state: form.state, pincode: form.pincode,
          },
          paymentMethod: payMethod,
          couponCode: coupon?.code ?? null,
          prescription: rx,
          notes: form.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "We couldn't place your order — please try again");
        return;
      }
      sessionStorage.setItem("medora-last-order", JSON.stringify({ number: data.number, phone: form.phone }));
      clearCart();
      setRx(null);
      router.push(`/order/${data.number}`);
    } catch {
      toast("Network hiccup — please try again");
    } finally {
      setPlacing(false);
    }
  };

  // ---- empty / loading states ----
  if (!catalogReady) {
    return (
      <section className="sec" style={{ paddingTop: 140, paddingBottom: 140, textAlign: "center" }}>
        <p style={{ fontFamily: "var(--ff-m)", color: "var(--blue)", letterSpacing: ".18em", textTransform: "uppercase", fontSize: 12 }}>
          Preparing checkout…
        </p>
      </section>
    );
  }

  if (!lines.length) {
    return (
      <section className="sec" style={{ paddingTop: 120, paddingBottom: 120 }}>
        <div className="wrap" style={{ textAlign: "center", maxWidth: 560 }}>
          <p style={{ fontSize: 56 }}>🧺</p>
          <h1 className="h-display" style={{ fontSize: "clamp(26px,3vw,36px)", margin: "10px 0 8px" }}>
            Your care bag is empty
          </h1>
          <p className="sec-sub" style={{ margin: "0 auto 24px" }}>
            Add a few things you need and come back — checkout takes under a minute.
          </p>
          <Link href="/#medicines" className="btn btn-primary">Browse Medicines</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="sec" style={{ paddingTop: 72, paddingBottom: 110 }}>
      <div className="wrap">
        <span className="eyebrow">Secure checkout</span>
        <h1 className="h-display" style={{ fontSize: "clamp(28px,3.6vw,42px)", margin: "12px 0 34px" }}>
          Almost there — where should we deliver?
        </h1>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) minmax(0,1fr)", gap: 28, alignItems: "start" }}>
          {/* ---------- left: form ---------- */}
          <div style={{ display: "grid", gap: 22 }}>
            {/* delivery details */}
            <div style={cardStyle}>
              <h2 style={h2Style}>📦 Delivery details</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Field label="Full name" error={errors.name}>
                  <input style={inputStyle} value={form.name} onChange={set("name")} placeholder="Ayesha Khan" autoComplete="name" />
                </Field>
                <Field label="Phone number" error={errors.phone}>
                  <input style={inputStyle} value={form.phone} onChange={set("phone")} placeholder="98765 43210" inputMode="tel" autoComplete="tel" />
                </Field>
                <Field label="Email (optional)" error={errors.email}>
                  <input style={inputStyle} value={form.email} onChange={set("email")} placeholder="you@example.com" type="email" autoComplete="email" />
                </Field>
                <Field label="Pincode" error={errors.pincode}>
                  <input style={inputStyle} value={form.pincode} onChange={set("pincode")} placeholder="400001" inputMode="numeric" maxLength={6} autoComplete="postal-code" />
                </Field>
                <Field label="Flat / house / street" error={errors.line1}>
                  <input style={inputStyle} value={form.line1} onChange={set("line1")} placeholder="12, Wellness Avenue" autoComplete="address-line1" />
                </Field>
                <Field label="Landmark / area (optional)">
                  <input style={inputStyle} value={form.line2} onChange={set("line2")} placeholder="Near City Care Hospital" autoComplete="address-line2" />
                </Field>
                <Field label="City" error={errors.city}>
                  <input style={inputStyle} value={form.city} onChange={set("city")} placeholder="Mumbai" autoComplete="address-level2" />
                </Field>
                <Field label="State" error={errors.state}>
                  <select style={inputStyle} value={form.state} onChange={set("state")}>
                    <option value="">Select state</option>
                    {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <div style={{ gridColumn: "1 / -1" }}>
                  <Field label="Delivery notes (optional)">
                    <input style={inputStyle} value={form.notes} onChange={set("notes")} placeholder="e.g. Call before delivery" />
                  </Field>
                </div>
              </div>
            </div>

            {/* prescription */}
            {(needsRx || rx) && (
              <div style={{ ...cardStyle, borderColor: needsRx && !rx ? "#e8b93f" : "var(--line2)" }}>
                <h2 style={h2Style}>🧾 Prescription</h2>
                {rx ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--mint)", borderRadius: 12, padding: "12px 14px" }}>
                    <span style={{ fontSize: 20 }}>✅</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <b style={{ fontSize: 13.5, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rx.name}</b>
                      <small style={{ color: "var(--green-d)" }}>Attached — our pharmacist will verify it before dispatch</small>
                    </div>
                    <button type="button" className="btn btn-ghost" style={{ padding: "9px 14px", fontSize: 12.5 }} onClick={() => setRxOpen(true)}>
                      Replace
                    </button>
                  </div>
                ) : (
                  <p style={{ color: "var(--ink2)", fontSize: 14, margin: 0, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                    <span style={{ flex: 1, minWidth: 220 }}>
                      Your bag contains <b>prescription-only</b> medicines. Please attach a valid prescription from your doctor.
                    </span>
                    <button type="button" className="btn btn-mint" style={{ padding: "11px 18px", fontSize: 13.5 }} onClick={() => setRxOpen(true)}>
                      Upload prescription
                    </button>
                  </p>
                )}
              </div>
            )}

            {/* payment */}
            <div style={cardStyle}>
              <h2 style={h2Style}>💳 Payment method</h2>
              <div style={{ display: "grid", gap: 10 }}>
                {PAY_METHODS.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setPayMethod(m.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 13, textAlign: "left",
                      padding: "13px 15px", borderRadius: 13,
                      border: payMethod === m.id ? "1.8px solid var(--blue)" : "1.5px solid var(--line2)",
                      background: payMethod === m.id ? "rgba(19,95,201,.05)" : "#fff",
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    <span style={{ fontSize: 19 }}>{m.icon}</span>
                    <span style={{ flex: 1 }}>
                      <b style={{ fontSize: 14, display: "block" }}>{m.label}</b>
                      <small style={{ color: "var(--ink2)" }}>{m.desc}</small>
                    </span>
                    <span style={{
                      width: 18, height: 18, borderRadius: "50%", flex: "none",
                      border: payMethod === m.id ? "6px solid var(--blue)" : "2px solid var(--line2)",
                    }} />
                  </button>
                ))}
              </div>
              {payMethod !== "cod" && (
                <p style={{ fontSize: 12, color: "var(--ink2)", background: "var(--mint)", borderRadius: 10, padding: "9px 13px", marginTop: 12 }}>
                  Demo store — online payments are simulated, no money moves. Wire Razorpay/Stripe in <code>app/api/store/orders</code> when going live.
                </p>
              )}
            </div>
          </div>

          {/* ---------- right: summary ---------- */}
          <div style={{ ...cardStyle, position: "sticky", top: 90 }}>
            <h2 style={h2Style}>🧺 Your order ({lines.reduce((s, l) => s + l.qty, 0)} items)</h2>
            <div style={{ display: "grid", gap: 13, maxHeight: 265, overflowY: "auto", paddingRight: 4 }}>
              {lines.map((l) => (
                <div key={l.p.id} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <img src={productImage(l.p, 90, 90)} alt="" style={{ width: 46, height: 46, borderRadius: 11, objectFit: "cover", border: "1px solid var(--line2)" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b style={{ fontSize: 12.5, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {l.p.rx && <span title="Prescription required" style={{ color: "#e8b93f" }}>℞ </span>}
                      {l.p.name}
                    </b>
                    <small style={{ color: "var(--ink2)" }}>× {l.qty} · {l.p.brand}</small>
                  </div>
                  <b style={{ fontSize: 13 }}>{rupees(l.p.price * l.qty)}</b>
                </div>
              ))}
            </div>

            {/* coupon */}
            <div style={{ display: "flex", gap: 9, marginTop: 17 }}>
              <input
                style={{ ...inputStyle, padding: "11px 13px", fontSize: 13.5 }}
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="Coupon code (try WELCOME15)"
              />
              <button
                type="button"
                className="btn btn-ghost"
                style={{ padding: "11px 16px", fontSize: 13, whiteSpace: "nowrap" }}
                onClick={() => void applyCoupon()}
                disabled={couponBusy || !couponInput.trim()}
              >
                {couponBusy ? "Checking…" : coupon ? "Change" : "Apply"}
              </button>
            </div>
            {coupon && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--mint)", borderRadius: 10, padding: "8px 12px", marginTop: 9, fontSize: 12.5 }}>
                <span style={{ color: "var(--green-d)", fontWeight: 700 }}>{coupon.code} · {coupon.label}</span>
                <button type="button" style={{ fontWeight: 800, color: "#d84b4b", background: "none", border: 0, cursor: "pointer", fontFamily: "inherit" }} onClick={() => { setCoupon(null); setCouponInput(""); }}>
                  Remove
                </button>
              </div>
            )}

            {/* totals */}
            <div style={{ display: "grid", gap: 9, marginTop: 17, paddingTop: 15, borderTop: "1.5px dashed var(--line2)", fontSize: 14 }}>
              <div style={rowStyle}><span>Subtotal</span><span>{rupees(subtotal)}</span></div>
              {savings > 0 && <div style={rowStyle}><span>You save on MRP</span><span style={{ color: "var(--green-d)", fontWeight: 700 }}>−{rupees(savings)}</span></div>}
              {discount > 0 && <div style={rowStyle}><span>Coupon ({coupon?.code})</span><span style={{ color: "var(--green-d)", fontWeight: 700 }}>−{rupees(discount)}</span></div>}
              <div style={rowStyle}><span>Delivery</span><span style={{ color: shipping === 0 ? "var(--green-d)" : "inherit", fontWeight: shipping === 0 ? 700 : 500 }}>{shipping === 0 ? "FREE" : rupees(shipping)}</span></div>
              <div style={{ ...rowStyle, fontSize: 17, fontWeight: 800, borderTop: "1.5px dashed var(--line2)", paddingTop: 12, marginTop: 3 }}>
                <span>Total</span><span>{rupees(total)}</span>
              </div>
            </div>

            <button type="button" className="btn btn-primary" style={{ width: "100%", marginTop: 18 }} onClick={() => void placeOrder()} disabled={placing}>
              {placing ? "Placing your order…" : `Place order · ${rupees(total)}`}
            </button>
            <p style={{ fontSize: 11.5, color: "var(--ink2)", textAlign: "center", marginTop: 11 }}>
              🔒 256-bit encrypted · Pharmacist-verified · <Link href="/policies/returns" style={{ textDecoration: "underline" }}>Easy refunds</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1.5px solid var(--line2)",
  borderRadius: 18,
  padding: "22px 24px",
  boxShadow: "var(--shadow-s)",
};

const h2Style: React.CSSProperties = {
  fontSize: 16, fontWeight: 800, marginBottom: 16, letterSpacing: ".01em",
};

const rowStyle: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", color: "var(--ink2)",
};
