"use client";

import { useMemo } from "react";
import Reveal from "@/components/Reveal";
import { useStore } from "@/components/StoreProvider";
import ProductCard from "@/components/ProductCard";
import ProductToolbar from "@/components/ProductToolbar";
import { CATNAME } from "@/lib/products";

export default function ProductsSection() {
  const { products, cat, search } = useStore();

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(
      (p) =>
        (cat === "all" || p.cat === cat) &&
        (q === "" ||
          (p.name + " " + p.brand + " " + (CATNAME[p.cat] || "")).toLowerCase().includes(q))
    );
  }, [products, cat, search]);

  return (
    <section className="sec" id="medicines">
      <div className="wrap">
        <div className="sec-head">
          <Reveal>
            <span className="eyebrow">Curated by pharmacists</span>
            <h2 className="h-display">
              Loved &amp; reordered, <em className="leaf">week after week.</em>
            </h2>
          </Reveal>
        </div>
        <Reveal delay=".1s">
          <ProductToolbar />
        </Reveal>
        <div className="prod-grid">
          {list.length === 0 ? (
            <div className="prod-empty">
              <p style={{ fontSize: 40 }}>🌿</p>
              <p style={{ fontWeight: 800, margin: "8px 0 4px" }}>No matches yet</p>
              <p>Try a different search — or ask our pharmacist for guidance.</p>
            </div>
          ) : (
            list.map((p) => <ProductCard key={p.id} p={p} />)
          )}
        </div>
      </div>
    </section>
  );
}
