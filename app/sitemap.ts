import type { MetadataRoute } from "next";
import { read } from "@/lib/db/store";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/track`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/policies/delivery`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/policies/returns`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/policies/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/policies/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];

  // Product pages come from the live catalogue; a database hiccup must not
  // break the sitemap, so fall back to the static entries only.
  try {
    const products = await read((db) =>
      db.products.filter((p) => p.status === "active" && !p.deletedAt).map((p) => ({ id: p.id, updated: p.createdAt }))
    );
    return [
      ...staticPages,
      ...products.map((p) => ({
        url: `${SITE_URL}/product/${p.id}`,
        lastModified: p.updated ? new Date(p.updated) : undefined,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ];
  } catch {
    return staticPages;
  }
}
