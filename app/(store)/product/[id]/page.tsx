// Product detail page — server-rendered straight from MongoDB so it is
// SEO-friendly; interactive pieces (gallery, cart, reviews form) live in
// components/ProductDetailView.tsx.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { read } from "@/lib/db/store";
import { mapProduct } from "@/lib/storefront";
import ProductDetailView, { type DetailReview } from "@/components/ProductDetailView";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

async function loadProduct(id: string) {
  const numeric = Number(id);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return read((db) => {
    const p = db.products.find((x) => x.id === numeric && !x.deletedAt && x.status === "active");
    if (!p) return null;
    const category = db.categories.find((c) => c.id === p.categoryId);
    const reviews: DetailReview[] = db.reviews
      .filter((r) => r.productId === p.id && r.status === "approved")
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .map((r) => ({
        id: r.id, customerName: r.customerName, rating: r.rating, title: r.title,
        body: r.body, verifiedPurchase: r.verifiedPurchase, reply: r.reply, createdAt: r.createdAt,
      }));
    const related = db.products
      .filter((x) => x.categoryId === p.categoryId && x.id !== p.id && !x.deletedAt && x.status === "active" && x.stock > 0)
      .slice(0, 4)
      .map((x) => mapProduct(db, x));
    return {
      product: mapProduct(db, p),
      specs: p.specifications ?? [],
      categoryName: category?.name ?? "Shop",
      reviews,
      related,
      seo: { title: p.seoTitle || p.name, description: p.seoDescription || p.description },
    };
  });
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const data = await loadProduct(id);
    if (!data) return { title: "Product not found" };
    return {
      title: data.seo.title,
      description: data.seo.description.slice(0, 160),
      openGraph: { title: `${data.seo.title} — Medora`, description: data.seo.description.slice(0, 160) },
    };
  } catch {
    return { title: "Product" };
  }
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let data: Awaited<ReturnType<typeof loadProduct>> = null;
  try {
    data = await loadProduct(id);
  } catch {
    // database unreachable — fall through to notFound
  }
  if (!data) notFound();

  return (
    <section className="sec" style={{ paddingTop: 66, paddingBottom: 100 }}>
      <div className="wrap">
        {/* breadcrumb */}
        <nav aria-label="Breadcrumb" style={{ fontSize: 12.5, color: "var(--ink2)", marginBottom: 22, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href="/" style={{ color: "inherit" }}>Home</Link>
          <span>/</span>
          <Link href={`/#medicines`} style={{ color: "inherit" }}>{data.categoryName}</Link>
          <span>/</span>
          <span style={{ color: "var(--ink)", fontWeight: 600, maxWidth: "46ch", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {data.product.name}
          </span>
        </nav>

        <ProductDetailView product={data.product} specs={data.specs} reviews={data.reviews} />

        {data.related.length > 0 && (
          <div style={{ marginTop: 56 }}>
            <h2 className="h-display" style={{ fontSize: "clamp(22px,2.6vw,30px)", marginBottom: 20 }}>
              Pairs well with your <em className="leaf">care routine</em>
            </h2>
            <div className="prod-grid">
              {data.related.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
