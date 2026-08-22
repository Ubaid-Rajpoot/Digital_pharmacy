"use client";

import { useMemo } from "react";
import Reveal from "@/components/Reveal";
import { useStore } from "@/components/StoreProvider";
import ProductCard from "@/components/ProductCard";
import ProductToolbar from "@/components/ProductToolbar";
import { CATNAME } from "@/lib/products";

export default function ProductsSection() {
  const { products, categories, catalogReady, catalogError, retryCatalog, cat, sub, search } = useStore();
  const categoryNames = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.cat, c.name])) as Record<string, string>,
    [categories]
  );

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(
      (p) =>
        (cat === "all" || p.cat === cat) &&
        (sub === "" || p.sub === sub) &&
        (q === "" ||
          (p.name + " " + p.brand + " " + (categoryNames[p.cat] || CATNAME[p.cat] || "") + " " + (p.sub || "")).toLowerCase().includes(q))
    );
  }, [products, categoryNames, cat, sub, search]);

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
          {catalogError ? (
            <div className="prod-empty">
              <p style={{ fontSize: 40 }}>🩺</p>
              <p style={{ fontWeight: 800, margin: "8px 0 4px" }}>Catalogue unavailable</p>
              <p>{catalogError}</p>
              <button type="button" className="btn btn-primary" style={{ marginTop: 14 }} onClick={retryCatalog}>
                Try again
              </button>
            </div>
          ) : !catalogReady ? (
            <div className="prod-empty">
              <p style={{ fontSize: 40 }}>⏳</p>
              <p style={{ fontWeight: 800, margin: "8px 0 4px" }}>Loading live products…</p>
            </div>
          ) : list.length === 0 ? (
            <div className="prod-empty">
              <p style={{ fontSize: 40 }}>🌿</p>
              <p style={{ fontWeight: 800, margin: "8px 0 4px" }}>No products match</p>
              <p>Try a different search — or add an active product from the admin panel.</p>
            </div>
          ) : (
            list.map((p) => <ProductCard key={p.id} p={p} />)
          )}
        </div>
      </div>
    </section>
  );
}
