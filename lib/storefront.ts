// ============================================================
// MEDORA — storefront catalog transformer (server-side)
// Maps the admin/MongoDB data model into the storefront shape
// the landing page components expect. The /api/store/catalog
// endpoint serves this so the storefront stays in sync with
// whatever the admin panel edits.
// ============================================================

import type { DbShape, Category, Product as DbProduct } from "@/lib/db/types";
import type { Product as StorefrontProduct } from "@/lib/products";

/** Admin category slug → storefront category code. */
const CODE_BY_SLUG: Record<string, string> = {
  prescription: "rx",
  vitamins: "vitamins",
  "diabetes-care": "diabetes",
  "heart-care": "heart",
  "skin-care": "skin",
  "baby-care": "baby",
  devices: "devices",
  "personal-care": "personal",
};

/** Storefront product tint per category code. */
const TINT_BY_CODE: Record<string, string> = {
  rx: "pm-mint",
  vitamins: "pm-peach",
  diabetes: "pm-mint",
  heart: "pm-blue",
  skin: "pm-peach",
  baby: "pm-lav",
  devices: "pm-blue",
  personal: "pm-lav",
};

function codeOf(cat: Category | undefined): string {
  if (!cat) return "rx";
  return CODE_BY_SLUG[cat.slug] ?? CODE_BY_SLUG[cat.name.toLowerCase().replace(/[^a-z]+/g, "-")] ?? cat.slug;
}

/** Pull the picsum seed out of an admin image URL, falling back to a derived seed. */
function seedFromUrl(url: string, fallback: string): string {
  const m = url?.match(/\/seed\/([^/?]+)/);
  return m ? m[1] : fallback;
}

function saltOf(specs: { label: string; value: string }[], name: string): string {
  const salt = specs.find((s) => s.label.toLowerCase().includes("salt") || s.label.toLowerCase().includes("composition"));
  if (salt?.value) return salt.value;
  const pack = specs.find((s) => s.label.toLowerCase().includes("pack"));
  if (pack?.value) return pack.value;
  return name;
}

/** Map one DB product to the storefront shape (used by the catalog, the
 *  product API and the /product/[id] page). */
export function mapProduct(db: DbShape, p: DbProduct): StorefrontProduct {
  const cat = db.categories.find((c) => c.id === p.categoryId);
  const subCat = p.subcategoryId ? db.categories.find((c) => c.id === p.subcategoryId && c.status === "active") : undefined;
  const code = codeOf(cat);
  const seed = seedFromUrl(p.image, `prod-${p.id}-${p.name.toLowerCase().replace(/[^a-z]+/g, "-").slice(0, 20)}`);
  return {
    id: p.id,
    name: p.name,
    brand: db.brands.find((b) => b.id === p.brandId)?.name ?? "Medora",
    cat: code,
    sub: subCat?.name ?? "",
    price: p.price,
    mrp: p.mrp || p.price,
    rating: p.rating,
    rev: p.reviews,
    seed,
    image: p.image,
    gallery: [p.image, ...(p.gallery ?? [])].filter(Boolean),
    tint: TINT_BY_CODE[code] ?? "pm-mint",
    rx: p.rx,
    stock: p.stock > 0 ? undefined : false,
    desc: p.description,
    salt: saltOf(p.specifications ?? [], p.name),
  };
}

export function buildStorefrontCatalog(db: DbShape) {
  const products: StorefrontProduct[] = db.products
    .filter((p) => !p.deletedAt && p.status === "active")
    .map((p) => mapProduct(db, p));

  const catsubs: Record<string, string[]> = {};
  const categories: {
    cat: string;
    name: string;
    count: number;
    subs: string[];
    image?: string;
    icon?: string;
  }[] = [];

  for (const parent of db.categories.filter((c) => !c.parentId && c.status === "active")) {
    const code = codeOf(parent);
    const subs = db.categories
      .filter((c) => c.parentId === parent.id && c.status === "active")
      .map((c) => c.name);
    const count = products.filter((p) => p.cat === code).length;
    catsubs[code] = subs;
    categories.push({
      cat: code,
      name: parent.name,
      count,
      subs,
      image: parent.image,
      icon: parent.icon,
    });
  }

  return { products, catsubs, categories };
}
