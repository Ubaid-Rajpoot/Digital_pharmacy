"use client";

// Interactive part of the /product/[id] page: gallery, quantity +
// add-to-cart / wishlist actions and the review list + form.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/components/StoreProvider";
import { IconArrow, IconHeart } from "@/components/icons";
import { imageUrl, productImageSources, rupees, starStr, type Product } from "@/lib/products";

export type DetailReview = {
  id: number;
  customerName: string;
  rating: number;
  title: string;
  body: string;
  verifiedPurchase: boolean;
  reply: string | null;
  createdAt: string;
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.6px solid var(--line2)",
  background: "#fff", fontSize: 14, fontFamily: "inherit", outline: "none",
};

export default function ProductDetailView({
  product,
  specs,
  reviews,
}: {
  product: Product;
  specs: { label: string; value: string }[];
  reviews: DetailReview[];
}) {
  const router = useRouter();
  const { addToCart, toggleWish, wishlist, toast, openDrawer } = useStore();
  const sources = productImageSources(product);
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const wished = wishlist.includes(product.id);
  const inStock = product.stock !== false;
  const off = Math.round((1 - product.price / product.mrp) * 100);

  return (
    <div style={{ display: "grid", gap: 34 }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,.9fr) minmax(0,1.1fr)", gap: 34, alignItems: "start" }}>
        {/* gallery */}
        <div>
          <div className={`qv-media ${product.tint}`} style={{ borderRadius: 22, overflow: "hidden", position: "relative" }}>
            {product.rx && <span className="p-badge rx" style={{ position: "absolute", top: 14, left: 14 }}>Rx</span>}
            {!inStock && <span className="p-badge oos" style={{ position: "absolute", top: 14, left: 14 }}>Out of stock</span>}
            <img src={imageUrl(sources[active], 720, 720)} alt={product.name} style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }} />
          </div>
          {sources.length > 1 && (
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              {sources.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Image ${i + 1}`}
                  style={{
                    width: 64, height: 64, borderRadius: 13, overflow: "hidden", cursor: "pointer", padding: 0,
                    border: i === active ? "2.5px solid var(--blue)" : "1.5px solid var(--line2)",
                  }}
                >
                  <img src={imageUrl(s, 128, 128)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* info */}
        <div>
          <span className="p-brand" style={{ fontSize: 12.5 }}>{product.brand}{product.sub ? ` · ${product.sub}` : ""}</span>
          <h1 className="h-display" style={{ fontSize: "clamp(24px,3vw,34px)", margin: "8px 0 10px", letterSpacing: "-.01em" }}>
            {product.name}
          </h1>
          <div className="p-rate" style={{ marginBottom: 14 }}>
            <span className="stars">{starStr(product.rating)}</span> {product.rating}
            <span>({product.rev.toLocaleString("en-IN")} reviews)</span>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: 12, margin: "6px 0 4px" }}>
            <b style={{ fontSize: 30, letterSpacing: "-.02em" }}>{rupees(product.price)}</b>
            {product.mrp > product.price && (
              <>
                <s style={{ color: "var(--ink2)" }}>{rupees(product.mrp)}</s>
                <span className="save" style={{ color: "var(--green-d)", fontWeight: 800 }}>{off}% OFF</span>
              </>
            )}
          </div>
          <p style={{ color: "var(--ink2)", fontSize: 13, marginTop: 0 }}>Inclusive of all taxes</p>

          {product.rx && (
            <p style={{ fontSize: 13, background: "rgba(232,185,63,.12)", color: "#8a6d1d", borderRadius: 12, padding: "10px 14px", fontWeight: 600 }}>
              ℞ Prescription-only medicine — a valid prescription is required at checkout. Our pharmacist verifies every Rx before dispatch.
            </p>
          )}

          <p style={{ color: "var(--ink2)", lineHeight: 1.75, fontSize: 14.5 }}>{product.desc}</p>
          <p style={{ fontFamily: "var(--ff-m)", fontSize: 12.5, color: "var(--ink2)" }}>{product.salt}</p>

          {/* actions */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 20, flexWrap: "wrap" }}>
            <div className="qty" style={{ width: "fit-content" }}>
              <button type="button" aria-label="Decrease" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
              <span>{qty}</span>
              <button type="button" aria-label="Increase" onClick={() => setQty((q) => Math.min(10, q + 1))}>+</button>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!inStock}
              onClick={(e) => {
                addToCart(product.id, qty, e.currentTarget);
                openDrawer();
              }}
            >
              {inStock ? "Add to care bag" : "Out of stock"}
            </button>
            <button
              type="button"
              className="btn btn-mint"
              disabled={!inStock}
              onClick={(e) => {
                addToCart(product.id, qty, e.currentTarget);
                router.push("/checkout");
              }}
            >
              Buy now <IconArrow size={15} strokeWidth={2.4} />
            </button>
            <button
              type="button"
              className={`p-heart${wished ? " on" : ""}`}
              style={{ position: "static", width: 44, height: 44 }}
              onClick={() => toggleWish(product.id)}
              aria-label="Add to wishlist"
            >
              <IconHeart size={19} strokeWidth={2} />
            </button>
          </div>
          <p style={{ fontSize: 12, color: inStock ? "var(--green-d)" : "#d84b4b", fontWeight: 700, marginTop: 12 }}>
            {inStock ? "✓ In stock — dispatched in 24h" : "Currently out of stock — check back soon"}
          </p>
        </div>
      </div>

      {/* specs */}
      {specs.length > 0 && (
        <div style={{ background: "#fff", border: "1.5px solid var(--line2)", borderRadius: 18, padding: "24px 26px", boxShadow: "var(--shadow-s)" }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 14 }}>Product details</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "10px 26px" }}>
            {specs.map((s) => (
              <div key={s.label} style={{ display: "flex", gap: 10, fontSize: 13.5, borderBottom: "1px dashed var(--line2)", paddingBottom: 9 }}>
                <span style={{ color: "var(--ink2)", minWidth: 110, fontWeight: 600 }}>{s.label}</span>
                <b style={{ fontWeight: 600 }}>{s.value}</b>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* reviews */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr)", gap: 26, alignItems: "start" }}>
        <div style={{ background: "#fff", border: "1.5px solid var(--line2)", borderRadius: 18, padding: "24px 26px", boxShadow: "var(--shadow-s)" }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 16 }}>
            Customer reviews {reviews.length > 0 && <span style={{ color: "var(--ink2)", fontWeight: 600 }}>({reviews.length})</span>}
          </h2>
          {reviews.length === 0 ? (
            <p style={{ color: "var(--ink2)", fontSize: 14 }}>No reviews yet — be the first to share your experience.</p>
          ) : (
            <div style={{ display: "grid", gap: 18 }}>
              {reviews.map((r) => (
                <article key={r.id} style={{ borderBottom: "1px dashed var(--line2)", paddingBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                    <span className="stars" style={{ color: "#f2b203" }}>{starStr(r.rating)}</span>
                    <b style={{ fontSize: 13.5 }}>{r.title}</b>
                  </div>
                  <p style={{ margin: "0 0 6px", fontSize: 13.5, color: "var(--ink2)", lineHeight: 1.7 }}>{r.body}</p>
                  <small style={{ color: "var(--ink2)", fontSize: 11.5 }}>
                    — {r.customerName}
                    {r.verifiedPurchase && <span style={{ color: "var(--green-d)", fontWeight: 700 }}> · Verified purchase</span>}
                    {" · "}
                    {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </small>
                  {r.reply && (
                    <p style={{ margin: "10px 0 0", fontSize: 13, background: "var(--mint)", borderRadius: 10, padding: "9px 13px" }}>
                      <b>Medora pharmacist:</b> {r.reply}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
        <ReviewForm productId={product.id} />
      </div>
    </div>
  );
}

function ReviewForm({ productId }: { productId: number }) {
  const { toast } = useStore();
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || body.trim().length < 10) {
      toast("Add your name and a few words about the product");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/store/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, name, rating, title, body }),
      });
      const data = await res.json();
      if (!res.ok) toast(data.error ?? "Couldn't post that review");
      else {
        setDone(true);
        toast("Thank you! Your review is awaiting moderation 🌿");
      }
    } catch {
      toast("Network hiccup — please try again");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div style={{ background: "var(--mint)", border: "1.5px solid transparent", borderRadius: 18, padding: "26px 26px" }}>
        <p style={{ fontSize: 30, margin: "0 0 8px" }}>🌿</p>
        <b style={{ fontSize: 15 }}>Review received</b>
        <p style={{ fontSize: 13.5, color: "var(--green-d)", lineHeight: 1.7, margin: "8px 0 0" }}>
          Our team publishes reviews after a quick moderation check — usually within a day. Thanks for helping other families shop with confidence.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ background: "#fff", border: "1.5px solid var(--line2)", borderRadius: 18, padding: "24px 26px", boxShadow: "var(--shadow-s)", display: "grid", gap: 13 }}>
      <b style={{ fontSize: 15 }}>Write a review</b>
      <div style={{ display: "flex", gap: 4 }} role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            aria-pressed={rating === n}
            onClick={() => setRating(n)}
            style={{ fontSize: 22, background: "none", border: 0, cursor: "pointer", padding: "0 2px", color: n <= rating ? "#f2b203" : "var(--line2)" }}
          >
            ★
          </button>
        ))}
      </div>
      <input style={inputStyle} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
      <input style={inputStyle} placeholder="Review headline (optional)" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={90} />
      <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 92 }} placeholder="How did it work for you? Share your experience…" value={body} onChange={(e) => setBody(e.target.value)} maxLength={1200} />
      <button type="submit" className="btn btn-mint" disabled={busy}>
        {busy ? "Posting…" : "Submit review"}
      </button>
      <small style={{ color: "var(--ink2)", fontSize: 11.5 }}>
        Reviews are moderated before publishing. See our{" "}
        <Link href="/policies/terms" style={{ textDecoration: "underline" }}>posting guidelines</Link>.
      </small>
    </form>
  );
}
