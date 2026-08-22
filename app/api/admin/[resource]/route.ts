import { NextRequest } from "next/server";
import { applyQuery, audit, clientIp, fail, handleError, ok, parseBody, parseQuery, productsSortValue } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { DEFAULT_ADMIN_PASSWORD, hashPassword } from "@/lib/password";
import { nextId, read, write } from "@/lib/db/store";
import type { DbShape } from "@/lib/db/types";

type Row = Record<string, unknown> & { id: number };

const RESOURCES = [
  "products", "categories", "brands", "dealers", "orders", "customers",
  "reviews", "inventory", "warehouses", "coupons", "content", "media", "support",
  "subscribers", "users", "notifications", "audit", "faqs", "menu",
  "purchaseOrders", "stockAdjustments", "flashSales", "socials", "roles",
] as const;
type Resource = (typeof RESOURCES)[number];

function collection(db: DbShape, r: Resource): Row[] {
  return db[r] as unknown as Row[];
}

function isResource(r: string): r is Resource {
  return (RESOURCES as readonly string[]).includes(r);
}

const RESOURCE_LABEL: Record<string, string> = {
  products: "Product", categories: "Category", brands: "Brand", dealers: "Dealer",
  orders: "Order", customers: "Customer", reviews: "Review", coupons: "Coupon",
  content: "Content", media: "Media", support: "Support item", subscribers: "Subscriber",
  users: "Admin user", notifications: "Notification", faqs: "FAQ", menu: "Menu link",
  purchaseOrders: "Purchase order", flashSales: "Flash sale",
};

export async function GET(request: NextRequest, ctx: { params: Promise<{ resource: string }> }) {
  try {
    const { resource } = await ctx.params;
    if (!isResource(resource)) return fail("Unknown resource.", 404);
    // warehouses & purchase orders belong to the inventory module
    await requireAuth(resource === "warehouses" ? "inventory" : resource);
    const q = parseQuery(request.nextUrl);
    return read((db) => {
      let rows = collection(db, resource);
      if (resource === "products" && q.filters?.deleted !== true) {
        rows = rows.filter((r) => !r.deletedAt);
      }
      if (resource === "orders" && !q.sort) {
        rows = [...rows].sort((a, b) => +new Date(String(b.createdAt)) - +new Date(String(a.createdAt)));
      }
      const result = applyQuery(rows, q, resource, (key, row) =>
        resource === "products" ? productsSortValue(db, key, row) : (row[key] as string | number | null | undefined)
      );
      // Never leak password hashes to the client.
      if (resource === "users" || resource === "customers") {
        result.items = result.items.map(({ passwordHash: _hidden, ...safe }) => safe);
      }
      return ok(result);
    });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ resource: string }> }) {
  try {
    const { resource } = await ctx.params;
    if (!isResource(resource)) return fail("Unknown resource.", 404);
    const user = await requireAuth(`${resource === "warehouses" ? "inventory" : resource}.create`);
    const body = await parseBody<Record<string, unknown>>(request);
    return write(async (db) => {
      const rows = collection(db, resource);
      const row: Row = { id: await nextId(db), createdAt: new Date().toISOString(), ...body };
      if (resource === "products") {
        row.deletedAt = null;
        row.sold = row.sold ?? 0;
        row.reviews = row.reviews ?? 0;
        row.rating = row.rating ?? 0;
        if (typeof row.mrp === "number" && typeof row.price === "number") {
          row.discount = Math.round((1 - row.price / row.mrp) * 100);
        }
        row.image = row.image || `https://picsum.photos/seed/prod-${row.id}/400/400`;
      }
      if (resource === "users") {
        // Optional plaintext `password` in the payload; defaults to the
        // seed default so every account can always sign in.
        row.passwordHash = hashPassword(
          typeof body.password === "string" && body.password ? body.password : DEFAULT_ADMIN_PASSWORD
        );
        delete row.password;
      }
      rows.unshift(row);
      if (resource === "brands") {
        for (const b of db.brands) {
          b.products = db.products.filter((p) => p.brandId === b.id && !p.deletedAt).length;
        }
      }
      audit(db, user.name, "created", `${RESOURCE_LABEL[resource] ?? resource} #${row.id}`, [], clientIp(request));
      return ok(row, { status: 201 });
    });
  } catch (e) {
    return handleError(e);
  }
}
