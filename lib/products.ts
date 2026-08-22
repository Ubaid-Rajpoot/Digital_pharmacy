// Storefront product helpers, ported from the data embedded in
// medical_store2.html. The catalogue itself is served live from
// /api/store/catalog (MongoDB) — these are the shared display utilities.

export type Product = {
  id: number;
  name: string;
  brand: string;
  cat: string;
  /** Subcategory within `cat` — shown as filter pills on the storefront. */
  sub: string;
  price: number;
  mrp: number;
  rating: number;
  rev: number;
  seed: string;
  /** Optional image URL supplied by the live admin catalogue. */
  image?: string;
  /** Additional image seeds/URLs used by the quick-view product gallery. */
  gallery?: string[];
  tint: string;
  rx?: boolean;
  stock?: boolean; // undefined = in stock
  desc: string;
  salt: string;
};

export const CATNAME: Record<string, string> = {
  rx: "Prescription",
  vitamins: "Vitamins",
  diabetes: "Diabetes",
  heart: "Heart",
  skin: "Skin",
  baby: "Baby",
  devices: "Devices",
  personal: "Personal Care",
};

export const FREE_AT = 499; // free-delivery threshold (PKR)

export const rupees = (n: number) => "Rs " + n.toLocaleString("en-PK");
export const pctOff = (p: Product) => Math.round((1 - p.price / p.mrp) * 100);
export const starStr = (r: number) => "★".repeat(Math.round(r));
export const isInStock = (p: Product) => p.stock !== false;

/** picsum.photos url for a seed + dimensions */
export const pic = (seed: string, w: number, h: number) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

/** Resolve either a stored URL or one of the bundled image seeds. */
export const imageUrl = (source: string | undefined, w: number, h: number) => {
  if (!source) return "";
  return /^(?:https?:|\/|data:|blob:)/i.test(source) ? source : pic(source, w, h);
};

/** Resolve the main image for a product from live data, with a seed fallback. */
export const productImage = (product: Pick<Product, "image" | "seed">, w: number, h: number) =>
  imageUrl(product.image ?? product.seed, w, h);

/** Return all available product gallery sources, preserving live URLs. */
export const productImageSources = (product: Pick<Product, "image" | "seed" | "gallery">) => {
  const sources = [product.image, ...(product.gallery ?? [])].filter(
    (source): source is string => Boolean(source)
  );
  return sources.length ? sources : [product.seed];
};
